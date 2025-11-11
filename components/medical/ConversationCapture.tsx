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

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api/client';
import { makeRecorder, guessExt, type Recorder } from '@/lib/recording/makeRecorder';

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
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionData>({ text: '' });
  const [headerBlob, setHeaderBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>(
    (typeof window !== 'undefined' && window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
      ? 'audio/webm;codecs=opus'
      : (typeof window !== 'undefined' && window.MediaRecorder && MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2')
        ? 'audio/mp4;codecs=mp4a.40.2'
        : '')
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Use external recording state if provided, otherwise use internal
  const isRecording = externalIsRecording !== undefined ? externalIsRecording : internalIsRecording;
  const setIsRecording = setExternalIsRecording || setInternalIsRecording;

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunkNumberRef = useRef<number>(0);
  const streamingTranscriptRef = useRef<string>('');
  const sessionIdRef = useRef<string>('');
  const inflightRef = useRef<Set<string>>(new Set());

  /**
   * Poll job status until completed (AUR-PROMPT-4.2).
   *
   * @param jobId Celery job ID
   * @param chunkNumber Chunk index for logging
   * @returns Transcript text or null if failed
   */
  const pollJobStatus = useCallback(async (jobId: string, chunkNumber: number): Promise<string | null> => {
    const maxAttempts = 120; // 120 attempts * 500ms = 60s timeout (AUR-PROMPT-4.2: Whisper takes ~23s/chunk)
    const pollInterval = 500; // 500ms between polls

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(
          `http://localhost:7001/internal/transcribe/jobs/${jobId}`
        );

        if (!response.ok) {
          console.error(`[CHUNK ${chunkNumber}] Poll failed: ${response.status}`);
          return null;
        }

        const jobStatus = await response.json();

        if (jobStatus.status === 'SUCCESS' && jobStatus.result) {
          return jobStatus.result.transcript || null;
        } else if (jobStatus.status === 'FAILURE') {
          console.error(
            `[CHUNK ${chunkNumber}] Job failed: ${jobStatus.error || 'Unknown error'}`
          );
          return null;
        } else if (jobStatus.status === 'PENDING' || jobStatus.status === 'STARTED' || jobStatus.status === 'RETRY') {
          // Still processing (or retrying), wait and continue polling
          if (jobStatus.status === 'RETRY') {
            console.log(`[CHUNK ${chunkNumber}] ⏳ Job retrying, continuing to poll...`);
          }
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        } else {
          console.warn(`[CHUNK ${chunkNumber}] Unknown job status: ${jobStatus.status}`);
          return null;
        }
      } catch (err) {
        console.error(`[CHUNK ${chunkNumber}] Poll error:`, err);
        return null;
      }
    }

    console.error(`[CHUNK ${chunkNumber}] Poll timeout after ${maxAttempts * pollInterval}ms`);
    return null;
  }, []);

  // Audio level analysis refs
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const lastAudioLevelRef = useRef<number>(0); // Track latest audio level for silence detection

  // Silence detection threshold (0-255 scale, average across frequencies)
  // Values below this threshold will be considered silence and skipped
  // Recommended range: 5-15 (5 = very sensitive, 15 = less sensitive)
  // Lowered to 5 for low-gain microphones
  const SILENCE_THRESHOLD = 5;

  // Audio gain multiplier for low-gain microphones
  // 1.0 = no amplification, 2.0 = double, 3.0 = triple
  const AUDIO_GAIN = 2.5;

  // Generate session ID (UUID4 format required by FI backend)
  const getSessionId = useCallback(() => {
    // Generate UUID4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }, []);

  // Copy ID to clipboard
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(label);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // Real-time audio level analysis using Web Audio API
  useEffect(() => {
    if (!currentStreamRef.current || !isRecording) {
      setAudioLevel(0);
      return;
    }

    // Create AudioContext and Analyser
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const source = audioContext.createMediaStreamSource(currentStreamRef.current);

    // Configure gain for low-volume microphones
    gainNode.gain.value = AUDIO_GAIN;

    // Configure analyser for real-time response
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // Audio routing: source → gain → analyser
    source.connect(gainNode);
    gainNode.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    console.log(
      `[Audio Setup] Gain: ${AUDIO_GAIN}x, Silence threshold: ${SILENCE_THRESHOLD}/255 (${Math.round((SILENCE_THRESHOLD / 255) * 100)}%)`
    );

    // Audio analysis loop
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average level (0-255 range)
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average);
      lastAudioLevelRef.current = average; // Store for silence detection

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording]);

  // Poll for workflow status
  const pollWorkflowStatus = useCallback(async (currentJobId: string) => {
    try {
      const status = await api.get<WorkflowStatus>(`/api/workflows/aurity/consult/${currentJobId}`);
      setWorkflowStatus(status);

      // If completed, extract results
      if (status.status === 'completed' && status.result_data) {
        const data: TranscriptionData = {
          text: status.result_data.transcription?.text || '',
          speakers: status.result_data.diarization?.speakers || [],
          soapNote: status.soap_note || undefined
        };

        setTranscriptionData(data);
        setIsProcessing(false);

        if (onTranscriptionComplete) {
          onTranscriptionComplete(data);
        }

        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (status.status === 'failed') {
        setError(status.error || 'Workflow failed');
        setIsProcessing(false);

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error polling workflow status:', err);
      setError(err instanceof Error ? err.message : 'Failed to get workflow status');
    }
  }, [onTranscriptionComplete]);

  // Validate if blob has valid EBML header (WebM/Matroska magic: 0x1A45DFA3)
  const hasValidEBMLHeader = useCallback(async (blob: Blob): Promise<boolean> => {
    if (blob.size < 4) return false;
    const buffer = await blob.slice(0, 4).arrayBuffer();
    const view = new DataView(buffer);
    const magic = view.getUint32(0, false); // Big-endian
    return magic === 0x1A45DFA3; // EBML magic number
  }, []);

  // Process audio chunk in real-time
  const processAudioChunk = useCallback(async (chunkBlob: Blob, chunkNumber: number, sessionId: string) => {
    try {
      console.log(`[CHUNK ${chunkNumber}] Starting processing - Size: ${chunkBlob.size} bytes`);

      // Validate chunk 0 has EBML header
      if (chunkNumber === 0) {
        const hasHeader = await hasValidEBMLHeader(chunkBlob);
        if (!hasHeader) {
          console.warn(`[CHUNK 0] ⚠️ No valid EBML header detected - MediaRecorder may be emitting raw Opus data`);
          console.warn(`[CHUNK 0] 💡 Streaming disabled - will use batch mode instead`);
          setError('Streaming no disponible en este navegador. Se usará modo batch al finalizar.');
          return; // Skip streaming, will process on stop
        }
      }

      const timestampStart = (chunkNumber * 3.0); // 3 seconds per chunk
      const timestampEnd = timestampStart + 3.0;

      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('chunk_number', chunkNumber.toString());
      formData.append('audio', chunkBlob, `chunk_${chunkNumber}.webm`);
      formData.append('timestamp_start', timestampStart.toString());
      formData.append('timestamp_end', timestampEnd.toString());

      console.log(`[CHUNK ${chunkNumber}] Sending to backend - Session: ${sessionId.substring(0, 8)}...`);

      // Send chunk to backend (AUR-PROMPT-3.3: Form-based API)
      const response = await fetch('http://localhost:7001/api/workflows/aurity/consult/stream', {
        method: 'POST',
        body: formData,
      });

      console.log(`[CHUNK ${chunkNumber}] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[CHUNK ${chunkNumber}] Backend error:`, errorText);
        throw new Error(`Chunk processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[CHUNK ${chunkNumber}] Backend response:`, result);

      // Update streaming transcript
      if (result.transcription) {
        console.log(`[CHUNK ${chunkNumber}] ✅ Transcription received: "${result.transcription}"`);
        streamingTranscriptRef.current += ' ' + result.transcription;
        setTranscriptionData(prev => ({
          ...prev,
          text: streamingTranscriptRef.current.trim()
        }));
      } else {
        console.warn(`[CHUNK ${chunkNumber}] ⚠️ No transcription in response. Status: ${result.status}`);
        if (result.error) {
          console.error(`[CHUNK ${chunkNumber}] Backend error message: ${result.error}`);
        }
      }

    } catch (err) {
      console.error(`[CHUNK ${chunkNumber}] ❌ Processing failed:`, err);
    }
  }, [hasValidEBMLHeader]);

  // Start recording with real-time streaming (RecordRTC mode)
  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      chunkNumberRef.current = 0;
      streamingTranscriptRef.current = '';
      inflightRef.current.clear();

      const sessionId = getSessionId();
      sessionIdRef.current = sessionId;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Store stream for audio analysis
      currentStreamRef.current = stream;

      // Get timeSlice from env (default 3000ms)
      const timeSlice = parseInt(
        process.env.NEXT_PUBLIC_AURITY_TIME_SLICE ?? '3000',
        10
      );

      // Create recorder with RecordRTC or MediaRecorder fallback
      const recorder = await makeRecorder(
        stream,
        async (blob: Blob) => {
          // Capture chunk number and increment IMMEDIATELY (atomic operation)
          // This prevents race conditions when multiple chunks arrive rapidly
          const chunkNumber = chunkNumberRef.current++;

          // Deduplication: prevent duplicate chunk processing
          const key = `${sessionIdRef.current}:${chunkNumber}`;
          if (inflightRef.current.has(key)) {
            console.warn(`[CHUNK ${chunkNumber}] ⚠️ Already processing, skipping duplicate`);
            return;
          }
          inflightRef.current.add(key);

          try {
            const timestampStart = chunkNumber * (timeSlice / 1000);
            const timestampEnd = timestampStart + timeSlice / 1000;

            // Silence detection: skip chunks with low audio level
            const currentAudioLevel = lastAudioLevelRef.current;
            if (currentAudioLevel < SILENCE_THRESHOLD) {
              const percentLevel = Math.round((currentAudioLevel / 255) * 100);
              console.log(
                `[CHUNK ${chunkNumber}] ⏭️ Skipped (silence detected) - Audio level: ${currentAudioLevel.toFixed(1)}/255 (${percentLevel}%), Threshold: ${SILENCE_THRESHOLD} (${Math.round((SILENCE_THRESHOLD / 255) * 100)}%), Gain: ${AUDIO_GAIN}x`
              );
              // Mark as processed but don't send to backend
              inflightRef.current.delete(key);
              // Note: chunk counter already incremented at top of function
              return;
            }

            // ================================================================
            // HYBRID TRANSCRIPTION: Orchestrator handles try-direct-first
            // (AUR-PROMPT-4.2 - Architectural Compliance)
            // ================================================================
            // Frontend calls PUBLIC endpoint ONLY
            // Backend orchestrator tries:
            //   1. DIRECT (fast, 1-3s) → returns transcript immediately
            //   2. WORKER (fallback, async) → returns job_id for polling

            const percentLevel = Math.round((currentAudioLevel / 255) * 100);
            console.log(
              `[CHUNK ${chunkNumber}] 📤 Submitting to orchestrator - Size: ${blob.size} bytes, Audio level: ${currentAudioLevel.toFixed(1)}/255 (${percentLevel}%)`
            );

            const formData = new FormData();
            formData.append('session_id', sessionIdRef.current);
            formData.append('chunk_number', chunkNumber.toString());
            formData.append('mime', blob.type || '');
            formData.append('audio', blob, `${chunkNumber}${guessExt(blob.type)}`);
            formData.append('timestamp_start', timestampStart.toString());
            formData.append('timestamp_end', timestampEnd.toString());

            const response = await fetch(
              'http://localhost:7001/api/workflows/aurity/consult/stream',
              {
                method: 'POST',
                body: formData,
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[CHUNK ${chunkNumber}] ❌ Orchestrator error:`, errorText);
              throw new Error(`Orchestrator failed: ${response.statusText}`);
            }

            const result = await response.json();

            // Case 1: Direct transcription succeeded (status='completed')
            if (result.status === 'completed' && result.transcription) {
              console.log(
                `[CHUNK ${chunkNumber}] ✅ DIRECT path: "${result.transcription}"`
              );

              streamingTranscriptRef.current += ' ' + result.transcription;
              setTranscriptionData((prev) => ({
                ...prev,
                text: streamingTranscriptRef.current.trim(),
              }));

              // TODO: Store in IndexedDB with status='direct_success'
            }
            // Case 2: Worker fallback (status='queued', job_id present)
            else if (result.queued && result.job_id) {
              console.log(
                `[CHUNK ${chunkNumber}] 🔄 WORKER fallback: ${result.job_id} - Polling...`
              );

              // TODO: Store in IndexedDB with status='worker_queued', jobId=...

              // Poll job status until completed
              const transcript = await pollJobStatus(result.job_id, chunkNumber);

              if (transcript) {
                console.log(
                  `[CHUNK ${chunkNumber}] ✅ WORKER completed: "${transcript}"`
                );
                streamingTranscriptRef.current += ' ' + transcript;
                setTranscriptionData((prev) => ({
                  ...prev,
                  text: streamingTranscriptRef.current.trim(),
                }));

                // TODO: Update IndexedDB with status='worker_success', transcript=...
              }
            } else {
              console.warn(
                `[CHUNK ${chunkNumber}] ⚠️ Unexpected response format:`,
                result
              );
            }
          } catch (err) {
            console.error(`[CHUNK ${chunkNumber}] ❌ Processing failed:`, err);
          } finally {
            inflightRef.current.delete(key);
            // Note: chunk counter already incremented at top of function
          }
        },
        {
          timeSlice,
          sampleRate: 16000,
          channels: 1,
        }
      );

      recorderRef.current = recorder;

      console.log(`[Recorder] Using ${recorder.kind} mode`);

      // Start recording
      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  }, [setIsRecording, getSessionId, onTranscriptionComplete]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    try {
      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Stop recorder (RecordRTC or MediaRecorder)
      if (recorderRef.current) {
        await recorderRef.current.stop();
        console.log('[Recorder] Stopped successfully');
      }

      // Stop media stream tracks
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach((track) => track.stop());
        currentStreamRef.current = null;
      }

      setIsRecording(false);

      // Notify parent if transcription complete
      if (onTranscriptionComplete && streamingTranscriptRef.current) {
        onTranscriptionComplete({
          text: streamingTranscriptRef.current.trim(),
        });
      }
    } catch (err) {
      console.error('[Recorder] Stop error:', err);
    }
  }, [setIsRecording, onTranscriptionComplete]);

  // Upload audio to backend
  const uploadAudioToBackend = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const sessionId = getSessionId();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Call FI backend workflow orchestrator
      const response = await fetch('http://localhost:7001/api/workflows/aurity/consult', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setJobId(result.job_id);

      // Start polling for status
      pollingIntervalRef.current = setInterval(() => {
        pollWorkflowStatus(result.job_id);
      }, 2000); // Poll every 2 seconds

    } catch (err) {
      console.error('Error uploading audio:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el audio');
      setIsProcessing(false);
    }
  }, [getSessionId, pollWorkflowStatus]);

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className={`space-y-6 ${className} relative`}>
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
          <h3 className="text-lg font-semibold text-white mb-4">Análisis de Audio en Vivo</h3>

          {/* Audio Level Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Nivel de audio</span>
              <span className="text-emerald-400 font-mono font-bold">
                {Math.round((audioLevel / 255) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-100 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500"
                style={{ width: `${(audioLevel / 255) * 100}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 text-center">
              <div className="text-2xl font-bold text-cyan-400">{chunkNumberRef.current}</div>
              <div className="text-xs text-slate-400 mt-1">Chunks enviados</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 text-center">
              <div className="text-2xl font-bold text-emerald-400">{recordingTime}s</div>
              <div className="text-xs text-slate-400 mt-1">Tiempo grabando</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {transcriptionData?.text ? transcriptionData.text.split(' ').length : 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Palabras</div>
            </div>
          </div>
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
        <div className="bg-slate-800 rounded-xl p-6 border border-cyan-500/30 animate-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <h3 className="text-lg font-semibold text-white">Transcripción en Tiempo Real</h3>
            <span className="text-xs text-cyan-400 ml-auto">
              {chunkNumberRef.current} chunks procesados
            </span>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {transcriptionData?.text}
              <span className="inline-block w-1 h-4 ml-1 bg-cyan-400 animate-pulse" />
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span>💡 El texto se actualiza cada 3 segundos mientras hablas</span>
          </div>
        </div>
      )}

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

          {onNext && (
            <button
              onClick={onNext}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Continuar al Siguiente Paso
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
    </div>
  );
}
