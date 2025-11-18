'use client';

/**
 * ConversationCapture Component - AURITY Medical Workflow
 *
 * Production-ready audio recording and transcription component
 * integrated with FI backend services (no demo/mock data).
 *
 * Backend Integration (Refactored 2025-11-15):
 * - POST /api/workflows/aurity/stream - Upload audio chunks
 * - POST /api/workflows/aurity/sessions/{id}/checkpoint - Concatenate audio on pause
 * - POST /api/workflows/aurity/sessions/{id}/diarization - Dispatch speaker separation (NEW)
 * - GET /api/workflows/aurity/sessions/{id}/monitor - Monitor progress
 *
 * Workflow:
 * 1. Upload chunks → transcription (Azure Whisper)
 * 2. Checkpoint on pause (concatenate audio)
 * 3. End session → dispatch diarization (Azure GPT-4)
 * 4. SOAP generation (TBD)
 * 5. Finalize (encrypt session - only after SOAP)
 *
 * Features:
 * - Real audio recording with MediaRecorder API
 * - Pause/Resume support with checkpoint concatenation
 * - Speaker diarization with Azure GPT-4
 * - Real-time progress monitoring
 *
 * File: apps/aurity/components/medical/ConversationCapture.tsx
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { guessExt } from '@/lib/recording/makeRecorder';
import { useClipboard } from '@/hooks/useClipboard';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { useChunkProcessor } from '@/hooks/useChunkProcessor';
import { useRecorder } from '@/hooks/useRecorder';
import { useTranscription, type TranscriptionData } from '@/hooks/useTranscription';
import { useWebSpeech } from '@/hooks/useWebSpeech';
import { useDiarizationPolling } from '@/hooks/useDiarizationPolling';
import { AUDIO_CONFIG } from '@/lib/audio/constants';
import { POLLING_CONFIG } from '@/lib/constants/polling';
import { medicalWorkflowApi } from '@/lib/api/medical-workflow';
import { DemoButton } from './DemoButton';
import { DemoConsultationModal } from './DemoConsultationModal';
import { SessionBadges } from './SessionBadges';
import { RecordingControls } from './RecordingControls';
import { AudioLevelVisualizer } from './AudioLevelVisualizer';
import { AdvancedMetrics } from './AdvancedMetrics';
import { WorkflowProgress } from './WorkflowProgress';
import { PatientInfoModal, type PatientInfo } from './PatientInfoModal';
import { StreamingTranscript } from './StreamingTranscript';
import { PausedAudioPreview } from './PausedAudioPreview';
import { FinalTranscription } from './FinalTranscription';
import { TranscriptionSources } from './TranscriptionSources';
import { DiarizationProcessingModal } from './DiarizationProcessingModal';
import { CheckpointProgress } from './CheckpointProgress';
import { H5DebugModal } from '../dev/H5DebugModal';
import { useH5DebugTools } from '@/hooks/useH5DebugTools';

// Backend URL constant
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

interface ConversationCaptureProps {
  onNext?: () => void;
  onTranscriptionComplete?: (data: TranscriptionData) => void;
  isRecording?: boolean;
  setIsRecording?: (recording: boolean) => void;
  onSessionCreated?: (sessionId: string) => void; // Callback when session ID is generated
  sessionId?: string; // Existing session ID (for read-only mode)
  readOnly?: boolean; // Read-only mode for existing sessions
  patient?: { id: string; name: string; age: number }; // Selected patient from parent
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
  onSessionCreated,
  sessionId: externalSessionId,
  readOnly = false,
  patient,
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

  // Loaded chunk metrics (for displaying in TranscriptionSources when opening saved session)
  const [loadedChunkMetrics, setLoadedChunkMetrics] = useState<Array<{
    chunk_number: number;
    text: string;
    provider?: string;
    polling_attempts?: number;
    resolution_time_seconds?: number;
    retry_attempts?: number;
    confidence?: number;
    duration?: number;
  }>>([]);

  // Checkpoint state (for visual feedback during pause)
  const [checkpointState, setCheckpointState] = useState<{
    isCreating: boolean;
    isSuccess: boolean;
    isError: boolean;
    chunksCount?: number;
    audioSizeMB?: number;
    errorMessage?: string;
  }>({
    isCreating: false,
    isSuccess: false,
    isError: false,
  });

  // Diarization polling state
  const [sessionId, setSessionId] = useState<string>(''); // NEW: State for sessionId (needed for polling hook reactivity)
  const [diarizationJobId, setDiarizationJobId] = useState<string | null>(null);
  const [showDiarizationModal, setShowDiarizationModal] = useState(false);
  const [isWaitingForChunks, setIsWaitingForChunks] = useState(false);
  const [shouldFinalize, setShouldFinalize] = useState(false);
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState<number>(0);
  const finalizationStartTimeRef = useRef<number>(0);
  const [isFinalized, setIsFinalized] = useState(false); // NEW: Flag to prevent recording after completion
  const [showPatientInfoModal, setShowPatientInfoModal] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);

  // Custom hooks
  const { copiedId, copyToClipboard } = useClipboard();

  // Demo modal state (replaces useDemoMode)
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
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
    backendUrl: BACKEND_URL,
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

  // Refs (must be declared BEFORE useDiarizationPolling uses them)
  const audioChunksRef = useRef<Blob[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunkNumberRef = useRef<number>(0);
  const sessionIdRef = useRef<string>('');
  const inflightRef = useRef<Set<string>>(new Set());
  const fullAudioBlobsRef = useRef<Blob[]>([]);  // Store full audio blob

  // Diarization polling hook (use sessionIdRef for consistency)
  const {
    status: diarizationStatus,
    isPolling,
    currentInterval,
    totalPolls,
  } = useDiarizationPolling({
    sessionId: diarizationJobId || '', // job_id IS the session_id (backend returns same value)
    jobId: diarizationJobId || '',
    enabled: showDiarizationModal && !!diarizationJobId,
    pollInterval: POLLING_CONFIG.INITIAL_INTERVAL,
    maxInterval: POLLING_CONFIG.MAX_INTERVAL,
    onComplete: async () => {
      console.log('[Diarization] ✅ Completed with triple vision');
      addLog('✅ Diarización completada');

      // Mark session as finalized (prevents new recordings without page reload)
      setIsFinalized(true);

      // Keep modal open briefly to show success, then trigger Phase 4 (SOAP)
      setTimeout(async () => {
        setShowDiarizationModal(false);
        setDiarizationJobId(null);

        console.log('[Workflow] 🎯 Phase 3 complete. Auto-advancing to Phase 4 (SOAP).');

        // Phase 4: Trigger SOAP generation (use sessionId before reset)
        const currentSessionId = sessionIdRef.current;
        if (currentSessionId) {
          try {
            console.log('[SOAP] 🚀 Starting SOAP generation...', currentSessionId);
            addLog('📋 Generando notas SOAP...');

            const soapResponse = await medicalWorkflowApi.startSOAPGeneration(currentSessionId);
            console.log('[SOAP] ✅ SOAP generation started:', soapResponse);
            addLog('✅ Generación SOAP iniciada');

            // Note: Frontend should poll /monitor endpoint for SOAP progress
            // SOAP note will be retrieved when user navigates to review page
          } catch (error) {
            console.error('[SOAP] ❌ Failed to start SOAP generation:', error);
            addLog('⚠️ Error al generar SOAP (continuando...)');
          }
        }

        // DON'T reset session - keep sessionId so user can view SOAP notes in "Notas" tab
        // Session will be reset when user starts a new consultation
        // sessionIdRef.current = '';  // ❌ KEEP sessionId for SOAP note retrieval
        // setSessionId('');           // ❌ KEEP sessionId for SOAP note retrieval
        addLog('✅ Sesión completada - avanzando a revisión del diálogo');

        // Auto-advance to next workflow step (component stays mounted - no data loss)
        onNext?.();
      }, 2000);
    },
    onError: (error) => {
      console.error('[Diarization] ❌ Error:', error);
      setShowDiarizationModal(false);
      setDiarizationJobId(null);
      // Reset on error too
      sessionIdRef.current = '';
      setSessionId('');
      addLog(`❌ Error en diarización: ${error}`);
    },
  });

  // Refs (audio level refs for breaking circular dependency)
  const audioLevelRef = useRef<number>(0);
  const isSilentRef = useRef<boolean>(true);

  // Effect: Initialize patient info from parent's selected patient
  useEffect(() => {
    if (patient && !patientInfo) {
      console.log('[ConversationCapture] Initializing patient info from parent:', patient);
      setPatientInfo({
        patient_name: patient.name,
        patient_age: patient.age.toString(),
        patient_id: patient.id,
      });
    }
  }, [patient, patientInfo]);

  // Effect: Initialize read-only mode with existing session
  useEffect(() => {
    if (readOnly && externalSessionId) {
      console.log('[ConversationCapture] Read-only mode - loading session:', externalSessionId);
      setSessionId(externalSessionId);
      setIsFinalized(true); // Mark as finalized to prevent recording

      // Load existing transcription chunks AND Triple Vision sources
      const loadExistingData = async () => {
        try {
          addLog('📖 Cargando sesión existente...');

          // Load all 3 transcription sources (Triple Vision)
          const sources = await medicalWorkflowApi.getTranscriptionSources(externalSessionId);

          console.log('[ConversationCapture] Loaded transcription sources:', {
            webspeech_count: sources.webspeech_final.length,
            chunks_count: sources.transcription_per_chunks.length,
            full_length: sources.full_transcription.length,
          });

          // 1. Populate WebSpeech transcripts
          if (sources.webspeech_final.length > 0) {
            setWebSpeechTranscripts(sources.webspeech_final);
            console.log('[ConversationCapture] ✅ WebSpeech loaded:', sources.webspeech_final.length);
          }

          // 2. Populate chunk transcripts (Whisper/Deepgram)
          if (sources.transcription_per_chunks.length > 0) {
            // Populate chunk statuses
            const loadedStatuses = sources.transcription_per_chunks.map((chunk) => ({
              chunkNumber: chunk.chunk_number,
              status: 'completed' as const,
              timestamp: new Date().toISOString(), // Use current time for existing chunks
              latency: 0,
              transcript: chunk.transcript,
            }));
            setChunkStatuses(loadedStatuses);

            // Populate chunk metrics with ALL fields (for TranscriptionSources display)
            const chunkMetrics = sources.transcription_per_chunks.map((chunk) => ({
              chunk_number: chunk.chunk_number,
              text: chunk.transcript,
              provider: chunk.provider,
              polling_attempts: chunk.polling_attempts,
              resolution_time_seconds: chunk.resolution_time_seconds,
              retry_attempts: chunk.retry_attempts,
              confidence: chunk.confidence,
              duration: chunk.duration,
            }));
            setLoadedChunkMetrics(chunkMetrics);

            // Populate transcription data (for streaming view)
            sources.transcription_per_chunks.forEach((chunk) => {
              if (chunk.transcript) {
                addTranscriptionChunk({
                  text: chunk.transcript,
                  timestamp: new Date().toISOString(),
                  chunkNumber: chunk.chunk_number,
                  isFinal: true,
                });
              }
            });

            console.log('[ConversationCapture] ✅ Chunks loaded:', sources.transcription_per_chunks.length);
          }

          // 3. Full transcription is available via sources.full_transcription
          // TranscriptionSources component will display it automatically

          // Load audio file
          const audioUrl = `${BACKEND_URL}/api/workflows/aurity/sessions/${externalSessionId}/audio`;
          setPausedAudioUrl(audioUrl);
          setIsPaused(true); // Show audio player

          const totalDuration = sources.transcription_per_chunks.reduce(
            (sum, chunk) => sum + chunk.duration,
            0
          );

          addLog(
            `✅ Sesión cargada: ${sources.transcription_per_chunks.length} chunks, ${totalDuration.toFixed(1)}s` +
            (sources.webspeech_final.length > 0 ? `, ${sources.webspeech_final.length} webspeech` : '')
          );
        } catch (error) {
          console.error('[ConversationCapture] Failed to load session:', error);
          addLog(`❌ Error cargando sesión: ${error}`);
        }
      };

      loadExistingData();
    }
  }, [readOnly, externalSessionId, addLog, setChunkStatuses, addTranscriptionChunk]);

  // Effect: Monitor chunk completion and trigger finalization when ready
  useEffect(() => {
    if (!shouldFinalize || !isWaitingForChunks) {
      return;
    }

    const pendingChunks = chunkStatuses.filter(
      (c) => c.status !== 'completed' && c.status !== 'failed'
    );
    const completedCount = chunkStatuses.filter((c) => c.status === 'completed').length;

    // Fetch monitor to get estimated time remaining
    const fetchMonitor = async () => {
      try {
        const monitorText = await medicalWorkflowApi.getSessionMonitor(sessionIdRef.current);
        // Parse JSON from monitor text response (backend returns both ASCII + JSON)
        try {
          const data = JSON.parse(monitorText);
          setEstimatedSecondsRemaining(data.transcription?.estimated_seconds_remaining || 0);
        } catch {
          // If not JSON, ignore (pure ASCII art)
          console.log('[Monitor] ASCII art response received');
        }
      } catch (error) {
        console.error('[Monitor] Failed to fetch estimated time:', error);
      }
    };

    if (pendingChunks.length > 0) {
      fetchMonitor();
    }

    // Log progress
    if (pendingChunks.length > 0) {
      addLog(`⏳ Transcripción: ${completedCount}/${chunkNumberRef.current} chunks completados`);
    }

    // Check timeout (30 seconds)
    const elapsed = Date.now() - finalizationStartTimeRef.current;
    if (elapsed > 30000 && pendingChunks.length > 0) {
      addLog(`⚠️ Timeout: ${pendingChunks.length} chunks aún pendientes`);
      setIsWaitingForChunks(false);
      setShouldFinalize(false);
      return;
    }

    // All chunks completed - proceed with finalization
    if (pendingChunks.length === 0 && chunkNumberRef.current > 0) {
      setIsWaitingForChunks(false);
      // The actual finalization will continue in handleEndSession
    }
  }, [chunkStatuses, shouldFinalize, isWaitingForChunks, addLog]);

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

        const result = await medicalWorkflowApi.uploadChunk(
          sessionIdRef.current,
          chunkNumber,
          blob,
          {
            timestampStart,
            timestampEnd,
            filename: `${chunkNumber}${guessExt(blob.type)}`,
            // Include patient info in first chunk only
            ...(chunkNumber === 0 && patientInfo ? { patientInfo } : {}),
          }
        );

        // Direct transcription (transcript available immediately)
        if (result.transcript) {
          addTranscriptionChunk(result.transcript);
        }
        // Worker polling (transcript not available yet, status=pending)
        else if ((result.status === 'pending' || result.status === 'in_progress') && result.session_id) {
          const transcript = await pollJobStatus(sessionIdRef.current, chunkNumber);
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
    [setChunkStatuses, addLog, pollJobStatus, addTranscriptionChunk, patientInfo]
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
    // Demo mode no longer uses externalStream - modal sends chunks directly
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

  // Advanced monitoring state
  const [wpm, setWpm] = useState<number>(0); // Words per minute
  const startTimeRef = useRef<number>(0);

  // H5 Debug Tools (development only, Ctrl+Shift+H)
  const h5Debug = useH5DebugTools(sessionIdRef.current);

  // Handle "Continue" button click - simplified (no H5 modal in production)
  const handleContinue = useCallback(() => {
    if (onNext) {
      onNext();
    }
  }, [onNext]);

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
    // ⚠️ CRITICAL: Prevent recording after session finalization (user must reload page for new session)
    if (isFinalized) {
      console.warn('[Recording] ❌ Cannot start new recording - session is finalized. Reload page for new session.');
      addLog('⚠️ Sesión completada - recarga la página para nueva consulta');
      return;
    }

    // ⚠️ REQUIRED: Patient info must be provided before starting recording
    if (!patientInfo) {
      console.log('[Recording] Patient info required - showing modal');
      setShowPatientInfoModal(true);
      return;
    }

    try {
      setError(null);
      setIsPaused(false);
      audioChunksRef.current = [];
      fullAudioBlobsRef.current = [];
      chunkNumberRef.current = 0;
      inflightRef.current.clear();

      // Reset diarization state from previous session
      setShowDiarizationModal(false);
      setDiarizationJobId(null);

      // Reset transcription (Phase 6 - uses hook)
      resetTranscription();
      setWebSpeechTranscripts([]); // Reset WebSpeech transcripts
      setLoadedChunkMetrics([]); // Reset loaded chunk metrics (from saved sessions)

      // Reset monitoring metrics
      resetMetrics();
      setWpm(0);
      startTimeRef.current = Date.now();
      addLog('🎙️ Grabación iniciada');

      // Generate NEW session ID (clean slate)
      const newSessionId = getSessionId();
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId); // Update state for polling hook reactivity

      // Notify parent component (for DialogueFlow to load later)
      onSessionCreated?.(newSessionId);

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
  }, [isFinalized, hookStartRecording, resetMetrics, resetTranscription, addLog, getSessionId, setExternalIsRecording, isWebSpeechSupported, startWebSpeech, onSessionCreated, patientInfo]);

  // Handle patient info submission from modal
  const handlePatientInfoSubmit = useCallback((info: PatientInfo) => {
    console.log('[PatientInfo] Received patient info:', info);
    setPatientInfo(info);
    setShowPatientInfoModal(false);

    // Automatically start recording after patient info is provided
    // (Need to delay slightly to allow state to update)
    setTimeout(() => {
      handleStartRecording();
    }, 100);
  }, [handleStartRecording]);

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

      // Call checkpoint endpoint to concatenate chunks incrementally
      if (sessionIdRef.current && chunkNumberRef.current > 0) {
        const lastChunkIdx = chunkNumberRef.current - 1; // Last uploaded chunk (0-indexed)
        console.log(`[Checkpoint] Creating checkpoint at chunk ${lastChunkIdx} for session ${sessionIdRef.current}`);

        // Set checkpoint creating state
        setCheckpointState({
          isCreating: true,
          isSuccess: false,
          isError: false,
          chunksCount: chunkNumberRef.current,
        });

        try {
          const checkpointResult = await medicalWorkflowApi.createCheckpoint(
            sessionIdRef.current,
            lastChunkIdx
          );

          // Backend returns 200 OK on success, throws on error (no need for success field)
          console.log('[Checkpoint] Success:', checkpointResult);
          addLog(
            `✅ Checkpoint creado: ${checkpointResult.chunks_concatenated} chunks concatenados (${(checkpointResult.full_audio_size / 1024 / 1024).toFixed(2)} MB)`
          );

          // Set success state
          setCheckpointState({
            isCreating: false,
            isSuccess: true,
            isError: false,
            chunksCount: checkpointResult.chunks_concatenated,
            audioSizeMB: checkpointResult.full_audio_size / 1024 / 1024,
          });

          // Auto-hide success after 3 seconds
          setTimeout(() => {
            setCheckpointState({
              isCreating: false,
              isSuccess: false,
              isError: false,
            });
          }, 3000);
        } catch (err) {
          console.error('[Checkpoint] Error:', err);
          addLog(`⚠️ Error en checkpoint: ${err instanceof Error ? err.message : 'Unknown'}`);

          // Set error state
          setCheckpointState({
            isCreating: false,
            isSuccess: false,
            isError: true,
            chunksCount: chunkNumberRef.current,
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
          });

          // Auto-hide error after 3 seconds
          setTimeout(() => {
            setCheckpointState({
              isCreating: false,
              isSuccess: false,
              isError: false,
            });
          }, 3000);
        }
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

  // Perform session finalization (extracted for non-blocking flow)
  const performFinalization = useCallback(async () => {
    try {
      console.log('[Session End] 🚀 Starting finalization process...');

      // Close modal temporarily during finalization
      setShowDiarizationModal(false);

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

        try {
          // Send full audio + webspeech transcripts (Triple Vision)
          const result = await medicalWorkflowApi.endSession(
            sessionIdRef.current,
            finalAudioBlob,
            webSpeechTranscripts
          );
          console.log('[Session End] ✅ Full audio + webspeech saved:', result);
          console.log('[Session End] 📋 WebSpeech transcripts sent:', webSpeechTranscripts.length);
          setJobId(result.audio_path);

          // Dispatch diarization (NEW separated endpoint - no finalize yet)
          try {
            const diarizationResult = await medicalWorkflowApi.startDiarization(sessionIdRef.current);

            // Start diarization polling with blocking modal
            if (diarizationResult.job_id) {
              console.log('[DIARIZATION] 🎙️ Starting diarization job:', diarizationResult.job_id);
              setDiarizationJobId(diarizationResult.job_id);
              setIsWaitingForChunks(false); // Chunks done, now waiting for diarization
              setShowDiarizationModal(true); // Keep modal open, but now for diarization
              addLog(`🎙️ Iniciando diarización (Job: ${diarizationResult.job_id.slice(0, 8)}...)`);
            }
          } catch (diarizationErr) {
            console.error('[Session End] ❌ Diarization error:', diarizationErr);
            addLog(`❌ Error de diarización: ${diarizationErr}`);
            setShowDiarizationModal(false);
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

      // Reset only internal state - KEEP transcription visible for review
      setIsPaused(false);
      // resetTranscription(); // ❌ COMMENTED: Keep transcription visible after completion
      // resetMetrics(); // ❌ COMMENTED: Keep metrics visible
      // setChunkStatuses([]); // ❌ COMMENTED: Keep chunk statuses visible
      chunkNumberRef.current = 0;
      // DO NOT reset sessionId here - the diarization polling needs it!
      // It will be reset in the onComplete/onError callback
    } catch (err) {
      console.error('[Session] End error:', err);
    }
  }, [pausedAudioUrl, getTranscriptionText, onTranscriptionComplete, resetTranscription, resetMetrics, setChunkStatuses, addLog, chunkStatuses, webSpeechTranscripts]);

  // Effect: Trigger finalization when chunks are ready
  useEffect(() => {
    if (shouldFinalize && !isWaitingForChunks) {
      performFinalization();
      setShouldFinalize(false); // Reset flag
    }
  }, [shouldFinalize, isWaitingForChunks, performFinalization]);

  // End session handler (non-blocking - shows modal and waits for chunks)
  const handleEndSession = useCallback(() => {
    // Show modal for chunk waiting (NOT diarization yet - that comes after)
    setShowDiarizationModal(true); // Will show "waiting for chunks" state
    setIsWaitingForChunks(true);
    setShouldFinalize(true);
    finalizationStartTimeRef.current = Date.now();

    addLog('🔄 Finalizando sesión - esperando chunks pendientes...');
  }, [addLog]);

  // Handle demo button click - opens interactive TTS modal
  const handleDemoClick = useCallback(() => {
    setIsDemoModalOpen(true);
  }, []);

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
        isDemoPlaying={false}
        isDemoPaused={false}
        isProcessing={isProcessing}
        onToggle={handleDemoClick}
      />

      {/* Demo Consultation Modal */}
      <DemoConsultationModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSendChunk={handleChunk}
        isProcessing={isProcessing}
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
        <p className="text-slate-400">
          {readOnly ? 'Sesión existente - Solo lectura' : 'Graba la consulta médica para transcripción y análisis'}
        </p>
      </div>

      {/* Read-Only Banner */}
      {readOnly && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">Sesión Existente</p>
            <p className="text-xs text-blue-400/80">
              Esta sesión ya fue grabada. La grabación está bloqueada. Mostrando audio y transcripción existentes.
            </p>
          </div>
        </div>
      )}

      {/* Recording Control */}
      <RecordingControls
        isRecording={isRecording}
        isPaused={isPaused}
        isProcessing={isProcessing}
        isFinalized={isFinalized}
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
                  &ldquo;{webSpeechInterim}...&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Checkpoint Progress - Show during pause/checkpoint operations */}
      <CheckpointProgress
        isCreating={checkpointState.isCreating}
        isSuccess={checkpointState.isSuccess}
        isError={checkpointState.isError}
        chunksCount={checkpointState.chunksCount}
        audioSizeMB={checkpointState.audioSizeMB}
        errorMessage={checkpointState.errorMessage}
      />

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

      {/* 3 Separate Transcription Sources - Show when recording/paused/completed */}
      {(isRecording || isPaused || isFinalized || chunkNumberRef.current > 0) && (
        <TranscriptionSources
          webSpeechTranscripts={webSpeechTranscripts}
          whisperChunks={
            // Use loaded chunk metrics (saved sessions) OR live chunk statuses
            loadedChunkMetrics.length > 0
              ? loadedChunkMetrics
              : chunkStatuses
                  .filter((c) => c.status === 'completed' && c.transcript)
                  .map((c) => ({
                    chunk_number: c.index,
                    text: c.transcript || '',
                    // Include backend metrics for display
                    provider: c.provider,
                    resolution_time_seconds: c.resolution_time_seconds,
                    retry_attempts: c.retry_attempts,
                    polling_attempts: c.polling_attempts,
                    confidence: c.confidence,
                    duration: c.duration,
                  }))
          }
          fullTranscription={transcriptionData?.text || ''}
          sessionId={sessionIdRef.current}
          isFinalized={isFinalized}
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

      {/* H5 Debug Modal - Development Only (Ctrl+Shift+H) */}
      {h5Debug.isEnabled && (
        <H5DebugModal
          h5Data={h5Debug.h5Data}
          isOpen={h5Debug.isOpen}
          onClose={h5Debug.close}
        />
      )}

      {/* Diarization Processing Modal - Blocking modal during diarization */}
      <DiarizationProcessingModal
        isOpen={showDiarizationModal}
        status={isWaitingForChunks ? 'waiting_for_chunks' : diarizationStatus.status}
        progress={diarizationStatus.progress}
        segmentCount={diarizationStatus.segmentCount}
        error={diarizationStatus.error}
        statusMessage={diarizationStatus.statusMessage}
        completedChunks={chunkStatuses.filter((c) => c.status === 'completed').length}
        totalChunks={chunkNumberRef.current}
        estimatedSecondsRemaining={estimatedSecondsRemaining}
        currentInterval={currentInterval}
        totalPolls={totalPolls}
        isPolling={isPolling}
        onCancel={() => {
          console.log('[ConversationCapture] Emergency exit - closing modal');
          setShowDiarizationModal(false);
          setIsWaitingForChunks(false);
          setShouldFinalize(false);
        }}
      />

      {/* Patient Info Modal - Required before starting recording */}
      <PatientInfoModal
        isOpen={showPatientInfoModal}
        onClose={() => setShowPatientInfoModal(false)}
        onSubmit={handlePatientInfoSubmit}
      />
    </div>
  );
}
