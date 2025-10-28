// =============================================================================
// Triage Transcription API - POST /api/triage/transcribe
// =============================================================================
// Transcribes audio using OpenAI Whisper API
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthManager, Permission } from '@/aurity/core/governance';

export const runtime = 'nodejs';

/**
 * POST /api/triage/transcribe
 * Transcribe audio file using Whisper API
 */
export async function POST(request: NextRequest) {
  try {
    // Get session token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const authManager = getAuthManager();

    let sessionId: string;
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      sessionId = payload.sessionId;
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid token format' },
        { status: 401 }
      );
    }

    const authContext = await authManager.validateSession(sessionId);
    if (!authContext) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Check permissions
    const canWrite = authManager.checkPermission(authContext, Permission.WRITE_STORAGE);
    if (!canWrite.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if Whisper API key is configured
    const whisperApiKey = process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY;
    if (!whisperApiKey) {
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message: 'Whisper API key not configured. Set WHISPER_API_KEY or OPENAI_API_KEY in .env.local'
        },
        { status: 500 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string | null;
    const prompt = formData.get('prompt') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Audio file exceeds 25MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
    ];

    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: `Unsupported audio format: ${audioFile.type}. Allowed: webm, mp4, mpeg, wav, ogg, flac`
        },
        { status: 400 }
      );
    }

    // Prepare request to Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');

    if (language) {
      whisperFormData.append('language', language);
    }

    if (prompt) {
      whisperFormData.append('prompt', prompt);
    }

    // Optional: set response format
    whisperFormData.append('response_format', 'verbose_json');

    // Call OpenAI Whisper API
    const whisperResponse = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whisperApiKey}`,
        },
        body: whisperFormData,
      }
    );

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', errorText);

      return NextResponse.json(
        {
          error: 'Transcription Error',
          message: 'Failed to transcribe audio',
          details: whisperResponse.status === 401 ? 'Invalid API key' : errorText,
        },
        { status: whisperResponse.status }
      );
    }

    const transcriptionResult = await whisperResponse.json();

    // Extract segments and text
    const segments = transcriptionResult.segments || [];
    const fullText = transcriptionResult.text || '';

    // Check for PHI in transcription
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /patient\s+name/i,
      /patient\s+id/i,
      /my\s+name\s+is\s+[A-Z]/i,
    ];

    for (const pattern of phiPatterns) {
      if (pattern.test(fullText)) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Potential PHI detected in transcription. Audio may contain patient identifiers.',
            transcription: '[REDACTED - PHI detected]',
          },
          { status: 400 }
        );
      }
    }

    // Return transcription result
    return NextResponse.json({
      success: true,
      transcription: {
        text: fullText,
        segments: segments.map((seg: any) => ({
          id: crypto.randomUUID(),
          text: seg.text,
          timestamp: seg.start * 1000, // Convert to milliseconds
          confidence: seg.no_speech_prob ? 1 - seg.no_speech_prob : undefined,
          isFinal: true,
        })),
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
      },
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
