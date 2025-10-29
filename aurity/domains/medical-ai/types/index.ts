/**
 * Medical AI Domain - Type Definitions
 *
 * Central barrel export for all medical AI types.
 */

// Audio processing types
export interface AudioQualityMetrics {
  snr?: number; // Signal-to-noise ratio
  clarity?: number; // 0-1 scale
  confidence?: number; // 0-1 scale
}

export interface DenoisingMetadata {
  applied: boolean;
  algorithm?: string;
  processingTime: number;
  qualityBefore?: AudioQualityMetrics;
  qualityAfter?: AudioQualityMetrics;
}

// Transcription types
export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: string;
}

export interface TranscriptionResult {
  text: string;
  segments?: TranscriptionSegment[];
  language?: string;
  confidence?: number;
  processingTime: number;
}

// Diarization types
export interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface DiarizationResult {
  speakers: string[];
  segments: SpeakerSegment[];
  speakerCount: number;
}

// Strategy types
export interface ProcessingStrategy {
  name: string;
  priority: number;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface StrategyResult {
  strategy: string;
  success: boolean;
  confidence?: number;
  processingTime: number;
  fallback?: boolean;
}

export interface MedicalStrategy {
  id: string;
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
}

// Confidence calculation types
export interface ConfidenceFactors {
  audioQuality?: number;
  modelConfidence?: number;
  contextMatch?: number;
  vocabularyMatch?: number;
}

export interface ConfidenceScore {
  overall: number; // 0-1 scale
  factors: ConfidenceFactors;
  interpretation: 'high' | 'medium' | 'low';
}
