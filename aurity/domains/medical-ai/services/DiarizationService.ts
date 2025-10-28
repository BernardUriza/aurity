/**
 * DIARIZATION SERVICE - BAZAR MODE
 * 
 * REGLAS:
 * - TODO código abierto, auditable, modificable
 * - TODO threshold configurable y documentado
 * - TODO embedding exportable y reemplazable
 * - TODO decisión registrada públicamente
 * - NO cajas negras, NO héroes individuales
 * 
 * XENOVA PYANNOTE INTEGRATION
 * Modelo: onnx-community/pyannote-segmentation-3.0
 * Whisper: onnx-community/whisper-base_timestamped
 */

import { pipeline } from '@xenova/transformers';

// PUBLIC CONFIGURATION - EDITABLE BY ANYONE
export const DIARIZATION_CONFIG = {
  // Modelo principal - CAMBIAR AQUÍ PARA USAR OTRO MODELO
  segmentationModel: 'onnx-community/pyannote-segmentation-3.0',
  whisperModel: 'onnx-community/whisper-base_timestamped',
  
  // Umbrales - EXPUESTOS Y DOCUMENTADOS
  thresholds: {
    speakerChange: 0.7,    // Umbral para cambio de hablante
    minimumSegment: 1.0,   // Duración mínima de segmento (segundos)
    overlapTolerance: 0.2  // Tolerancia de solapamiento entre hablantes
  },
  
  // Colores y avatares - ESQUEMAS PÚBLICOS
  speakers: {
    DOCTOR: {
      color: '#3B82F6',      // Azul médico
      avatar: '👨‍⚕️',
      label: 'Doctor',
      defaultName: 'Dr. Smith'
    },
    PATIENT: {
      color: '#10B981',      // Verde paciente
      avatar: '👤',
      label: 'Paciente',
      defaultName: 'Paciente'
    },
    UNKNOWN: {
      color: '#6B7280',      // Gris desconocido
      avatar: '❓',
      label: 'Desconocido',
      defaultName: 'Hablante'
    }
  },
  
  // Cache - LÓGICA EXPUESTA Y CONFIGURABLE
  cache: {
    enabled: true,
    maxSize: 100,          // Máximo embeddings en cache
    ttl: 24 * 60 * 60 * 1000  // TTL en millisegundos (24h)
  }
};

// TIPOS PÚBLICOS - EXPORTABLES Y REUTILIZABLES
export interface DiarizationSegment {
  speaker: 'DOCTOR' | 'PATIENT' | 'UNKNOWN';
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  chunks: Array<{
    text: string;
    timestamp: [number, number];
    confidence?: number;
  }>;
}

export interface DiarizationResult {
  segments: DiarizationSegment[];
  speakers: string[];
  processingTime: number;
  model: string;
  config: typeof DIARIZATION_CONFIG;
}

// EMBEDDINGS CACHE - AUDITABLE Y EXPORTABLE
class EmbeddingsCache {
  private cache: Map<string, any> = new Map();
  private timestamps: Map<string, number> = new Map();
  
  // MÉTODO PÚBLICO - CUALQUIER DEV PUEDE INSPECCIONAR
  public get(key: string): any | null {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return null;
    
    // Verificar TTL
    if (Date.now() - timestamp > DIARIZATION_CONFIG.cache.ttl) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    
    return this.cache.get(key) || null;
  }
  
  // MÉTODO PÚBLICO - TOTALMENTE TRANSPARENTE
  public set(key: string, value: any): void {
    // Limpiar cache si excede el tamaño máximo
    if (this.cache.size >= DIARIZATION_CONFIG.cache.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.timestamps.delete(oldestKey);
    }
    
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }
  
  // MÉTODO PÚBLICO - EXPORTAR DATOS PARA AUDITORÍA
  public export(): { embeddings: any[], metadata: any } {
    return {
      embeddings: Array.from(this.cache.entries()),
      metadata: {
        size: this.cache.size,
        maxSize: DIARIZATION_CONFIG.cache.maxSize,
        ttl: DIARIZATION_CONFIG.cache.ttl,
        timestamps: Array.from(this.timestamps.entries())
      }
    };
  }
  
  // MÉTODO PÚBLICO - LIMPIAR CACHE MANUALMENTE
  public clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }
}

// INSTANCIA GLOBAL - ACCESIBLE DESDE CUALQUIER LUGAR
const embeddingsCache = new EmbeddingsCache();

// SERVICIO PRINCIPAL - MODULAR Y AUDITABLE
export class DiarizationService {
  private segmentationPipeline: any = null;
  private whisperPipeline: any = null;
  private initialized = false;
  
  // MÉTODO PÚBLICO - INICIALIZACIÓN TRANSPARENTE
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[DiarizationService] Initializing with config:', DIARIZATION_CONFIG);
    
    try {
      // Cargar pipeline de segmentación
      this.segmentationPipeline = await pipeline(
        'feature-extraction',
        DIARIZATION_CONFIG.segmentationModel
      );
      
      // Cargar pipeline de Whisper con timestamps
      this.whisperPipeline = await pipeline(
        'automatic-speech-recognition',
        DIARIZATION_CONFIG.whisperModel
      );
      
      this.initialized = true;
      console.log('[DiarizationService] Initialized successfully');
    } catch (error) {
      console.error('[DiarizationService] Initialization failed:', error);
      throw error;
    }
  }
  
  // MÉTODO PÚBLICO - DIARIZACIÓN PRINCIPAL
  public async diarizeAudio(audioData: Float32Array): Promise<DiarizationResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const startTime = Date.now();
    
    try {
      // 1. TRANSCRIPCIÓN CON TIMESTAMPS
      const transcriptionResult = await this.whisperPipeline(audioData, {
        return_timestamps: 'word',
        language: 'es',
        task: 'transcribe'
      });
      
      // 2. SEGMENTACIÓN DE HABLANTES
      const segments = await this.segmentSpeakers(audioData, transcriptionResult.chunks);
      
      // 3. POSTPROCESAMIENTO
      const diarizedSegments = this.postProcessSegments(segments, transcriptionResult.chunks);
      
      const result: DiarizationResult = {
        segments: diarizedSegments,
        speakers: this.extractSpeakers(diarizedSegments),
        processingTime: Date.now() - startTime,
        model: DIARIZATION_CONFIG.segmentationModel,
        config: DIARIZATION_CONFIG
      };
      
      console.log('[DiarizationService] Diarization completed:', result);
      return result;
      
    } catch (error) {
      console.error('[DiarizationService] Diarization failed:', error);
      throw error;
    }
  }
  
  // MÉTODO PÚBLICO - SEGMENTACIÓN DE HABLANTES
  private async segmentSpeakers(audioData: Float32Array, chunks: any[]): Promise<any[]> {
    const cacheKey = this.generateCacheKey(audioData);
    
    // Verificar cache
    let embeddings = embeddingsCache.get(cacheKey);
    if (!embeddings) {
      // Generar embeddings
      embeddings = await this.segmentationPipeline(audioData);
      embeddingsCache.set(cacheKey, embeddings);
    }
    
    // Algoritmo de segmentación - COMPLETAMENTE AUDITABLE
    const segments = [];
    let currentSpeaker = 'UNKNOWN';
    let segmentStart = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const timestamp = chunk.timestamp;
      
      // Calcular probabilidad de cambio de hablante
      const changeProb = this.calculateSpeakerChangeProb(embeddings, timestamp);
      
      // Aplicar umbral PÚBLICO y CONFIGURABLE
      if (changeProb > DIARIZATION_CONFIG.thresholds.speakerChange) {
        // Guardar segmento anterior
        if (i > 0) {
          segments.push({
            speaker: currentSpeaker,
            start: segmentStart,
            end: timestamp[0],
            changeProb: changeProb
          });
        }
        
        // Nuevo segmento
        currentSpeaker = this.identifySpeaker(embeddings, timestamp);
        segmentStart = timestamp[0];
      }
    }
    
    // Último segmento
    if (chunks.length > 0) {
      segments.push({
        speaker: currentSpeaker,
        start: segmentStart,
        end: chunks[chunks.length - 1].timestamp[1],
        changeProb: 0
      });
    }
    
    return segments;
  }
  
  // MÉTODO PÚBLICO - CÁLCULO DE PROBABILIDAD (AUDITABLE)
  private calculateSpeakerChangeProb(embeddings: any, timestamp: [number, number]): number {
    // ALGORITMO SIMPLE Y AUDITABLE
    // TODO: Implementar algoritmo más sofisticado basado en embeddings
    
    const windowSize = 1.0; // 1 segundo
    const timePoint = timestamp[0];
    
    // Simular probabilidad basada en tiempo (placeholder)
    const timeDiff = Math.abs(timePoint - Math.floor(timePoint));
    return Math.min(timeDiff * 2, 1.0);
  }
  
  // MÉTODO PÚBLICO - IDENTIFICACIÓN DE HABLANTE
  private identifySpeaker(embeddings: any, timestamp: [number, number]): 'DOCTOR' | 'PATIENT' | 'UNKNOWN' {
    // LÓGICA SIMPLE Y AUDITABLE
    // TODO: Implementar matching con base de datos de voces
    
    const timePoint = timestamp[0];
    
    // Heurística simple: alternar entre doctor y paciente
    if (timePoint < 30) return 'DOCTOR';
    if (timePoint < 60) return 'PATIENT';
    return Math.random() > 0.5 ? 'DOCTOR' : 'PATIENT';
  }
  
  // MÉTODO PÚBLICO - POSTPROCESAMIENTO
  private postProcessSegments(segments: any[], chunks: any[]): DiarizationSegment[] {
    const result: DiarizationSegment[] = [];
    
    for (const segment of segments) {
      // Filtrar chunks que pertenecen a este segmento
      const segmentChunks = chunks.filter(chunk => 
        chunk.timestamp[0] >= segment.start && chunk.timestamp[1] <= segment.end
      );
      
      if (segmentChunks.length === 0) continue;
      
      // Construir texto del segmento
      const text = segmentChunks.map(chunk => chunk.text).join('');
      
      // Calcular confidence promedio
      const confidence = segmentChunks.reduce((sum, chunk) => sum + (chunk.confidence || 0.8), 0) / segmentChunks.length;
      
      result.push({
        speaker: segment.speaker,
        startTime: segment.start,
        endTime: segment.end,
        text: text.trim(),
        confidence,
        chunks: segmentChunks.map(chunk => ({
          text: chunk.text,
          timestamp: chunk.timestamp,
          confidence: chunk.confidence
        }))
      });
    }
    
    return result;
  }
  
  // MÉTODO PÚBLICO - EXTRAER HABLANTES
  private extractSpeakers(segments: DiarizationSegment[]): string[] {
    const speakers = new Set<string>();
    segments.forEach(segment => speakers.add(segment.speaker));
    return Array.from(speakers);
  }
  
  // MÉTODO PÚBLICO - GENERAR CLAVE DE CACHE
  private generateCacheKey(audioData: Float32Array): string {
    // Hash simple basado en longitud y algunos samples
    const length = audioData.length;
    const sample1 = audioData[Math.floor(length * 0.25)] || 0;
    const sample2 = audioData[Math.floor(length * 0.75)] || 0;
    return `audio_${length}_${sample1.toFixed(4)}_${sample2.toFixed(4)}`;
  }
  
  // MÉTODO PÚBLICO - EXPORTAR CACHE PARA AUDITORÍA
  public exportCache(): any {
    return embeddingsCache.export();
  }
  
  // MÉTODO PÚBLICO - LIMPIAR CACHE
  public clearCache(): void {
    embeddingsCache.clear();
  }
}

// INSTANCIA SINGLETON - PERO ACCESIBLE GLOBALMENTE
export const diarizationService = new DiarizationService();

// UTILIDADES PÚBLICAS - REUTILIZABLES
export class DiarizationUtils {
  // MÉTODO PÚBLICO - FUSIONAR TRANSCRIPCIONES
  public static mergeTranscriptions(whisperText: string, webSpeechText: string): string {
    // ALGORITMO SIMPLE Y AUDITABLE
    const whisperWords = whisperText.split(' ');
    const webSpeechWords = webSpeechText.split(' ');
    
    // Usar la transcripción más larga como base
    const baseWords = whisperWords.length > webSpeechWords.length ? whisperWords : webSpeechWords;
    const altWords = whisperWords.length > webSpeechWords.length ? webSpeechWords : whisperWords;
    
    const merged: string[] = [];
    
    for (let i = 0; i < baseWords.length; i++) {
      const baseWord = baseWords[i];
      const altWord = altWords[i];
      
      if (altWord && this.wordSimilarity(baseWord, altWord) > 0.7) {
        // Usar la palabra más larga si son similares
        merged.push(baseWord.length > altWord.length ? baseWord : altWord);
      } else {
        merged.push(baseWord);
      }
    }
    
    return merged.join(' ');
  }
  
  // MÉTODO PÚBLICO - SIMILITUD DE PALABRAS
  private static wordSimilarity(word1: string, word2: string): number {
    const a = word1.toLowerCase();
    const b = word2.toLowerCase();
    
    if (a === b) return 1.0;
    
    // Distancia de Levenshtein normalizada
    const distance = this.levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    
    return 1 - (distance / maxLength);
  }
  
  // MÉTODO PÚBLICO - DISTANCIA DE LEVENSHTEIN
  private static levenshteinDistance(a: string, b: string): number {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
}

// DOCUMENTACIÓN PÚBLICA - SIEMPRE ACTUALIZADA
export const DIARIZATION_DOCS = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  description: 'Servicio de diarización modular y auditable usando Xenova/pyannote',
  
  configuration: {
    file: 'src/domains/medical-ai/services/DiarizationService.ts',
    configObject: 'DIARIZATION_CONFIG',
    editable: 'Sí - cualquier desarrollador puede modificar',
    thresholds: 'Todos los umbrales son públicos y configurables'
  },
  
  api: {
    initialize: 'Inicializar modelos de diarización',
    diarizeAudio: 'Procesar audio y generar segmentos por hablante',
    exportCache: 'Exportar cache de embeddings para auditoría',
    clearCache: 'Limpiar cache manualmente'
  },
  
  decisions: [
    'Modelo pyannote-segmentation-3.0 elegido por mejor balance precisión/velocidad',
    'Cache de embeddings para evitar reprocesamiento',
    'Umbrales configurables para diferentes escenarios médicos',
    'Algoritmo de fusión simple pero auditable'
  ],
  
  risks: [
    'Privacidad: embeddings contienen información de voz',
    'Precisión: algoritmos simples pueden fallar en casos complejos',
    'Rendimiento: modelos grandes pueden ser lentos en dispositivos limitados'
  ],
  
  contribute: {
    issues: 'Reportar problemas en GitHub Issues',
    pullRequests: 'PRs bienvenidos para mejoras',
    documentation: 'Documentación debe actualizarse con cada cambio'
  }
};