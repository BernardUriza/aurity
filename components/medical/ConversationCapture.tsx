'use client';

/**
 * ConversationCapture Component - AURITY Medical Workflow
 *
 * Production-ready audio recording and transcription component
 * integrated with FI backend services (no demo/mock data).
 *
 * Backend Integration:
 * - POST /api/workflows/aurity/consult - Upload audio for processing
 * - GET /api/workflows/aurity/consult/{job_id} - Poll for results
 *
 * Features:
 * - Real audio recording with MediaRecorder API
 * - Progress tracking with job polling
 * - SOAP note generation via Ollama backend
 * - Speaker diarization
 *
 * File: apps/aurity/components/medical/ConversationCapture.tsx
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { guessExt } from '@/lib/recording/makeRecorder';
import { useClipboard } from '@/hooks/useClipboard';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { useChunkProcessor } from '@/hooks/useChunkProcessor';
import { useRecorder } from '@/hooks/useRecorder';
import { AUDIO_CONFIG } from '@/lib/audio/constants';
import { formatTime } from '@/lib/audio/formatting';

interface ConversationCaptureProps {
  onNext?: () => void;
  onTranscriptionComplete?: (data: TranscriptionData) => void;
  isRecording?: boolean;
  setIsRecording?: (recording: boolean) => void;
  className?: string;
}

interface TranscriptionData {
  text: string;
  speakers?: Array<{ speaker: string; text: string; timestamp?: string }>;
  soapNote?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

interface WorkflowStatus {
  job_id: string;
  session_id: string;
  status: string;
  progress_pct: number;
  stages: {
    upload: string;
    transcribe: string;
    diarize: string;
    soap: string;
  };
  soap_note?: any;
  result_data?: any;
  error?: string;
}

export function ConversationCapture({
  onNext,
  onTranscriptionComplete,
  isRecording: externalIsRecording,
  setIsRecording: setExternalIsRecording,
  className = ''
}: ConversationCaptureProps) {
  // State
  const [isProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [workflowStatus] = useState<WorkflowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionData>({ text: '' });
  const [lastChunkText, setLastChunkText] = useState<string>(''); // Track latest chunk for highlight animation

  // Custom hooks
  const { copiedId, copyToClipboard } = useClipboard();
  const { isDemoPlaying, isDemoPaused, playDemo, pauseDemo, resumeDemo } =
    useDemoMode('http://localhost:7001/static/consulta_demo.mp3');
  const {
    chunkStatuses,
    setChunkStatuses,
    avgLatency,
    backendHealth,
    activityLogs,
    pollJobStatus,
    addLog,
    resetMetrics,
  } = useChunkProcessor({
    backendUrl: 'http://localhost:7001',
  });

  // Audio level analysis refs
  const currentStreamRef = useRef<MediaStream | null>(null);

  // Custom hooks for audio analysis
  const { audioLevel, isSilent } = useAudioAnalysis(currentStreamRef.current, {
    isActive: isRecording,
  });

  // Chunk processing callback for useRecorder
  const handleChunk = useCallback(
    async (blob: Blob, chunkNumber: number) => {
      // Deduplication: prevent duplicate chunk processing
      const key = `${sessionIdRef.current}:${chunkNumber}`;
      if (inflightRef.current.has(key)) {
        console.warn(`[CHUNK ${chunkNumber}] ⚠️ Already processing, skipping duplicate`);
        return;
      }
      inflightRef.current.add(key);

      try {
        const timeSlice = AUDIO_CONFIG.TIME_SLICE;
        const timestampStart = chunkNumber * (timeSlice / 1000);
        const timestampEnd = timestampStart + timeSlice / 1000;

        // Silence detection: skip chunks with low audio level
        if (isSilent) {
          const percentLevel = Math.round((audioLevel / 255) * 100);
          console.log(
            `[CHUNK ${chunkNumber}] ⏭️ Skipped (silence detected) - Audio level: ${audioLevel.toFixed(1)}/255 (${percentLevel}%), Threshold: ${AUDIO_CONFIG.SILENCE_THRESHOLD} (${Math.round((AUDIO_CONFIG.SILENCE_THRESHOLD / 255) * 100)}%), Gain: ${AUDIO_CONFIG.AUDIO_GAIN}x`
          );
          inflightRef.current.delete(key);
          return;
        }

        const percentLevel = Math.round((audioLevel / 255) * 100);
        console.log(
          `[CHUNK ${chunkNumber}] 📤 Submitting to orchestrator - Size: ${blob.size} bytes, Audio level: ${audioLevel.toFixed(1)}/255 (${percentLevel}%)`
        );

        // Track chunk as uploading
        setChunkStatuses((prev) => [
          ...prev,
          {
            index: chunkNumber,
            status: 'uploading' as const,
            startTime: Date.now(),
          },
        ]);
        addLog(`📤 Enviando chunk ${chunkNumber} (${(blob.size / 1024).toFixed(1)}KB)`);

        const formData = new FormData();
        formData.append('session_id', sessionIdRef.current);
        formData.append('chunk_number', chunkNumber.toString());
        formData.append('mime', blob.type || '');
        formData.append('audio', blob, `${chunkNumber}${guessExt(blob.type)}`);
        formData.append('timestamp_start', timestampStart.toString());
        formData.append('timestamp_end', timestampEnd.toString());

        const response = await fetch('http://localhost:7001/api/workflows/aurity/stream', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[CHUNK ${chunkNumber}] ❌ Orchestrator error:`, errorText);
          throw new Error(`Orchestrator failed: ${response.statusText}`);
        }

        const result = await response.json();

        // Case 1: Direct transcription succeeded
        if (result.status === 'completed' && result.transcription) {
          console.log(`[CHUNK ${chunkNumber}] ✅ DIRECT path: "${result.transcription}"`);
          streamingTranscriptRef.current += ' ' + result.transcription;
          setLastChunkText(result.transcription);
          setTranscriptionData((prev) => ({
            ...prev,
            text: streamingTranscriptRef.current.trim(),
          }));
        }
        // Case 2: Worker with polling
        else if (result.status === 'pending' && result.job_id) {
          console.log(`[CHUNK ${chunkNumber}] 🔄 Job queued: ${result.job_id} - Starting polling...`);
          const transcript = await pollJobStatus(result.job_id, chunkNumber);
          if (transcript) {
            console.log(`[CHUNK ${chunkNumber}] ✅ Poll completed: "${transcript}"`);
            streamingTranscriptRef.current += ' ' + transcript;
            setLastChunkText(transcript);
            setTranscriptionData((prev) => ({
              ...prev,
              text: streamingTranscriptRef.current.trim(),
            }));
          }
        }
        // Case 3: Legacy worker fallback format
        else if (result.queued && result.job_id) {
          console.log(`[CHUNK ${chunkNumber}] 🔄 WORKER fallback (legacy): ${result.job_id} - Polling...`);
          const transcript = await pollJobStatus(result.job_id, chunkNumber);
          if (transcript) {
            streamingTranscriptRef.current += ' ' + transcript;
            setLastChunkText(transcript);
            setTranscriptionData((prev) => ({
              ...prev,
              text: streamingTranscriptRef.current.trim(),
            }));
          }
        } else {
          console.warn(`[CHUNK ${chunkNumber}] ⚠️ Unexpected response format:`, result);
        }
      } catch (err) {
        console.error(`[CHUNK ${chunkNumber}] ❌ Processing failed:`, err);
      } finally {
        inflightRef.current.delete(key);
      }
    },
    [isSilent, audioLevel, setChunkStatuses, addLog, pollJobStatus, setLastChunkText, setTranscriptionData]
  );

  // Initialize useRecorder with chunk processing
  const {
    isRecording: hookIsRecording,
    recordingTime: hookRecordingTime,
    fullAudioBlob,
    fullAudioUrl: hookFullAudioUrl,
    startRecording: hookStartRecording,
    stopRecording: hookStopRecording,
  } = useRecorder({
    onChunk: handleChunk,
    onError: (error) => setError(error),
    timeSlice: AUDIO_CONFIG.TIME_SLICE,
    sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
    channels: AUDIO_CONFIG.CHANNELS,
  });

  // Use external recording state if provided, otherwise use hook's state
  const isRecording = externalIsRecording !== undefined ? externalIsRecording : hookIsRecording;
  const setIsRecording = setExternalIsRecording || (() => {});
  const recordingTime = hookRecordingTime;
  const fullAudioUrl = hookFullAudioUrl;

  // Refs
  const audioChunksRef = useRef<Blob[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunkNumberRef = useRef<number>(0);
  const streamingTranscriptRef = useRef<string>('');
  const sessionIdRef = useRef<string>('');
  const inflightRef = useRef<Set<string>>(new Set());
  const fullAudioBlobsRef = useRef<Blob[]>([]);  // Store full audio blob

  // Advanced monitoring state
  const [wpm, setWpm] = useState<number>(0); // Words per minute
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const startTimeRef = useRef<number>(0);

  // HDF5 Modal state
  const [showH5Modal, setShowH5Modal] = useState(false);
  const [h5Data, setH5Data] = useState<any>(null);
  const [loadingH5, setLoadingH5] = useState(false);

  // Fetch HDF5 data for current session
  const fetchH5Data = useCallback(async () => {
    if (!sessionIdRef.current) {
      console.warn('No session ID available');
      return;
    }

    setLoadingH5(true);
    try {
      // Create a simple Python script to read HDF5
      const response = await fetch('http://localhost:7001/api/workflows/aurity/sessions/' + sessionIdRef.current + '/inspect', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setH5Data(data);
      } else {
        // If endpoint doesn't exist, create inline visualization from what we have
        setH5Data({
          session_id: sessionIdRef.current,
          chunks: chunkStatuses.filter(c => c.status === 'completed').map(c => ({
            index: c.index,
            transcript: c.transcript || '',
            latency_ms: c.latency,
            status: c.status
          })),
          transcription_full: transcriptionData?.text || '',
          word_count: transcriptionData?.text ? transcriptionData.text.trim().split(/\s+/).filter(w => w.length > 0).length : 0,
          duration_seconds: recordingTime,
          avg_latency_ms: avgLatency,
          wpm: wpm,
          full_audio_available: !!fullAudioUrl
        });
      }
    } catch (err) {
      console.error('Error fetching H5 data:', err);
      // Fallback to local data
      setH5Data({
        session_id: sessionIdRef.current,
        chunks: chunkStatuses.filter(c => c.status === 'completed').map(c => ({
          index: c.index,
          transcript: c.transcript || '',
          latency_ms: c.latency,
          status: c.status
        })),
        transcription_full: transcriptionData?.text || '',
        word_count: transcriptionData?.text ? transcriptionData.text.trim().split(/\s+/).filter(w => w.length > 0).length : 0,
        duration_seconds: recordingTime,
        avg_latency_ms: avgLatency,
        wpm: wpm,
        full_audio_available: !!fullAudioUrl
      });
    } finally {
      setLoadingH5(false);
    }
  }, [sessionIdRef, chunkStatuses, transcriptionData, recordingTime, avgLatency, wpm, fullAudioUrl]);

  // Handle "Continue" button click - open H5 modal first
  const handleContinue = useCallback(async () => {
    await fetchH5Data();
    setShowH5Modal(true);
  }, [fetchH5Data]);

  /**
   * Poll job status until completed (AUR-PROMPT-4.2).
   *
   * @param jobId Celery job ID
   * @param chunkNumber Chunk index for logging
   * @returns Transcript text or null if failed
   */

  // Calculate WPM (Words Per Minute) in real-time
  useEffect(() => {
    if (isRecording && recordingTime > 0 && transcriptionData?.text) {
      const words = transcriptionData.text.trim().split(/\s+/).filter(w => w.length > 0).length;
      const minutes = recordingTime / 60;
      const calculatedWpm = minutes > 0 ? Math.round(words / minutes) : 0;
      setWpm(calculatedWpm);
    }
  }, [isRecording, recordingTime, transcriptionData]);

  // Generate session ID (UUID4 format required by FI backend)
  const getSessionId = useCallback(() => {
    // Generate UUID4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }, []);

  // Clear highlight animation after 3 seconds (fade-out effect)
  useEffect(() => {
    if (!lastChunkText || !isRecording) return;

    const timer = setTimeout(() => {
      setLastChunkText('');
    }, 3000); // Clear highlight after 3 seconds

    return () => clearTimeout(timer);
  }, [lastChunkText, isRecording]);

  // Start recording with real-time streaming (simplified with useRecorder hook)
  const handleStartRecording = useCallback(async () => {
    try {
      // Keep demo audio playing if active (allows recording demo consultation)
      if (isDemoPlaying) {
        console.log('[Demo] Continuing playback while recording (demo capture mode)');
      }

      setError(null);
      audioChunksRef.current = [];
      fullAudioBlobsRef.current = [];
      chunkNumberRef.current = 0;
      streamingTranscriptRef.current = '';
      inflightRef.current.clear();
      setLastChunkText('');
      setTranscriptionData({ text: '' });

      // Reset monitoring metrics
      resetMetrics();
      setWpm(0);
      startTimeRef.current = Date.now();
      addLog('🎙️ Grabación iniciada');

      // Generate session ID
      const sessionId = getSessionId();
      sessionIdRef.current = sessionId;

      // Start recording with hook (handles dual recorders, timer, stream)
      await hookStartRecording();

      // Update external state if provided
      if (setExternalIsRecording) {
        setExternalIsRecording(true);
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  }, [isDemoPlaying, hookStartRecording, resetMetrics, addLog, getSessionId, setExternalIsRecording]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      // Stop recording with hook (handles dual recorders, timer, stream cleanup)
      await hookStopRecording();

      // Update external state if provided
      if (setExternalIsRecording) {
        setExternalIsRecording(false);
      }

      setLastChunkText('');

      // Send full audio to backend if available
      if (fullAudioBlob && sessionIdRef.current) {
        console.log(
          `[Session End] Preparing full audio blob: ${(fullAudioBlob.size / 1024 / 1024).toFixed(2)} MB`
        );

        const formData = new FormData();
        formData.append('session_id', sessionIdRef.current);
        formData.append('full_audio', fullAudioBlob, 'session.webm');

        try {
          const response = await fetch('http://localhost:7001/api/workflows/aurity/end-session', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            console.log('[Session End] ✅ Full audio saved:', result);
            setJobId(result.audio_path);
          } else {
            console.warn('[Session End] ⚠️ Could not save full audio (streaming mode):', await response.text());
          }
        } catch (err) {
          console.warn('[Session End] ⚠️ Upload skipped (streaming mode):', err);
        }

        fullAudioBlobsRef.current = [];
      }

      // Notify parent if transcription complete
      if (onTranscriptionComplete && streamingTranscriptRef.current) {
        onTranscriptionComplete({
          text: streamingTranscriptRef.current.trim(),
        });
      }
    } catch (err) {
      console.error('[Recorder] Stop error:', err);
    }
  }, [hookStopRecording, fullAudioBlob, setExternalIsRecording, onTranscriptionComplete]);

  // Handle demo playback - toggle play/pause/resume
  const handleDemoPlayback = useCallback(async () => {
    try {
      // If paused, resume
      if (isDemoPaused) {
        await resumeDemo();
        return;
      }

      // If playing, pause
      if (isDemoPlaying && !isDemoPaused) {
        pauseDemo();
        return;
      }

      // Start new playback
      setError(null);
      await playDemo();
    } catch (err) {
      console.error('[Demo] Error:', err);
      setError(err instanceof Error ? err.message : 'Error al ejecutar demo');
    }
  }, [isDemoPlaying, isDemoPaused, playDemo, pauseDemo, resumeDemo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup polling interval if exists
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Note: Recording cleanup is handled by useRecorder hook
    };
  }, []);

  return (
    <div className={`space-y-6 ${className} relative`}>
      {/* Demo Button - Top Left Corner */}
      <div className="absolute top-0 left-0 z-10">
        <button
          onClick={handleDemoPlayback}
          disabled={isProcessing}
          className={`
            ${isDemoPlaying && !isDemoPaused
              ? 'bg-purple-500'
              : isDemoPaused
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-purple-600 hover:bg-purple-700'
            }
            text-white font-semibold
            px-4 py-2 rounded-lg shadow-lg
            transition-all duration-200
            flex items-center gap-2
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
          `}
          title={
            isDemoPaused
              ? 'Continuar reproducción'
              : isDemoPlaying
              ? 'Pausar demo'
              : 'Reproducir consulta de demostración'
          }
        >
          {isDemoPaused ? (
            <>
              {/* Resume icon */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span className="text-sm">Continuar</span>
            </>
          ) : isDemoPlaying ? (
            <>
              {/* Pause icon */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
              </svg>
              <span className="text-sm">Pausar</span>
            </>
          ) : (
            <>
              {/* Play icon */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <span className="text-sm">Demo</span>
            </>
          )}
        </button>
      </div>

      {/* Session/Job ID Badge - Top Right Corner */}
      {(sessionIdRef.current || jobId) && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 shadow-lg">
            <div className="flex flex-col gap-1">
              {sessionIdRef.current && (
                <div className="flex items-center gap-2 group">
                  <span className="text-xs text-slate-400 font-medium">Session:</span>
                  <code className="text-xs font-mono text-emerald-400 tracking-tight">
                    {sessionIdRef.current.slice(0, 8)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(sessionIdRef.current, 'session')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-700 rounded"
                    title="Copy full Session ID"
                  >
                    {copiedId === 'session' ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>
                </div>
              )}
              {jobId && (
                <div className="flex items-center gap-2 group">
                  <span className="text-xs text-slate-400 font-medium">Job:</span>
                  <code className="text-xs font-mono text-cyan-400 tracking-tight">
                    {jobId.slice(0, 8)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(jobId, 'job')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-700 rounded"
                    title="Copy full Job ID"
                  >
                    {copiedId === 'job' ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-400" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Captura de Conversación</h2>
        <p className="text-slate-400">Graba la consulta médica para transcripción y análisis</p>
      </div>

      {/* Recording Control */}
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
        <div className="flex flex-col items-center gap-6">
          {/* Recording Button with Heartbeat Animation */}
          <div className="relative">
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isProcessing}
              className={`
                w-24 h-24 rounded-full flex items-center justify-center transition-all relative z-10
                ${isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-heartbeat'
                  : 'bg-emerald-500 hover:bg-emerald-600'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                shadow-lg hover:shadow-xl
              `}
            >
              {isRecording ? (
                <MicOff className="h-10 w-10 text-white" />
              ) : (
                <Mic className="h-10 w-10 text-white" />
              )}
            </button>

            {/* Pulse Rings - Only when recording */}
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30 pointer-events-none" />
                <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 pointer-events-none"
                     style={{
                       animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                     }} />
              </>
            )}
          </div>

          {/* Recording Time */}
          {isRecording && (
            <div className="text-3xl font-mono text-white">
              {formatTime(recordingTime)}
            </div>
          )}

          {/* Status Text */}
          <div className="text-center">
            {isRecording && (
              <p className="text-emerald-400 font-medium">Grabando...</p>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 text-cyan-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="font-medium">Procesando audio...</p>
              </div>
            )}
            {!isRecording && !isProcessing && !transcriptionData && (
              <p className="text-slate-400">Presiona para comenzar a grabar</p>
            )}
          </div>
        </div>
      </div>

      {/* Audio Level Visualizer - Only when recording */}
      {isRecording && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Análisis de Audio en Vivo</h3>
            {/* Voice Activity Indicator */}
            <div className="flex items-center gap-2">
              {audioLevel > AUDIO_CONFIG.SILENCE_THRESHOLD ? (
                <>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-emerald-400 font-medium">Hablando</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-slate-500 rounded-full" />
                  <span className="text-xs text-slate-500">Silencio</span>
                </>
              )}
            </div>
          </div>

          {/* Audio Level Bar with Threshold Indicator */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Nivel de audio</span>
              <span className="text-emerald-400 font-mono font-bold">
                {Math.round((audioLevel / 255) * 100)}%
              </span>
            </div>
            <div className="relative w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              {/* Audio level bar */}
              <div
                className={`h-3 rounded-full transition-all duration-100 ${
                  audioLevel > AUDIO_CONFIG.SILENCE_THRESHOLD
                    ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500'
                    : 'bg-slate-600'
                }`}
                style={{ width: `${(audioLevel / 255) * 100}%` }}
              />
              {/* Threshold indicator line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/50"
                style={{ left: `${(AUDIO_CONFIG.SILENCE_THRESHOLD / 255) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Umbral: {Math.round((AUDIO_CONFIG.SILENCE_THRESHOLD / 255) * 100)}%</span>
              <span>
                {audioLevel > AUDIO_CONFIG.SILENCE_THRESHOLD * 3 ? '🟢 Excelente' :
                 audioLevel > AUDIO_CONFIG.SILENCE_THRESHOLD ? '🟡 Buena' : '🔴 Baja'}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 text-center">
              <div className="text-2xl font-bold text-cyan-400">{formatTime(recordingTime)}</div>
              <div className="text-xs text-slate-400 mt-1">Duración</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {transcriptionData?.text ? transcriptionData.text.trim().split(/\s+/).filter(w => w.length > 0).length : 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Palabras transcritas</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {chunkNumberRef.current}
              </div>
              <div className="text-xs text-slate-400 mt-1">Segmentos (3s)</div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Monitoring Panel - Expandable */}
      {isRecording && chunkStatuses.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 animate-in">
          <button
            onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-white">Métricas Avanzadas</h3>
              {/* Backend Health Badge */}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                backendHealth === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
                backendHealth === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {backendHealth === 'healthy' ? '🟢 Backend OK' :
                 backendHealth === 'degraded' ? '🟡 Degradado' : '🔴 Down'}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${showAdvancedMetrics ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvancedMetrics && (
            <div className="px-6 pb-6 space-y-6 animate-in fade-in">
              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Latencia Promedio</div>
                  <div className="text-xl font-bold text-cyan-400">
                    {avgLatency > 0 ? `${(avgLatency / 1000).toFixed(1)}s` : '--'}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">WPM</div>
                  <div className="text-xl font-bold text-emerald-400">{wpm || '--'}</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Completados</div>
                  <div className="text-xl font-bold text-purple-400">
                    {chunkStatuses.filter(c => c.status === 'completed').length}/{chunkStatuses.length}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Fallidos</div>
                  <div className="text-xl font-bold text-red-400">
                    {chunkStatuses.filter(c => c.status === 'failed').length}
                  </div>
                </div>
              </div>

              {/* Chunk Timeline Visualization */}
              <div>
                <div className="text-sm font-medium text-slate-300 mb-3">Timeline de Chunks</div>
                <div className="flex flex-wrap gap-1.5">
                  {chunkStatuses.map((chunk) => (
                    <div
                      key={chunk.index}
                      className={`relative group w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all ${
                        chunk.status === 'uploading' ? 'bg-blue-500/30 text-blue-300 animate-pulse' :
                        chunk.status === 'pending' ? 'bg-yellow-500/30 text-yellow-300' :
                        chunk.status === 'processing' ? 'bg-cyan-500/30 text-cyan-300 animate-pulse' :
                        chunk.status === 'completed' ? 'bg-emerald-500/30 text-emerald-300' :
                        'bg-red-500/30 text-red-300'
                      }`}
                      title={`Chunk ${chunk.index}: ${chunk.status}${chunk.latency ? ` (${(chunk.latency / 1000).toFixed(1)}s)` : ''}`}
                    >
                      {chunk.index}
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 border border-slate-700">
                        <div>Chunk {chunk.index}</div>
                        <div className="text-slate-400">{chunk.status}</div>
                        {chunk.latency && <div className="text-cyan-400">{(chunk.latency / 1000).toFixed(1)}s</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500/30" />
                    <span>Uploading</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500/30" />
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-cyan-500/30" />
                    <span>Processing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-500/30" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500/30" />
                    <span>Failed</span>
                  </div>
                </div>
              </div>

              {/* Activity Logs */}
              {activityLogs.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-slate-300 mb-3">Registro de Actividad</div>
                  <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-3 font-mono text-xs max-h-48 overflow-y-auto">
                    {activityLogs.map((log, idx) => (
                      <div key={idx} className="text-slate-400 py-1 border-b border-slate-800 last:border-0">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Workflow Progress - Enhanced with icons and animations */}
      {workflowStatus && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-in fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
            <h3 className="text-lg font-semibold text-white">Procesamiento Backend FI</h3>
          </div>

          {/* Progress Bar with gradient */}
          <div className="mb-6">
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-emerald-500 to-cyan-500"
                style={{ width: `${workflowStatus.progress_pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-slate-400">{workflowStatus.progress_pct}% completado</p>
              <p className="text-xs text-slate-500">Backend con VAD automático</p>
            </div>
          </div>

          {/* Stage Status Grid with Icons */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(workflowStatus.stages).map(([stage, status]) => {
              const stageLabels: Record<string, string> = {
                upload: '📤 Upload',
                transcribe: '🎤 Whisper',
                diarize: '👥 Speakers',
                soap: '📋 SOAP'
              };

              const isActive = status === 'in_progress';
              const isComplete = status === 'completed';
              const isFailed = status === 'failed';

              return (
                <div
                  key={stage}
                  className={`
                    p-3 rounded-lg border transition-all duration-300
                    ${isComplete ? 'bg-green-500/10 border-green-500/30' : ''}
                    ${isActive ? 'bg-cyan-500/10 border-cyan-500/30 animate-pulse' : ''}
                    ${isFailed ? 'bg-red-500/10 border-red-500/30' : ''}
                    ${status === 'pending' ? 'bg-slate-700/50 border-slate-600' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {stageLabels[stage] || stage}
                    </span>
                    {isComplete && <span className="text-green-400">✓</span>}
                    {isActive && <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />}
                    {isFailed && <span className="text-red-400">✗</span>}
                  </div>
                  <div className={`
                    text-xs mt-1
                    ${isComplete ? 'text-green-400' : ''}
                    ${isActive ? 'text-cyan-400' : ''}
                    ${isFailed ? 'text-red-400' : ''}
                    ${status === 'pending' ? 'text-slate-400' : ''}
                  `}>
                    {status === 'in_progress' ? 'Procesando...' : status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-Time Streaming Transcription */}
      {isRecording && transcriptionData?.text && (
        <div className="bg-slate-800 rounded-xl p-6 border border-cyan-500/30 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <h3 className="text-lg font-semibold text-white">Transcripción en Tiempo Real</h3>
            <span className="text-xs text-cyan-400 ml-auto">
              {chunkNumberRef.current} chunks procesados
            </span>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {/* Render old text */}
              {transcriptionData.text.substring(0, transcriptionData.text.length - lastChunkText.length)}
              {/* Highlight last chunk with fade-in animation */}
              {lastChunkText && (
                <span className="animate-in fade-in duration-500 bg-cyan-500/20 rounded px-0.5">
                  {lastChunkText}
                </span>
              )}
              {/* Blinking cursor */}
              <span
                className="inline-block w-0.5 h-4 ml-1 bg-cyan-400"
                style={{
                  animation: 'blink 1s step-end infinite'
                }}
              />
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span>💡 El texto se actualiza cada 3 segundos mientras hablas</span>
          </div>
        </div>
      )}

      {/* Custom CSS for blink animation */}
      <style jsx>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      {/* Final Transcription Result */}
      {transcriptionData?.text && !isRecording && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Transcripción Completada</h3>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
            <p className="text-slate-300 whitespace-pre-wrap">{transcriptionData.text}</p>
          </div>

          {/* Audio Playback (DEMO REQUIREMENT) - Show when audio is available */}
          {fullAudioUrl && (
            <div className="bg-slate-900/70 rounded-lg p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h4 className="text-sm font-semibold text-white">Audio Completo</h4>
                <span className="ml-auto text-xs text-slate-400">
                  {chunkNumberRef.current} chunks grabados
                </span>
              </div>
              <audio
                controls
                className="w-full"
                src={fullAudioUrl}
                preload="metadata"
              >
                Tu navegador no soporta reproducción de audio.
              </audio>
              <div className="mt-2 text-xs text-slate-400">
                💡 Puedes reproducir el audio completo de la consulta
              </div>
            </div>
          )}

          {onNext && (
            <button
              onClick={handleContinue}
              disabled={loadingH5}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingH5 ? 'Cargando datos...' : 'Continuar al Siguiente Paso'}
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-slate-800 rounded-xl p-4 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* HDF5 Data Modal */}
      {showH5Modal && h5Data && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <h2 className="text-xl font-bold text-white">Datos HDF5 de la Sesión</h2>
                  <p className="text-sm text-slate-400">Session ID: {h5Data.session_id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowH5Modal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Duración Total</div>
                  <div className="text-2xl font-bold text-cyan-400">{formatTime(h5Data.duration_seconds || 0)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Palabras</div>
                  <div className="text-2xl font-bold text-emerald-400">{h5Data.word_count || 0}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">WPM</div>
                  <div className="text-2xl font-bold text-purple-400">{h5Data.wpm || 0}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Chunks</div>
                  <div className="text-2xl font-bold text-yellow-400">{h5Data.chunks?.length || 0}</div>
                </div>
              </div>

              {/* Full Transcription */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Transcripción Completa
                </h3>
                <div className="bg-slate-900/50 rounded p-3 max-h-48 overflow-y-auto">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {h5Data.transcription_full || 'No hay transcripción disponible'}
                  </p>
                </div>
              </div>

              {/* Chunks Detail */}
              {h5Data.chunks && h5Data.chunks.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Desglose por Chunks ({h5Data.chunks.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {h5Data.chunks.map((chunk: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-mono">
                              Chunk {chunk.index}
                            </span>
                            {chunk.latency_ms && (
                              <span className="text-xs text-slate-500">
                                {(chunk.latency_ms / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            chunk.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            chunk.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {chunk.status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">
                          {chunk.transcript || <span className="text-slate-600 italic">Sin transcripción</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Metadatos
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded p-3">
                    <div className="text-xs text-slate-400 mb-1">Latencia Promedio</div>
                    <div className="text-lg font-mono text-cyan-400">
                      {h5Data.avg_latency_ms ? `${(h5Data.avg_latency_ms / 1000).toFixed(2)}s` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded p-3">
                    <div className="text-xs text-slate-400 mb-1">Audio Completo</div>
                    <div className="text-lg font-semibold">
                      {h5Data.full_audio_available ? (
                        <span className="text-emerald-400">✅ Disponible</span>
                      ) : (
                        <span className="text-slate-500">❌ No disponible</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between bg-slate-800/50">
              <button
                onClick={() => setShowH5Modal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cerrar
              </button>
              {onNext && (
                <button
                  onClick={() => {
                    setShowH5Modal(false);
                    onNext();
                  }}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                >
                  Continuar al Siguiente Paso →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
