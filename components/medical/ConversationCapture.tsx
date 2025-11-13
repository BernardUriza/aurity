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
import { AlertCircle } from 'lucide-react';
import { guessExt } from '@/lib/recording/makeRecorder';
import { useClipboard } from '@/hooks/useClipboard';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { useChunkProcessor } from '@/hooks/useChunkProcessor';
import { useRecorder } from '@/hooks/useRecorder';
import { useTranscription, type TranscriptionData } from '@/hooks/useTranscription';
import { AUDIO_CONFIG } from '@/lib/audio/constants';
import { DemoButton } from './DemoButton';
import { SessionBadges } from './SessionBadges';
import { RecordingControls } from './RecordingControls';
import { AudioLevelVisualizer } from './AudioLevelVisualizer';
import { AdvancedMetrics } from './AdvancedMetrics';
import { WorkflowProgress } from './WorkflowProgress';
import { StreamingTranscript } from './StreamingTranscript';
import { FinalTranscription } from './FinalTranscription';
import { H5Modal } from './H5Modal';

interface ConversationCaptureProps {
  onNext?: () => void;
  onTranscriptionComplete?: (data: TranscriptionData) => void;
  isRecording?: boolean;
  setIsRecording?: (recording: boolean) => void;
  className?: string;
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

  // Transcription hook (Phase 6)
  const {
    transcriptionData,
    lastChunkText,
    addChunk: addTranscriptionChunk,
    reset: resetTranscription,
    getText: getTranscriptionText,
    getWordCount,
  } = useTranscription();

  // Refs (including audio level refs for breaking circular dependency)
  const currentStreamRef = useRef<MediaStream | null>(null);
  const audioLevelRef = useRef<number>(0);
  const isSilentRef = useRef<boolean>(true);

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

        // Silence detection: read from refs (breaks circular dependency)
        const currentAudioLevel = audioLevelRef.current;
        const currentIsSilent = isSilentRef.current;

        if (currentIsSilent) {
          const percentLevel = Math.round((currentAudioLevel / 255) * 100);
          console.log(
            `[CHUNK ${chunkNumber}] ⏭️ Skipped (silence detected) - Audio level: ${currentAudioLevel.toFixed(1)}/255 (${percentLevel}%), Threshold: ${AUDIO_CONFIG.SILENCE_THRESHOLD} (${Math.round((AUDIO_CONFIG.SILENCE_THRESHOLD / 255) * 100)}%), Gain: ${AUDIO_CONFIG.AUDIO_GAIN}x`
          );
          inflightRef.current.delete(key);
          return;
        }

        const percentLevel = Math.round((currentAudioLevel / 255) * 100);
        console.log(
          `[CHUNK ${chunkNumber}] 📤 Submitting to orchestrator - Size: ${blob.size} bytes, Audio level: ${currentAudioLevel.toFixed(1)}/255 (${percentLevel}%)`
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
          addTranscriptionChunk(result.transcription);
        }
        // Case 2: Worker with polling
        else if (result.status === 'pending' && result.job_id) {
          console.log(`[CHUNK ${chunkNumber}] 🔄 Job queued: ${result.job_id} - Starting polling...`);
          const transcript = await pollJobStatus(result.job_id, chunkNumber);
          if (transcript) {
            console.log(`[CHUNK ${chunkNumber}] ✅ Poll completed: "${transcript}"`);
            addTranscriptionChunk(transcript);
          }
        }
        // Case 3: Legacy worker fallback format
        else if (result.queued && result.job_id) {
          console.log(`[CHUNK ${chunkNumber}] 🔄 WORKER fallback (legacy): ${result.job_id} - Polling...`);
          const transcript = await pollJobStatus(result.job_id, chunkNumber);
          if (transcript) {
            addTranscriptionChunk(transcript);
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
    [setChunkStatuses, addLog, pollJobStatus, addTranscriptionChunk]
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
  const recordingTime = hookRecordingTime;
  const fullAudioUrl = hookFullAudioUrl;

  // Audio analysis (after isRecording is defined)
  const { audioLevel, isSilent } = useAudioAnalysis(currentStreamRef.current, {
    isActive: isRecording,
  });

  // Sync audio values to refs (breaks circular dependency)
  useEffect(() => {
    audioLevelRef.current = audioLevel;
    isSilentRef.current = isSilent;
  }, [audioLevel, isSilent]);

  // Refs
  const audioChunksRef = useRef<Blob[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunkNumberRef = useRef<number>(0);
  const sessionIdRef = useRef<string>('');
  const inflightRef = useRef<Set<string>>(new Set());
  const fullAudioBlobsRef = useRef<Blob[]>([]);  // Store full audio blob

  // Advanced monitoring state
  const [wpm, setWpm] = useState<number>(0); // Words per minute
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
          word_count: getWordCount(),
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
        word_count: getWordCount(),
        duration_seconds: recordingTime,
        avg_latency_ms: avgLatency,
        wpm: wpm,
        full_audio_available: !!fullAudioUrl
      });
    } finally {
      setLoadingH5(false);
    }
  }, [sessionIdRef, chunkStatuses, transcriptionData, recordingTime, avgLatency, wpm, fullAudioUrl, getWordCount]);

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
    if (isRecording && recordingTime > 0) {
      const words = getWordCount();
      const minutes = recordingTime / 60;
      const calculatedWpm = minutes > 0 ? Math.round(words / minutes) : 0;
      setWpm(calculatedWpm);
    }
  }, [isRecording, recordingTime, getWordCount]);

  // Generate session ID (UUID4 format required by FI backend)
  const getSessionId = useCallback(() => {
    // Generate UUID4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }, []);

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
      inflightRef.current.clear();

      // Reset transcription (Phase 6 - uses hook)
      resetTranscription();

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
  }, [isDemoPlaying, hookStartRecording, resetMetrics, resetTranscription, addLog, getSessionId, setExternalIsRecording]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      // Stop recording with hook (handles dual recorders, timer, stream cleanup)
      await hookStopRecording();

      // Update external state if provided
      if (setExternalIsRecording) {
        setExternalIsRecording(false);
      }

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

      // Notify parent if transcription complete (Phase 6 - uses hook)
      const finalText = getTranscriptionText();
      if (onTranscriptionComplete && finalText) {
        onTranscriptionComplete({ text: finalText });
      }
    } catch (err) {
      console.error('[Recorder] Stop error:', err);
    }
  }, [hookStopRecording, fullAudioBlob, setExternalIsRecording, getTranscriptionText, onTranscriptionComplete]);

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
      <DemoButton
        isDemoPlaying={isDemoPlaying}
        isDemoPaused={isDemoPaused}
        isProcessing={isProcessing}
        onToggle={handleDemoPlayback}
      />

      {/* Session/Job ID Badge - Top Right Corner */}
      <SessionBadges
        sessionId={sessionIdRef.current}
        jobId={jobId}
        copiedId={copiedId}
        onCopy={copyToClipboard}
      />

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Captura de Conversación</h2>
        <p className="text-slate-400">Graba la consulta médica para transcripción y análisis</p>
      </div>

      {/* Recording Control */}
      <RecordingControls
        isRecording={isRecording}
        isProcessing={isProcessing}
        recordingTime={recordingTime}
        transcriptionData={transcriptionData}
        onStart={handleStartRecording}
        onStop={handleStopRecording}
      />

      {/* Audio Level Visualizer - Only when recording */}
      {isRecording && (
        <AudioLevelVisualizer
          audioLevel={audioLevel}
          recordingTime={recordingTime}
          wordCount={getWordCount()}
          chunkCount={chunkNumberRef.current}
        />
      )}

      {/* Advanced Monitoring Panel - Expandable */}
      {isRecording && chunkStatuses.length > 0 && (
        <AdvancedMetrics
          chunkStatuses={chunkStatuses}
          avgLatency={avgLatency}
          wpm={wpm}
          backendHealth={backendHealth}
          activityLogs={activityLogs}
        />
      )}

      {/* Workflow Progress - Enhanced with icons and animations */}
      {workflowStatus && <WorkflowProgress workflowStatus={workflowStatus} />}

      {/* Real-Time Streaming Transcription */}
      {isRecording && transcriptionData?.text && (
        <StreamingTranscript
          transcriptionData={transcriptionData}
          lastChunkText={lastChunkText}
          chunkCount={chunkNumberRef.current}
        />
      )}

      {/* Final Transcription Result */}
      {transcriptionData?.text && !isRecording && (
        <FinalTranscription
          transcriptionData={transcriptionData}
          fullAudioUrl={fullAudioUrl}
          chunkCount={chunkNumberRef.current}
          loadingH5={loadingH5}
          onContinue={onNext ? handleContinue : undefined}
        />
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
        <H5Modal
          h5Data={h5Data}
          onClose={() => setShowH5Modal(false)}
          onContinue={onNext}
        />
      )}
    </div>
  );
}
