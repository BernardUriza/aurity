/**
 * Unified Audio Capture with Denoising - BRUTAL BAZAR MODE
 * 
 * DENOISING ES LA ÚNICA ENTRADA:
 * - Todo audio pasa por denoising PRIMERO
 * - Sin acceso directo al micrófono
 * - Whisper solo recibe audio denoisado
 * - Logging completo del proceso
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { useAudioProcessor } from './useAudioProcessor';
import { AudioChunkManager } from '../audio/AudioChunkManager';
import { audioPipelineIntegration } from '../services/AudioPipelineIntegration';

interface UseAudioDenoisingOptions {
  onChunkReady?: (audioData: Float32Array, metadata: ProcessingMetadata) => void;
  chunkSize?: number;
  sampleRate?: number;
  mode?: 'direct' | 'streaming';
  denoisingEnabled?: boolean;
  environment?: 'consultorio' | 'urgencias' | 'uci' | 'cirugia';
}

interface ProcessingMetadata {
  chunkId: number;
  originalLength: number;
  processedLength: number;
  denoisingUsed: boolean;
  processingTime: number;
  qualityMetrics?: any;
  activeFilters?: string[];
  fallbackMode?: boolean;
}

/**
 * AUDIO DENOISING - BRUTAL BAZAR MODE
 * - Único productor de audio limpio
 * - Consumible por cualquier hook/módulo
 * - Proceso completamente auditable
 * - Sin centralización forzada
 */
export function useAudioDenoising({
  onChunkReady,
  chunkSize = 16000, // 1 segundo a 16kHz
  sampleRate = 16000,
  mode = 'direct',
  denoisingEnabled = true,
  environment = 'consultorio'
}: UseAudioDenoisingOptions = {}) {
  
  // Estados principales
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    totalChunks: 0,
    denoisedChunks: 0,
    fallbackChunks: 0,
    averageProcessingTime: 0,
    averageQuality: 0
  });
  const [error, setError] = useState<string | null>(null);
  
  // Referencias
  const chunkManagerRef = useRef<AudioChunkManager | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const allChunksRef = useRef<Float32Array[]>([]);
  const processingQueueRef = useRef<Array<{id: number, data: Float32Array}>>([]);
  
  // BRUTAL BAZAR: Chunks expuestos para cualquier consumidor
  const [audioChunks, setAudioChunks] = useState<Array<{
    id: number;
    data: Float32Array;
    metadata: ProcessingMetadata;
  }>>([]);
  
  // Configuración
  const MAX_RECORDING_SECONDS = 40 * 60; // 40 minutos máximo
  const targetChunkSize = mode === 'streaming' ? 160000 : chunkSize; // 10s vs custom

  // Configurar pipeline de denoising
  useEffect(() => {
    audioPipelineIntegration.configure({
      enableDenoising: denoisingEnabled,
      enableFallback: true,
      enableQualityMetrics: true,
      enablePersistence: false,
      logLevel: 'info'
    });
  }, [denoisingEnabled]);

  // Processor de audio con denoising integrado
  const { start: startProcessor, stop: stopProcessor } = useAudioProcessor({
    onAudioData: (audioData) => {
      if (!chunkManagerRef.current) return;
      chunkManagerRef.current.addData(audioData);
    },
    bufferSize: 4096,
    sampleRate
  });

  // Función para procesar chunk con denoising
  const processChunkWithDenoising = useCallback(async (chunk: Float32Array, chunkId: number) => {
    const startTime = Date.now();
    setIsProcessing(true);
    
    try {
      // PASO CRÍTICO: TODO audio pasa por denoising PRIMERO
      console.log(`[UnifiedCapture] Processing chunk #${chunkId} through denoising pipeline`);
      
      const pipelineResult = await audioPipelineIntegration.processAudioWithDenoising(
        chunk,
        {
          environment: environment,
          enableQualityMetrics: true,
          enablePersistence: false,
          fallbackOnError: true
        }
      );
      
      const processingTime = Date.now() - startTime;
      
      // Crear metadata del procesamiento
      const metadata: ProcessingMetadata = {
        chunkId: chunkId,
        originalLength: chunk.length,
        processedLength: pipelineResult.processedAudio.length,
        denoisingUsed: pipelineResult.usedDenoising,
        processingTime: processingTime,
        qualityMetrics: pipelineResult.qualityMetrics,
        activeFilters: pipelineResult.denoisingResult ? Object.keys(pipelineResult.denoisingResult.activeFilters) : [],
        fallbackMode: pipelineResult.fallbackMode || false
      };
      
      // Actualizar estadísticas
      setProcessingStats(prev => {
        const newStats = {
          totalChunks: prev.totalChunks + 1,
          denoisedChunks: pipelineResult.usedDenoising ? prev.denoisedChunks + 1 : prev.denoisedChunks,
          fallbackChunks: pipelineResult.fallbackMode ? prev.fallbackChunks + 1 : prev.fallbackChunks,
          averageProcessingTime: ((prev.averageProcessingTime * prev.totalChunks) + processingTime) / (prev.totalChunks + 1),
          averageQuality: pipelineResult.qualityMetrics ? 
            ((prev.averageQuality * prev.totalChunks) + pipelineResult.qualityMetrics.overallQuality) / (prev.totalChunks + 1) :
            prev.averageQuality
        };
        
        return newStats;
      });
      
      console.log(`[AudioDenoising] Chunk #${chunkId} processed:`, {
        denoisingUsed: pipelineResult.usedDenoising,
        processingTime: processingTime,
        qualityImprovement: pipelineResult.qualityMetrics?.overallQuality || 0,
        activeFilters: metadata.activeFilters
      });
      
      // BRUTAL BAZAR: Exponer chunk para CUALQUIER consumidor
      setAudioChunks(prev => [...prev, {
        id: chunkId,
        data: pipelineResult.processedAudio,
        metadata: metadata
      }]);
      
      // Callback para consumidores específicos
      onChunkReady?.(pipelineResult.processedAudio, metadata);
      
    } catch (error) {
      console.error(`[AudioDenoising] Error processing chunk #${chunkId}:`, error);
      setError(`Error processing audio: ${error.message}`);
      
      // En caso de error crítico, usar fallback básico
      if (denoisingEnabled) {
        console.warn(`[AudioDenoising] Using fallback for chunk #${chunkId}`);
        const metadata: ProcessingMetadata = {
          chunkId: chunkId,
          originalLength: chunk.length,
          processedLength: chunk.length,
          denoisingUsed: false,
          processingTime: Date.now() - startTime,
          fallbackMode: true
        };
        
        onChunkReady?.(chunk, metadata);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [environment, denoisingEnabled, onChunkReady]);

  // Iniciar captura
  const start = useCallback(async (): Promise<MediaStream | null> => {
    if (isRecording) return streamRef.current;
    
    try {
      console.log(`[UnifiedCapture] Starting ${mode} mode capture with denoising`);
      setError(null);
      
      // Configurar chunk manager con denoising integrado
      chunkManagerRef.current = new AudioChunkManager({
        chunkSize: targetChunkSize,
        onChunk: async (chunk, id) => {
          chunkCountRef.current = id;
          
          // Almacenar chunk para audio final
          allChunksRef.current.push(chunk);
          
          // Verificar límite de tiempo
          const totalSamples = allChunksRef.current.reduce((sum, c) => sum + c.length, 0);
          const totalSeconds = totalSamples / sampleRate;
          
          if (totalSeconds >= MAX_RECORDING_SECONDS) {
            console.warn('[UnifiedCapture] Maximum recording time reached (40 minutes)');
            stop();
            return;
          }
          
          // PROCESAR CON DENOISING - NUNCA DIRECTO
          await processChunkWithDenoising(chunk, id);
        }
      });
      
      chunkCountRef.current = 0;
      startTimeRef.current = Date.now();
      allChunksRef.current = [];
      
      // Inicializar pipeline
      await audioPipelineIntegration.configure({
        enableDenoising: denoisingEnabled,
        environment: environment,
        enableFallback: true,
        enableQualityMetrics: true
      });
      
      const stream = await startProcessor();
      if (stream) {
        streamRef.current = stream;
        setIsRecording(true);
        console.log(`[UnifiedCapture] Recording started with denoising: ${denoisingEnabled ? 'ENABLED' : 'DISABLED'}`);
      }
      
      return stream;
      
    } catch (error) {
      console.error('[UnifiedCapture] Error starting audio capture:', error);
      setError(`Error starting recording: ${error.message}`);
      return null;
    }
  }, [isRecording, startProcessor, mode, denoisingEnabled, environment, processChunkWithDenoising]);

  // Detener captura
  const stop = useCallback(() => {
    if (!isRecording) return;
    
    console.log(`[UnifiedCapture] Stopping ${mode} mode capture`);
    stopProcessor();
    
    // Procesar audio restante
    chunkManagerRef.current?.flush();
    
    const duration = (Date.now() - startTimeRef.current) / 1000;
    console.log(`[UnifiedCapture] Recording stopped. Duration: ${duration}s, Chunks: ${chunkCountRef.current}`);
    console.log(`[UnifiedCapture] Processing stats:`, processingStats);
    
    // Limpiar referencias
    chunkManagerRef.current = null;
    streamRef.current = null;
    setIsRecording(false);
    
  }, [isRecording, stopProcessor, mode, processingStats]);

  // Obtener audio completo denoisado
  const getCompleteAudio = useCallback((): Float32Array | null => {
    if (allChunksRef.current.length === 0) return null;
    
    const totalLength = allChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    const completeAudio = new Float32Array(totalLength);
    
    let offset = 0;
    for (const chunk of allChunksRef.current) {
      completeAudio.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log(`[UnifiedCapture] Complete audio ready: ${completeAudio.length} samples (${completeAudio.length / sampleRate}s)`);
    return completeAudio;
  }, []);

  // Obtener estadísticas de procesamiento
  const getProcessingStats = useCallback(() => {
    return {
      ...processingStats,
      recordingTime: isRecording ? (Date.now() - startTimeRef.current) / 1000 : 0,
      totalChunks: chunkCountRef.current,
      denoisingEfficiency: processingStats.totalChunks > 0 ? 
        (processingStats.denoisedChunks / processingStats.totalChunks) * 100 : 0,
      fallbackRate: processingStats.totalChunks > 0 ? 
        (processingStats.fallbackChunks / processingStats.totalChunks) * 100 : 0
    };
  }, [processingStats, isRecording]);

  // Forzar configuración de denoising
  const configureDenoisingMode = useCallback((enabled: boolean, env: string) => {
    console.log(`[UnifiedCapture] Forcing denoising configuration: ${enabled ? 'ENABLED' : 'DISABLED'}, environment: ${env}`);
    
    audioPipelineIntegration.configure({
      enableDenoising: enabled,
      environment: env,
      enableFallback: true,
      enableQualityMetrics: true
    });
  }, []);

  return {
    // Estados principales
    isRecording,
    isProcessing,
    error,
    
    // BRUTAL BAZAR: Audio chunks para CUALQUIER consumidor
    audioChunks,
    
    // Funciones de control
    start,
    stop,
    getCompleteAudio,
    
    // Estadísticas y monitoreo
    processingStats: getProcessingStats(),
    configureDenoisingMode,
    
    // Información del stream
    stream: streamRef.current,
    chunkCount: chunkCountRef.current,
    
    // Información de denoising
    denoisingEnabled,
    environment,
    
    // Compatibilidad con interfaz anterior
    isCapturing: isRecording,
    startCapture: start,
    stopCapture: stop,
    audioProcessor: null, // Deprecated - todo pasa por denoising
    transcriptionService: null // Deprecated - usar procesamiento integrado
  };
}