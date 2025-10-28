"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { extractMedicalTermsFromText } from '../utils/medicalTerms';
import { DefaultLogger } from '../utils/LoggerStrategy';
import { useWhisperPreload } from './useWhisperPreload';
import { useWhisperWorker } from './useWhisperWorker';
import { useAudioDenoising } from './useAudioDenoising';
import { whisperModelCache } from '../services/whisperModelCache';

// Helper function to create WAV blob from Float32Array
function createWavBlob(audioData: Float32Array, sampleRate: number): Blob {
  const length = audioData.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float32 to int16
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Unified transcription interface
interface Transcription {
  text: string;
  confidence: number;
  medicalTerms: string[];
  processingTime: number;
  timestamp?: number;
  chunks?: { id: string; text: string; timestamp: number }[];
}

type Status = 'idle' | 'recording' | 'processing' | 'collecting-residues' | 'completed' | 'error';
type EngineStatus = 'loading' | 'ready' | 'error';
type ProcessingMode = 'streaming' | 'direct' | 'enhanced';

// Unified logger interface
interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  setEnabled?: (value: boolean) => void;
}

// Unified options interface
interface UseSimpleWhisperOptions {
  // Core options
  autoPreload?: boolean;
  processingMode?: ProcessingMode;
  
  // Audio options
  chunkSize?: number;
  sampleRate?: number;
  
  // Preload options
  preloadPriority?: 'high' | 'low' | 'auto';
  preloadDelay?: number;
  
  // Error handling
  retryCount?: number;
  retryDelay?: number;
  
  // Debug
  logger?: Logger;
  showPreloadStatus?: boolean;
  
  // Callbacks
  onChunkProcessed?: (text: string, chunkNumber: number) => void;
  onChunkProgress?: (chunkNumber: number, progress: number) => void;
}

// Unified return interface
interface UseSimpleWhisperReturn {
  // Core transcription
  transcription: Transcription | null;
  status: Status;
  isRecording: boolean;
  error: string | null;
  
  // Engine status
  engineStatus: EngineStatus;
  loadProgress: number;
  
  // Audio monitoring
  audioLevel: number;
  recordingTime: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
  
  // Controls
  startTranscription: () => Promise<boolean>;
  stopTranscription: () => Promise<boolean>;
  resetTranscription: () => void;
  preloadModel: () => Promise<void>;
  
  // Enhanced preload info (from Enhanced version)
  preloadStatus: 'idle' | 'loading' | 'loaded' | 'failed';
  preloadProgress: number;
  isPreloaded: boolean;
  
  // Debug
  setLogger?: (enabled: boolean) => void;
}

export function useSimpleWhisper({
  autoPreload = false,
  processingMode = 'direct', // Default to direct for best performance
  chunkSize = 160000, // 10 seconds at 16kHz
  sampleRate = 16000,
  preloadPriority = 'auto',
  preloadDelay = 2000,
  retryCount = 3,
  retryDelay = 1000,
  logger = DefaultLogger,
  showPreloadStatus = false,
  onChunkProcessed,
  onChunkProgress
}: UseSimpleWhisperOptions = {}): UseSimpleWhisperReturn {
  
  // Core state
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('loading');
  const [loadProgress, setLoadProgress] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Refs for cleanup and state management
  const transcriptPartsRef = useRef<{ [key: string]: string }>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const processingTimeRef = useRef<number>(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chunkCountRef = useRef<number>(0); // Contador de chunks procesados
  const engineStatusRef = useRef<EngineStatus>('loading'); // Track engine status in ref
  
  // Enhanced preload integration
  const { 
    status: preloadStatus, 
    progress: preloadProgress,
    isLoaded: isPreloaded,
    forcePreload 
  } = useWhisperPreload({
    autoInit: autoPreload,
    priority: preloadPriority,
    delay: preloadDelay
  });
  
  // Hooks for different processing modes
  const { 
    isReady: isWorkerReady, 
    processChunk: processWorkerChunk, 
    reset: resetWorker 
  } = useWhisperWorker({
    onChunkProcessed: (text, chunkId) => {
      transcriptPartsRef.current[chunkId] = text;
      logger.log(`[${processingMode}] Chunk ${chunkId} processed: ${text}`);
      
      // Extract chunk number from chunkId
      const chunkNumber = parseInt(chunkId.split('_')[1]) || chunkCountRef.current;
      
      // Llamar al callback del usuario si existe
      if (onChunkProcessed && text) {
        onChunkProcessed(text, chunkNumber);
      }
    },
    onChunkProgress: (chunkId, progress) => {
      const chunkNumber = parseInt(chunkId.split('_')[1]) || chunkCountRef.current;
      logger.log(`[${processingMode}] Chunk ${chunkNumber} progress: ${progress}%`);
      
      if (onChunkProgress) {
        onChunkProgress(chunkNumber, progress);
      }
    },
    onError: (workerError) => {
      logger.error(`[${processingMode}] Worker error:`, workerError);
      setError(workerError);
      setStatus('error');
    },
    onModelLoading: (progress) => {
      setLoadProgress(progress);
      logger.log(`[${processingMode}] Model loading: ${progress}%`);
    },
    onModelReady: () => {
      setEngineStatus('ready');
      setLoadProgress(100);
      logger.log(`[${processingMode}] Model ready`);
    }
  });
  
  // BRUTAL BAZAR: Audio denoising as exclusive gateway
  const { 
    start: startAudioCapture, 
    stop: stopAudioCapture, 
    isRecording: isAudioRecording,
    getCompleteAudio: getCombinedAudio,
    audioChunks // BAZAR: Chunks expuestos para cualquier consumidor
  } = useAudioDenoising({
    mode: processingMode,
    chunkSize: processingMode === 'streaming' ? 160000 : chunkSize, // 10s for streaming, custom for direct
    sampleRate,
    onChunkReady: async (audioData, metadata) => {
      logger.log(`[Direct] Denoised chunk ready: ${audioData.length} samples, denoisingUsed: ${metadata.denoisingUsed}`);
      logger.log(`[Direct] Worker state - isWorkerReady: ${isWorkerReady}, processingMode: ${processingMode}, engineStatus: ${engineStatusRef.current}`);
      
      // Check if engine is ready instead of just worker ready
      const isEngineReady = engineStatusRef.current === 'ready' || isWorkerReady;
      
      if (isEngineReady) {
        // Use metadata.chunkId from denoising pipeline
        const chunkNumber = metadata.chunkId;
        const chunkId = `chunk_${chunkNumber}`; 
        
        try {
          processingTimeRef.current = Date.now();
          logger.log(`[${processingMode}] Processing denoised chunk #${chunkNumber} with ${audioData.length} samples`);
          
          if (processingMode === 'direct') {
            // Direct mode: process immediately
            await processWorkerChunk(audioData, chunkId);
          } else if (processingMode === 'streaming') {
            // Streaming mode: process through streaming processor
            await processStreamingChunk(audioData, chunkId);
          }
        } catch (err) {
          logger.error(`[${processingMode}] Error processing denoised chunk:`, err);
        }
      } else {
        logger.log(`[${processingMode}] Skipping chunk - Engine ready: ${isEngineReady}, Mode: ${processingMode}`);
      }
    },
    denoisingEnabled: true, // BRUTAL: Denoising always enabled in Whisper
    environment: 'consultorio' // Default environment
  });
  
  // For streaming mode, we'll use the same worker but with accumulated chunks
  const processStreamingChunk = useCallback(async (audioData: Float32Array, chunkId: string) => {
    if (processingMode === 'streaming' && isWorkerReady) {
      // Process streaming chunks the same way as direct, just larger
      await processWorkerChunk(audioData, chunkId);
    }
  }, [processingMode, isWorkerReady, processWorkerChunk]);
  
  // BRUTAL BAZAR: Audio chunks now come from denoising pipeline
  
  // Update engine status based on selected mode and preload state
  useEffect(() => {
    if (isPreloaded) {
      setEngineStatus('ready');
      engineStatusRef.current = 'ready';
      setLoadProgress(100);
      logger.log(`[${processingMode}] Model ready from preload`);
    } else if (preloadStatus === 'loading') {
      setEngineStatus('loading');
      engineStatusRef.current = 'loading';
      setLoadProgress(preloadProgress);
    } else if (preloadStatus === 'failed') {
      setEngineStatus('error');
      engineStatusRef.current = 'error';
      setError('Error loading model from preload');
    } else {
      // Check worker readiness - same for both modes now
      const modeReady = isWorkerReady;
      if (modeReady && engineStatus === 'loading') {
        setEngineStatus('ready');
        engineStatusRef.current = 'ready';
        setLoadProgress(100);
      }
    }
  }, [isPreloaded, preloadStatus, preloadProgress, isWorkerReady, processingMode, engineStatus, logger]);
  
  // Update recording state from denoising gateway
  useEffect(() => {
    setIsRecording(isAudioRecording);
  }, [isAudioRecording]);
  
  // Audio level monitoring setup
  const setupAudioMonitoring = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        // Use ref instead of state to avoid closure issues
        if (!audioContextRef.current || !analyserRef.current) {
          setAudioLevel(0);
          return;
        }
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const level = Math.round(average);
        setAudioLevel(level);
                
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      logger.log('[AudioMonitor] Starting audio level monitoring');
      updateLevel();
    } catch (err) {
      logger.error(`[${processingMode}] Error setting up audio monitoring:`, err);
    }
  }, [processingMode, logger]);
  
  // Recording time management
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  // Preload model function
  const preloadModel = useCallback(async () => {
    if (isPreloaded) {
      logger.log(`[${processingMode}] Model already preloaded`);
      return;
    }
    
    try {
      setEngineStatus('loading');
      setError(null);
      
      // Clear previous timers
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Use enhanced preload if available
      if (showPreloadStatus) {
        await forcePreload();
      } else {
        // For direct mode, we need to ensure the worker is initialized
        if (processingMode === 'direct') {
          // The worker should be ready from preload
          const checkStatus = whisperModelCache.isModelLoaded();
          logger.log(`[preloadModel] Checking model cache status: ${checkStatus}`);
          
          if (checkStatus || isPreloaded) {
            setEngineStatus('ready');
            engineStatusRef.current = 'ready';
            setLoadProgress(100);
            logger.log('[preloadModel] Model ready from cache/preload');
            return;
          }
        }
        
        // Fallback to worker readiness check
        const modeReady = isWorkerReady;
        
        if (modeReady) {
          setEngineStatus('ready');
          setLoadProgress(100);
          return;
        }
        
        // Poll for readiness
        checkIntervalRef.current = setInterval(() => {
          const currentModeReady = isWorkerReady;
          if (currentModeReady) {
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setEngineStatus('ready');
            setLoadProgress(100);
          }
        }, 100);
        
        // Timeout after 60 seconds
        timeoutRef.current = setTimeout(() => {
          if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
          const currentModeReady = isWorkerReady;
          if (!currentModeReady) {
            setEngineStatus('error');
            setError('Timeout cargando el modelo de transcripción. Por favor, recarga la página.');
          }
        }, 60000);
      }
    } catch (err) {
      setEngineStatus('error');
      setError('Error cargando el modelo de transcripción');
      logger.error(`[${processingMode}] Error preloading model:`, err);
      
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [isPreloaded, forcePreload, showPreloadStatus, processingMode, isWorkerReady, logger]);
  
  // Start transcription
  const startTranscription = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setStatus('recording');
      setTranscription(null);
      transcriptPartsRef.current = {};
      chunkCountRef.current = 0; // Reset chunk counter
      
      const modeReady = isWorkerReady; // Both streaming and direct use the same worker now
      const isEngineReady = engineStatusRef.current === 'ready';
      
      logger.log(`[startTranscription] Mode: ${processingMode}, Worker ready: ${isWorkerReady}, Engine ready: ${isEngineReady}, Preloaded: ${isPreloaded}`);
      
      if (!isEngineReady && !modeReady && !isPreloaded) {
        setError('El modelo aún se está cargando');
        setStatus('error');
        return false;
      }
      
      // Give worker a moment to fully initialize if just became ready
      if ((modeReady || isEngineReady) && !isPreloaded) {
        logger.log('[startTranscription] Waiting 100ms for worker to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Use denoising gateway for both modes
      const stream = await startAudioCapture();
      
      if (!stream) {
        throw new Error('No se pudo iniciar la captura de audio');
      }
      
      setupAudioMonitoring(stream);
      
      // Recording state is now managed by the denoising hook
      // setIsRecording is updated via useEffect
      
      logger.log(`[${processingMode}] Transcription started`);
      return true;
    } catch (err) {
      logger.error(`[${processingMode}] Error starting transcription:`, err);
      setError(err instanceof Error ? err.message : 'Error al iniciar la grabación');
      setStatus('error');
      return false;
    }
  }, [processingMode, isWorkerReady, isPreloaded, startAudioCapture, setupAudioMonitoring, logger]);
  
  // Stop transcription - BAZAR: Immediate partial results, then residues
  const stopTranscription = useCallback(async (): Promise<boolean> => {
    try {
      if (!isRecording) return false;
      
      // BAZAR Step 1: Show partial transcription IMMEDIATELY
      logger.log('[BAZAR] Stopping recording - showing partial results FIRST');
      
      // Stop audio capture
      stopAudioCapture();
      
      // Cleanup audio monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // BAZAR: Compile partial transcription NOW
      const partialChunks = Object.entries(transcriptPartsRef.current)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, text]) => text);
      
      const partialText = partialChunks.join(' ').trim();
      
      if (partialText) {
        // BAZAR: Show partial result IMMEDIATELY
        const medicalTerms = extractMedicalTermsFromText(partialText).map(t => t.term);
        
        logger.log(`[BAZAR] Showing partial transcription: "${partialText}"`);
        
        setTranscription({
          text: partialText,
          confidence: 0.85, // Lower confidence for partial
          medicalTerms,
          processingTime: Date.now() - startTimeRef.current,
          timestamp: Date.now(),
          chunks: Object.entries(transcriptPartsRef.current).map(([id, text]) => ({
            id,
            text,
            timestamp: Date.now()
          }))
        });
      }
      
      // BAZAR Step 2: Enter residue collection phase
      setStatus('collecting-residues');
      logger.log('[BAZAR] Entering residue collection phase...');
      
      try {
        // Wait for any pending chunks to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate combined audio from all chunks
        const combinedAudioData = getCombinedAudio();
        if (combinedAudioData) {
          logger.log(`[BAZAR] Generating complete audio: ${combinedAudioData.length} samples`);
          
          const wavBlob = createWavBlob(combinedAudioData, sampleRate);
          setAudioBlob(wavBlob);
          
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);
          
          const durationSeconds = combinedAudioData.length / sampleRate;
          logger.log(`[BAZAR] Audio generated: ${durationSeconds.toFixed(2)} seconds`);
        }
        
        // Check for any new chunks that arrived during residue collection
        const finalChunks = Object.entries(transcriptPartsRef.current)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, text]) => text);
        
        const finalText = finalChunks.join(' ').trim();
        const hasNewContent = finalText.length > partialText.length;
        
        if (hasNewContent) {
          // BAZAR: Update with complete transcription including residues
          const medicalTerms = extractMedicalTermsFromText(finalText).map(t => t.term);
          
          logger.log(`[BAZAR] Updating with final transcription (${finalText.length - partialText.length} new chars)`);
          
          setTranscription({
            text: finalText,
            confidence: 0.95,
            medicalTerms,
            processingTime: Date.now() - startTimeRef.current,
            timestamp: Date.now(),
            chunks: Object.entries(transcriptPartsRef.current).map(([id, text]) => ({
              id,
              text,
              timestamp: Date.now()
            }))
          });
        }
        
        setStatus('completed');
        logger.log('[BAZAR] Transcription completed successfully');
        
      } catch (residueError) {
        // BAZAR: If residue collection fails, keep partial result and show warning
        logger.error('[BAZAR] Error collecting residues:', residueError);
        setError('Advertencia: El último fragmento no pudo procesarse completamente.');
        setStatus('completed'); // Still mark as completed - user has partial data
      }
      
      return true;
    } catch (err) {
      logger.error(`[BAZAR] Critical error stopping transcription:`, err);
      setError('Error al detener la grabación');
      setStatus('error');
      return false;
    }
  }, [isRecording, processingMode, stopAudioCapture, logger, getCombinedAudio, sampleRate, startTimeRef]);
  
  // Reset transcription
  const resetTranscription = useCallback(() => {
    setTranscription(null);
    setStatus('idle');
    setError(null);
    setRecordingTime(0);
    setAudioLevel(0);
    
    // Clean up audio URL to prevent memory leak
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioUrl(null);
    setAudioBlob(null);
    transcriptPartsRef.current = {};
    chunkCountRef.current = 0;
    
    // Reset worker for both modes
    resetWorker();
    
    logger.log(`[${processingMode}] Transcription reset`);
  }, [processingMode, resetWorker, logger, audioUrl]);
  
  // Auto-preload on mount if enabled
  useEffect(() => {
    if (autoPreload && !isPreloaded && engineStatus === 'loading') {
      logger.log('[useSimpleWhisper] Auto-preloading model...');
      preloadModel();
    }
  }, [autoPreload, isPreloaded, engineStatus, preloadModel, logger]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      
      // Clean up audio URL on unmount
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  return {
    // Core transcription
    transcription,
    status,
    isRecording,
    error,
    
    // Engine status
    engineStatus,
    loadProgress: isPreloaded ? 100 : loadProgress,
    
    // Audio monitoring
    audioLevel,
    recordingTime,
    audioUrl,
    audioBlob,
    
    // Controls
    startTranscription,
    stopTranscription,
    resetTranscription,
    preloadModel,
    
    // Enhanced preload info
    preloadStatus,
    preloadProgress,
    isPreloaded,
    
    // Debug
    setLogger: logger.setEnabled?.bind(logger)
  };
}