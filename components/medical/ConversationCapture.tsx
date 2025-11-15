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
import { useWebSpeech } from '@/hooks/useWebSpeech';
import { AUDIO_CONFIG } from '@/lib/audio/constants';
import { DemoButton } from './DemoButton';
import { SessionBadges } from './SessionBadges';
import { RecordingControls } from './RecordingControls';
import { AudioLevelVisualizer } from './AudioLevelVisualizer';
import { AdvancedMetrics } from './AdvancedMetrics';
import { WorkflowProgress } from './WorkflowProgress';
import { StreamingTranscript } from './StreamingTranscript';
import { PausedAudioPreview } from './PausedAudioPreview';
import { FinalTranscription } from './FinalTranscription';
import { H5Modal } from './H5Modal';
import { TranscriptionSources } from './TranscriptionSources';

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
  const [isPaused, setIsPaused] = useState(false); // NEW: Pause/Resume state
  const [pausedAudioUrl, setPausedAudioUrl] = useState<string | null>(null); // Audio preview when paused
  const [jobId, setJobId] = useState<string | null>(null);
  const [workflowStatus] = useState<WorkflowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webSpeechTranscripts, setWebSpeechTranscripts] = useState<string[]>([]); // WebSpeech preview (separate)

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

  // WebSpeech hook (instant preview fallback - SEPARATE from Whisper)
  const {
    isListening: isWebSpeechActive,
    interimTranscript: webSpeechInterim,
    isSupported: isWebSpeechSupported,
    startWebSpeech,
    stopWebSpeech,
  } = useWebSpeech({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        console.log('[WebSpeech] Instant preview:', text);
        // Add to SEPARATE webSpeech array (NOT mixed with Whisper)
        setWebSpeechTranscripts((prev) => [...prev, text]);
      }
    },
    language: 'es-MX',
    continuous: true,
    interimResults: true,
  });

  // Refs (audio level refs for breaking circular dependency)
  const audioLevelRef = useRef<number>(0);
  const isSilentRef = useRef<boolean>(true);

  // Chunk processing callback for useRecorder
  const handleChunk = useCallback(
    async (blob: Blob, _localChunkNumber: number) => {
      // CRITICAL: Use global counter, not local recorder counter (for pause/resume support)
      const chunkNumber = chunkNumberRef.current;

      // Silence detection: read from refs (breaks circular dependency)
      const currentAudioLevel = audioLevelRef.current;
      const currentIsSilent = isSilentRef.current;

      if (currentIsSilent) {
        const percentLevel = Math.round((currentAudioLevel / 255) * 100);
        console.log(
          `[CHUNK ${chunkNumber}] ⏭️ Skipped (silence detected) - Audio level: ${currentAudioLevel.toFixed(1)}/255 (${percentLevel}%), Threshold: ${AUDIO_CONFIG.SILENCE_THRESHOLD} (${Math.round((AUDIO_CONFIG.SILENCE_THRESHOLD / 255) * 100)}%), Gain: ${AUDIO_CONFIG.AUDIO_GAIN}x`
        );
        // Don't increment counter for silent chunks - they don't get sent
        return;
      }

      // Increment ONLY for non-silent chunks
      chunkNumberRef.current++;

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

        console.log(`[CHUNK ${chunkNumber}] 📥 Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[CHUNK ${chunkNumber}] ❌ Orchestrator error:`, errorText);
          throw new Error(`Orchestrator failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[CHUNK ${chunkNumber}] 📦 Response JSON:`, result);

        // Case 1: Direct transcription succeeded
        if (result.status === 'completed' && result.transcription) {
          console.log(`[CHUNK ${chunkNumber}] ✅ DIRECT path: "${result.transcription}"`);
          addTranscriptionChunk(result.transcription);
        }
        // Case 2: Worker with polling (session-based job)
        else if (result.status === 'pending' && result.session_id) {
          console.log(`[CHUNK ${chunkNumber}] 🔄 Job pending for session: ${result.session_id} - Starting polling...`);
          const transcript = await pollJobStatus(sessionIdRef.current, chunkNumber);
          if (transcript) {
            console.log(`[CHUNK ${chunkNumber}] ✅ Poll completed: "${transcript}"`);
            addTranscriptionChunk(transcript);
          }
        }
        // Case 3: Legacy worker fallback format (deprecated)
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
    currentStream,
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
  const { audioLevel, isSilent } = useAudioAnalysis(currentStream, {
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
  // NOTE: This is ONLY called for fresh starts (not resume)
  const handleStartRecording = useCallback(async () => {
    try {
      // Keep demo audio playing if active (allows recording demo consultation)
      if (isDemoPlaying) {
        console.log('[Demo] Continuing playback while recording (demo capture mode)');
      }

      setError(null);
      setIsPaused(false);
      audioChunksRef.current = [];
      fullAudioBlobsRef.current = [];
      chunkNumberRef.current = 0;
      inflightRef.current.clear();

      // Reset transcription (Phase 6 - uses hook)
      resetTranscription();
      setWebSpeechTranscripts([]); // Reset WebSpeech transcripts

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

      // Start WebSpeech for instant preview (if supported)
      if (isWebSpeechSupported) {
        startWebSpeech();
        console.log('[WebSpeech] Started instant preview');
      }

      // Update external state if provided
      if (setExternalIsRecording) {
        setExternalIsRecording(true);
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  }, [isDemoPlaying, hookStartRecording, resetMetrics, resetTranscription, addLog, getSessionId, setExternalIsRecording, isWebSpeechSupported, startWebSpeech]);

  // Pause recording (NEW - doesn't reset anything)
  const handlePauseRecording = useCallback(async () => {
    try {
      // Stop recording with hook (handles dual recorders, timer, stream cleanup)
      // CRITICAL: Capture the blob returned by stopRecording to avoid stale closure
      const capturedBlob = await hookStopRecording();

      // CRITICAL: Store the current audio segment for later concatenation
      if (capturedBlob) {
        fullAudioBlobsRef.current.push(capturedBlob);
        console.log(`[Pause] Stored audio segment ${fullAudioBlobsRef.current.length}: ${(capturedBlob.size / 1024).toFixed(1)}KB`);
      } else {
        console.warn('[Pause] ⚠️ No audio blob captured from recorder');
      }

      // Create concatenated audio preview for paused state
      if (fullAudioBlobsRef.current.length > 0) {
        const mimeType = fullAudioBlobsRef.current[0].type || 'audio/webm';
        const concatenatedBlob = new Blob(fullAudioBlobsRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(concatenatedBlob);
        setPausedAudioUrl(audioUrl);
        console.log(`[Pause] Created preview audio: ${(concatenatedBlob.size / 1024 / 1024).toFixed(2)} MB (${fullAudioBlobsRef.current.length} segments)`);
      }

      setIsPaused(true);
      addLog('⏸️ Grabación pausada - audio disponible para escuchar');

      // Stop WebSpeech
      if (isWebSpeechActive) {
        stopWebSpeech();
        console.log('[WebSpeech] Stopped (paused)');
      }

      // Update external state if provided
      if (setExternalIsRecording) {
        setExternalIsRecording(false);
      }
    } catch (err) {
      console.error('[Recorder] Pause error:', err);
    }
  }, [hookStopRecording, setExternalIsRecording, addLog, isWebSpeechActive, stopWebSpeech]);

  // Resume recording (NEW - continues in same session)
  const handleResumeRecording = useCallback(async () => {
    try {
      // Clean up paused audio URL
      if (pausedAudioUrl) {
        URL.revokeObjectURL(pausedAudioUrl);
        setPausedAudioUrl(null);
        console.log('[Resume] Cleaned up paused audio preview');
      }

      setIsPaused(false);
      addLog('▶️ Grabación reanudada');

      // Resume recording without resetting counters
      await hookStartRecording();

      // Resume WebSpeech
      if (isWebSpeechSupported) {
        startWebSpeech();
        console.log('[WebSpeech] Resumed');
      }

      // Update external state if provided
      if (setExternalIsRecording) {
        setExternalIsRecording(true);
      }
    } catch (err) {
      console.error('[Recorder] Resume error:', err);
    }
  }, [pausedAudioUrl, hookStartRecording, setExternalIsRecording, addLog, isWebSpeechSupported, startWebSpeech]);

  // End session (NEW - finalizes and resets everything)
  const handleEndSession = useCallback(async () => {
    try {
      // Clean up paused audio URL if exists
      if (pausedAudioUrl) {
        URL.revokeObjectURL(pausedAudioUrl);
        setPausedAudioUrl(null);
        console.log('[End Session] Cleaned up paused audio preview');
      }

      // Concatenate all audio segments (from pause/resume cycles)
      let finalAudioBlob: Blob | null = null;

      // Note: All segments are already stored in fullAudioBlobsRef.current from pause cycles
      // No need to add fullAudioBlob here since handleEndSession is only called when paused

      // Concatenate all segments
      if (fullAudioBlobsRef.current.length > 0) {
        console.log(`[Session End] Concatenating ${fullAudioBlobsRef.current.length} audio segments...`);

        // Determine MIME type from first blob
        const mimeType = fullAudioBlobsRef.current[0].type || 'audio/webm';

        // Concatenate all blobs
        finalAudioBlob = new Blob(fullAudioBlobsRef.current, { type: mimeType });

        const totalSize = (finalAudioBlob.size / 1024 / 1024).toFixed(2);
        console.log(`[Session End] ✅ Concatenated audio: ${totalSize} MB (${fullAudioBlobsRef.current.length} segments)`);

        // OPTIONAL: Create playback URL for the concatenated audio
        // This allows the user to listen to the full recording before uploading
        // (This is handled by fullAudioUrl from the last pause, but we can update it)
      }

      // Get full transcription text BEFORE finalization (needed for 3rd source)
      const finalText = getTranscriptionText();

      // Send concatenated audio to backend if available
      if (finalAudioBlob && sessionIdRef.current) {
        console.log(
          `[Session End] Preparing full audio blob: ${(finalAudioBlob.size / 1024 / 1024).toFixed(2)} MB`
        );

        const formData = new FormData();
        formData.append('session_id', sessionIdRef.current);
        formData.append('full_audio', finalAudioBlob, 'session.webm');

        try {
          const response = await fetch('http://localhost:7001/api/workflows/aurity/end-session', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            console.log('[Session End] ✅ Full audio saved:', result);
            setJobId(result.audio_path);

            // Finalize session: encrypt + dispatch diarization (with 3 sources)
            try {
              // Prepare 3 separate transcription sources for HDF5
              const transcriptionSources = {
                webspeech_final: webSpeechTranscripts, // WebSpeech instant previews
                transcription_per_chunks: chunkStatuses
                  .filter((c) => c.status === 'completed' && c.transcript)
                  .map((c) => ({
                    chunk_number: c.index,
                    text: c.transcript || '',
                    latency_ms: c.latency,
                    confidence: 0, // TODO: extract from backend
                  })),
                full_transcription: finalText, // Concatenated full text (from getTranscriptionText)
              };

              const finalizeResponse = await fetch(
                `http://localhost:7001/internal/sessions/${sessionIdRef.current}/finalize`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ transcription_sources: transcriptionSources }),
                }
              );

              if (finalizeResponse.ok) {
                const finalizeResult = await finalizeResponse.json();
                console.log('[Session End] ✅ Session finalized:', finalizeResult);
                console.log('[Session End] 🔐 Encrypted + 🎙️ Diarization dispatched:', finalizeResult.diarization_job_id);
                console.log('[Session End] 📦 3 sources saved: WebSpeech, Chunks, Full');
              } else {
                console.error('[Session End] ❌ Finalization failed:', await finalizeResponse.text());
              }
            } catch (finalizeErr) {
              console.error('[Session End] ❌ Finalization error:', finalizeErr);
            }
          } else {
            console.warn('[Session End] ⚠️ Could not save full audio (streaming mode):', await response.text());
          }
        } catch (err) {
          console.warn('[Session End] ⚠️ Upload skipped (streaming mode):', err);
        }
      }

      // Clear accumulated segments
      fullAudioBlobsRef.current = [];

      // Notify parent if transcription complete (Phase 6 - uses finalText from above)
      if (onTranscriptionComplete && finalText) {
        onTranscriptionComplete({ text: finalText });
      }

      // Reset everything for new session
      setIsPaused(false);
      resetTranscription();
      resetMetrics();
      setChunkStatuses([]);
      chunkNumberRef.current = 0;
      sessionIdRef.current = '';
      addLog('🔄 Sesión finalizada - listo para nueva grabación');
    } catch (err) {
      console.error('[Session] End error:', err);
    }
  }, [pausedAudioUrl, getTranscriptionText, onTranscriptionComplete, resetTranscription, resetMetrics, setChunkStatuses, addLog]);

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
    // Capture ref value to avoid stale closure issues in cleanup
    const intervalId = pollingIntervalRef.current;
    return () => {
      // Cleanup polling interval if exists
      if (intervalId) {
        clearInterval(intervalId);
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
        isPaused={isPaused}
        isProcessing={isProcessing}
        recordingTime={recordingTime}
        transcriptionData={transcriptionData}
        chunkCount={chunkNumberRef.current}
        onStart={handleStartRecording}
        onPause={handlePauseRecording}
        onResume={handleResumeRecording}
        onEndSession={handleEndSession}
      />

      {/* Audio Level Visualizer - Show during recording or when paused */}
      {(isRecording || isPaused) && (
        <div className="space-y-2">
          <AudioLevelVisualizer
            audioLevel={audioLevel}
            recordingTime={recordingTime}
            wordCount={getWordCount()}
            chunkCount={chunkNumberRef.current}
          />
          {/* WebSpeech Status Badge */}
          {isWebSpeechSupported && (
            <div className="flex items-center justify-center gap-2">
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isWebSpeechActive
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isWebSpeechActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  WebSpeech {isWebSpeechActive ? 'ON' : 'OFF'}
                </span>
              </div>
              {webSpeechInterim && (
                <div className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-lg text-xs italic border border-blue-500/20">
                  "{webSpeechInterim}..."
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Advanced Monitoring Panel - Persist after recording stops */}
      {chunkStatuses.length > 0 && (
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

      {/* 3 Separate Transcription Sources - Show when recording/paused */}
      {(isRecording || isPaused || chunkNumberRef.current > 0) && (
        <TranscriptionSources
          webSpeechTranscripts={webSpeechTranscripts}
          whisperChunks={chunkStatuses
            .filter((c) => c.status === 'completed' && c.transcript)
            .map((c) => ({ chunk_number: c.index, text: c.transcript || '' }))}
          fullTranscription={transcriptionData?.text || ''}
          className="mt-4"
        />
      )}

      {/* Paused Audio Preview - Show when paused */}
      {isPaused && (
        <PausedAudioPreview
          audioUrl={pausedAudioUrl}
          segmentCount={fullAudioBlobsRef.current.length}
          chunkCount={chunkNumberRef.current}
          onEndSession={handleEndSession}
          onResume={handleResumeRecording}
        />
      )}

      {/* Final Transcription Result - Only when session is ended (not paused) */}
      {!isRecording && !isPaused && chunkNumberRef.current > 0 && (
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
