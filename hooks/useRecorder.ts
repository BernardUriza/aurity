/**
 * useRecorder Hook
 *
 * Maneja la grabación de audio con arquitectura dual recorder:
 * - Chunked recorder: Para transcripción en tiempo real (chunks de 3s)
 * - Continuous recorder: Para audio completo sin chunks (playback final)
 *
 * Extraído de ConversationCapture durante refactoring incremental.
 *
 * @example
 * const { isRecording, recordingTime, startRecording, stopRecording, fullAudioBlob, currentStream } =
 *   useRecorder({
 *     onChunk: async (blob, chunkNumber) => {
 *       // Process chunk (upload, transcribe, etc.)
 *     },
 *     onError: (error) => console.error(error)
 *   });
 */

import { useState, useRef, useCallback } from 'react';
import { makeRecorder, guessExt } from '@/lib/recording/makeRecorder';

interface UseRecorderConfig {
  onChunk: (blob: Blob, chunkNumber: number) => Promise<void> | void;
  onError?: (error: string) => void;
  timeSlice?: number;
  sampleRate?: number;
  channels?: number;
}

interface UseRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  currentStream: MediaStream | null;
  fullAudioBlob: Blob | null;
  fullAudioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
}

export function useRecorder(config: UseRecorderConfig): UseRecorderReturn {
  const {
    onChunk,
    onError,
    timeSlice = 3000,
    sampleRate = 16000,
    channels = 1,
  } = config;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [fullAudioBlob, setFullAudioBlob] = useState<Blob | null>(null);
  const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);

  // Refs
  const recorderRef = useRef<any>(null); // Chunked recorder
  const continuousRecorderRef = useRef<any>(null); // Continuous recorder
  const currentStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fullAudioUrlRef = useRef<string | null>(null);
  const chunkNumberRef = useRef<number>(0);

  // Start recording with dual recorders
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      chunkNumberRef.current = 0;
      setRecordingTime(0);
      setFullAudioBlob(null);

      // Clean up previous audio URL
      if (fullAudioUrlRef.current) {
        URL.revokeObjectURL(fullAudioUrlRef.current);
        fullAudioUrlRef.current = null;
        setFullAudioUrl(null);
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      currentStreamRef.current = stream;

      // ========================================================================
      // CHUNKED RECORDER: For real-time transcription (3s chunks)
      // ========================================================================
      const chunkedRecorder = await makeRecorder(
        stream,
        async (blob: Blob) => {
          // Capture chunk number and increment IMMEDIATELY (atomic operation)
          const chunkNumber = chunkNumberRef.current++;

          // Call user-provided chunk handler
          await onChunk(blob, chunkNumber);
        },
        {
          timeSlice,
          sampleRate,
          channels,
        }
      );

      recorderRef.current = chunkedRecorder;
      console.log(`[Recorder] Using ${chunkedRecorder.kind} mode (chunked)`);
      chunkedRecorder.start();

      // ========================================================================
      // CONTINUOUS RECORDER: For full audio without chunks
      // ========================================================================
      // NOTE: Without timeSlice, the callback is NOT called during recording.
      // The blob is returned by .stop() Promise instead.
      const continuousRecorder = await makeRecorder(
        stream,
        () => {}, // Empty callback - blob comes from .stop() return value
        {
          // NO timeSlice = records continuously until stop()
          sampleRate,
          channels,
        }
      );

      continuousRecorderRef.current = continuousRecorder;
      continuousRecorder.start();
      console.log('[Continuous Recorder] Started (no chunking)');

      // Update state
      setIsRecording(true);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'No se pudo acceder al micrófono. Por favor, verifica los permisos.';
      console.error('[Recorder] Start error:', err);
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [onChunk, onError, timeSlice, sampleRate, channels]);

  // Stop recording and capture full audio blob
  const stopRecording = useCallback(async () => {
    try {
      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // ========================================================================
      // STOP CONTINUOUS RECORDER FIRST (for full audio blob)
      // ========================================================================
      let fullBlob: Blob | null = null;
      if (continuousRecorderRef.current) {
        fullBlob = await continuousRecorderRef.current.stop();
        console.log(
          `[Continuous Recorder] Stopped - full audio blob: ${fullBlob.size} bytes (${(fullBlob.size / 1024 / 1024).toFixed(2)} MB)`
        );

        // Create local URL for immediate playback
        if (fullAudioUrlRef.current) {
          URL.revokeObjectURL(fullAudioUrlRef.current); // Clean up old URL
        }
        const audioUrl = URL.createObjectURL(fullBlob);
        fullAudioUrlRef.current = audioUrl;
        setFullAudioUrl(audioUrl);
        setFullAudioBlob(fullBlob);

        console.log(
          `[Continuous Recorder] ✅ Audio completo disponible (${(fullBlob.size / 1024 / 1024).toFixed(2)} MB)`
        );
      }

      // ========================================================================
      // STOP CHUNKED RECORDER
      // ========================================================================
      if (recorderRef.current) {
        await recorderRef.current.stop();
        console.log('[Chunked Recorder] Stopped successfully');
      }

      // Stop media stream tracks
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach((track) => track.stop());
        currentStreamRef.current = null;
      }

      setIsRecording(false);

      // Return the full audio blob for immediate use (avoid stale closure issues)
      return fullBlob;
    } catch (err) {
      console.error('[Recorder] Stop error:', err);
      if (onError) {
        onError(err instanceof Error ? err.message : 'Error al detener grabación');
      }
      return null;
    }
  }, [onError]);

  return {
    isRecording,
    recordingTime,
    currentStream: currentStreamRef.current,
    fullAudioBlob,
    fullAudioUrl,
    startRecording,
    stopRecording,
  };
}
