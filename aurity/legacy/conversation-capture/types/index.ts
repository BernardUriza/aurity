// =============================================================================
// ConversationCapture - Type Definitions
// =============================================================================
// Extracted from symfarmia/dev for Aurity Framework
// Version: 0.1.0
// =============================================================================

/**
 * Recording state
 */
export enum RecordingState {
  IDLE = 'idle',
  RECORDING = 'recording',
  PAUSED = 'paused',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

/**
 * Transcription segment
 */
export interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: number;
  speaker?: string;
  confidence?: number;
  isFinal: boolean;
}

/**
 * Audio metadata
 */
export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  size: number;
}

/**
 * Conversation capture session
 */
export interface ConversationSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  transcription: TranscriptionSegment[];
  audioBlob?: Blob;
  audioMetadata?: AudioMetadata;
  status: RecordingState;
}

/**
 * UI State
 */
export interface UIState {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  showTranscription: boolean;
  isDarkMode: boolean;
  volume: number;
}

/**
 * Transcription state
 */
export interface TranscriptionState {
  segments: TranscriptionSegment[];
  isLive: boolean;
  error?: string;
}

/**
 * Recording options
 */
export interface RecordingOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  sampleRate?: number;
  channels?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

/**
 * Whisper API options
 */
export interface WhisperOptions {
  model?: 'whisper-1';
  language?: string;
  prompt?: string;
  temperature?: number;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

/**
 * Component props
 */
export interface ConversationCaptureProps {
  onSave?: (session: ConversationSession) => void;
  onCancel?: () => void;
  autoTranscribe?: boolean;
  showLiveTranscription?: boolean;
  whisperOptions?: WhisperOptions;
  recordingOptions?: RecordingOptions;
  darkMode?: boolean;
}

/**
 * Voice activity detection
 */
export interface VoiceActivityLevel {
  level: number; // 0-100
  isSpeaking: boolean;
}

/**
 * Export format
 */
export enum ExportFormat {
  JSON = 'json',
  TEXT = 'text',
  SRT = 'srt',
  VTT = 'vtt',
}

/**
 * Error types
 */
export enum ErrorType {
  MICROPHONE_ACCESS = 'microphone_access',
  RECORDING_FAILED = 'recording_failed',
  TRANSCRIPTION_FAILED = 'transcription_failed',
  SAVE_FAILED = 'save_failed',
  UNKNOWN = 'unknown',
}

/**
 * Error details
 */
export interface CaptureError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}
