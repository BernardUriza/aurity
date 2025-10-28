// =============================================================================
// Triage Intake API - POST /api/triage/intake
// =============================================================================
// Receives triage intake data (reason + symptoms) and stores ephemerally
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getStorageManager, BufferType } from '@/aurity/core/storage';
import { getAuthManager, Permission } from '@/aurity/core/governance';

export const runtime = 'nodejs';

interface TriageIntakePayload {
  reason: string;
  symptoms: string[];
  audioTranscription?: string;
  metadata?: {
    timestamp: number;
    duration?: number;
    source: string;
  };
}

/**
 * POST /api/triage/intake
 * Submit triage intake data
 */
export async function POST(request: NextRequest) {
  try {
    // Get session token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate session (stub implementation)
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

    // Parse request body
    const body: TriageIntakePayload = await request.json();

    // Validate required fields
    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Reason is required' },
        { status: 400 }
      );
    }

    if (!body.symptoms || !Array.isArray(body.symptoms) || body.symptoms.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'At least one symptom is required' },
        { status: 400 }
      );
    }

    // Check for PHI data (basic validation)
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b[A-Z]{2}\d{6}\b/,     // License/ID patterns
      /patient\s+name/i,
      /patient\s+id/i,
    ];

    const textToCheck = `${body.reason} ${body.symptoms.join(' ')} ${body.audioTranscription || ''}`;
    for (const pattern of phiPatterns) {
      if (pattern.test(textToCheck)) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Potential PHI detected. Remove patient identifiers.'
          },
          { status: 400 }
        );
      }
    }

    // Store triage data ephemerally (10 minutes TTL)
    const storage = getStorageManager();
    const triageData = {
      reason: body.reason,
      symptoms: body.symptoms,
      audioTranscription: body.audioTranscription,
      timestamp: body.metadata?.timestamp || Date.now(),
      duration: body.metadata?.duration,
      source: body.metadata?.source || 'triage-intake-form',
      userId: authContext.user.id,
    };

    const storeResult = await storage.storeBuffer(
      BufferType.TEMP_BUFFER,
      Buffer.from(JSON.stringify(triageData)),
      {
        source: 'triage-intake',
        timestamp: Date.now(),
        size: 0,
        tags: ['triage', 'intake', 'ephemeral', 'no-phi'],
      },
      600 // 10 minutes TTL
    );

    if (!storeResult.success) {
      return NextResponse.json(
        { error: 'Storage Error', message: storeResult.error },
        { status: 500 }
      );
    }

    // Return success with buffer ID
    return NextResponse.json(
      {
        success: true,
        bufferId: storeResult.data!.id,
        message: 'Triage intake stored successfully (ephemeral)',
        expiresAt: storeResult.data!.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Triage intake error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/triage/intake?bufferId=xxx
 * Retrieve triage intake data
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const authContext = await authManager.validateSession(sessionId);
    if (!authContext) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check permissions
    const canRead = authManager.checkPermission(authContext, Permission.READ_STORAGE);
    if (!canRead.allowed) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get bufferId from query
    const { searchParams } = new URL(request.url);
    const bufferId = searchParams.get('bufferId');

    if (!bufferId) {
      return NextResponse.json(
        { error: 'Missing bufferId parameter' },
        { status: 400 }
      );
    }

    // Retrieve from storage
    const storage = getStorageManager();
    const retrieveResult = await storage.getBuffer(bufferId);

    if (!retrieveResult.success) {
      return NextResponse.json(
        { error: retrieveResult.error },
        { status: 404 }
      );
    }

    const triageData = JSON.parse(retrieveResult.data!.data.toString());

    return NextResponse.json({
      success: true,
      data: triageData,
      metadata: {
        bufferId: retrieveResult.data!.id,
        createdAt: retrieveResult.data!.createdAt,
        expiresAt: retrieveResult.data!.expiresAt,
      },
    });
  } catch (error) {
    console.error('Retrieve triage error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
