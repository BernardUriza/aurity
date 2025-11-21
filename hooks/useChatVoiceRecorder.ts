/**
 * useChatVoiceRecorder Hook
 *
 * Chat-specific voice recording hook que compone los hooks base SOLID:
 * - useRecorder: Dual MediaRecorder (chunked + continuous)
 * - useAudioAnalysis: VAD (Voice Activity Detection)
 * - useChunkProcessor: Upload chunks + polling
 *
 * Diferencias vs Medical Workflow:
 * - Session ID: chat_{user.sub} (user-scoped, ephemeral)
 * - Mode: "chat" (no HDF5 persistence)
 * - No patient metadata
 * - Immediate transcription (no workers)
 *
 * Architecture (SOLID):
 * ┌─────────────────────────────────────┐
 * │  useChatVoiceRecorder (Composer)    │
 * └─────────────────────────────────────┘
 *          ↓           ↓            ↓
 *   useRecorder   useAudioAnalysis  useChunkProcessor
 *   (Audio I/O)      (VAD)          (Backend)
 *
 * @example
 * const { isRecording, audioLevel, transcript, startRecording, stopRecording } =
 *   useChatVoiceRecorder({ userId: 'google-oauth2|123' });
 *
 * // Start recording
 * await startRecording();
 *
 * // Stop and get full transcript
 * const fullText = await stopRecording();
 */

import { useState, useCallback, useEffect } from 'react';
import { useRecorder } from './useRecorder';
import { useAudioAnalysis } from './useAudioAnalysis';
import { useChunkProcessor } from './useChunkProcessor';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';
const CHUNK_INTERVAL_MS = 30000; // 30s chunks

interface UseChatVoiceRecorderConfig {
  userId: string; // Auth0 user.sub
  onTranscriptUpdate?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseChatVoiceRecorderReturn {
  // Recording state
  isRecording: boolean;
  recordingTime: number;

  // VAD (Voice Activity Detection)
  audioLevel: number;
  isSilent: boolean;

  // Transcription
  liveTranscript: string; // Concatenated transcript from all chunks
  chunkCount: number;
  isTranscribing: boolean;

  // Controls
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>; // Returns full transcript

  // Metrics
  avgLatency: number;
  backendHealth: 'healthy' | 'degraded' | 'down';
}

export function useChatVoiceRecorder(
  config: UseChatVoiceRecorderConfig
): UseChatVoiceRecorderReturn {
  const { userId, onTranscriptUpdate, onError } = config;

  // Generate session ID: chat_{user.sub}
  const sessionId = `chat_${userId}`;

  // State
  const [liveTranscript, setLiveTranscript] = useState('');
  const [chunkCount, setChunkCount] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // ========================================================================
  // CHUNK PROCESSOR (Upload + Polling)
  // ========================================================================
  const {
    pollJobStatus,
    avgLatency,
    backendHealth,
    addLog,
    resetMetrics,
  } = useChunkProcessor({
    backendUrl: BACKEND_URL,
    maxAttempts: 30, // 30s timeout for chat (Azure Whisper can be slow)
    pollInterval: 500, // Poll every 500ms (faster than medical)
  });

  // ========================================================================
  // CHUNK UPLOAD HANDLER
  // ========================================================================
  const handleChunk = useCallback(
    async (blob: Blob, chunkNumber: number) => {
      console.log(`[Chat Voice] Chunk ${chunkNumber} captured (${blob.size} bytes)`);
      setChunkCount((prev) => prev + 1);
      setIsTranscribing(true);

      try {
        // Upload chunk to backend with mode=chat
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('chunk_number', chunkNumber.toString());
        formData.append('mode', 'chat'); // CRITICAL: chat mode (ephemeral)
        formData.append('audio', blob, 'chunk.webm');

        const uploadResponse = await fetch(`${BACKEND_URL}/api/workflows/aurity/stream`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        const result = await uploadResponse.json();
        console.log(`[Chat Voice] Chunk ${chunkNumber} uploaded, polling job ${result.session_id}...`);
        addLog(`Chunk ${chunkNumber} uploaded (${(blob.size / 1024).toFixed(1)}KB)`);

        // Poll for transcription result (immediate for chat mode)
        const transcript = await pollJobStatus(sessionId, chunkNumber);

        if (transcript) {
          console.log(`[Chat Voice] Chunk ${chunkNumber} transcribed: "${transcript}"`);

          // Append to live transcript
          setLiveTranscript((prev) => {
            const updated = prev ? `${prev} ${transcript}` : transcript;
            if (onTranscriptUpdate) {
              onTranscriptUpdate(updated);
            }
            return updated;
          });
        } else {
          console.warn(`[Chat Voice] Chunk ${chunkNumber} returned empty transcript`);
          addLog(`⚠️ Chunk ${chunkNumber} sin transcripción`);
        }
      } catch (err) {
        console.error(`[Chat Voice] Chunk ${chunkNumber} processing error:`, err);
        const errorMsg = err instanceof Error ? err.message : 'Error procesando audio';
        addLog(`❌ Chunk ${chunkNumber}: ${errorMsg}`);
        if (onError) {
          onError(errorMsg);
        }
      } finally {
        setIsTranscribing(false);
      }
    },
    [sessionId, pollJobStatus, addLog, onTranscriptUpdate, onError]
  );

  // ========================================================================
  // RECORDER (Dual: Chunked + Continuous)
  // ========================================================================
  const {
    isRecording,
    recordingTime,
    currentStream,
    startRecording: startRecorderRecording,
    stopRecording: stopRecorderRecording,
  } = useRecorder({
    onChunk: handleChunk,
    onError: onError,
    timeSlice: CHUNK_INTERVAL_MS,
  });

  // ========================================================================
  // AUDIO ANALYSIS (VAD)
  // ========================================================================
  const { audioLevel, isSilent } = useAudioAnalysis(currentStream, {
    isActive: isRecording,
  });

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  // Start recording
  const startRecording = useCallback(async () => {
    console.log(`[Chat Voice] Starting recording for session: ${sessionId}`);

    // Reset state
    setLiveTranscript('');
    setChunkCount(0);
    resetMetrics();

    // Start recorder
    await startRecorderRecording();
  }, [sessionId, startRecorderRecording, resetMetrics]);

  // Stop recording and return full transcript
  const stopRecording = useCallback(async (): Promise<string> => {
    console.log('[Chat Voice] Stopping recording...');

    // Stop recorder
    await stopRecorderRecording();

    // Wait a moment for last chunk to finish processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`[Chat Voice] Recording stopped. Full transcript: "${liveTranscript}"`);

    return liveTranscript;
  }, [stopRecorderRecording, liveTranscript]);

  return {
    // Recording state
    isRecording,
    recordingTime,

    // VAD
    audioLevel,
    isSilent,

    // Transcription
    liveTranscript,
    chunkCount,
    isTranscribing,

    // Controls
    startRecording,
    stopRecording,

    // Metrics
    avgLatency,
    backendHealth,
  };
}
