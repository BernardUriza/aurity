/**
 * Medical Workflow API Service
 *
 * Centralized API for medical recording workflow:
 * - Audio streaming & chunks
 * - Diarization (speaker separation)
 * - SOAP note generation
 * - Session management
 *
 * Replaces hardcoded URLs scattered across ConversationCapture
 *
 * Author: Senior Frontend Dev
 * Created: 2025-11-15
 */

import { api } from './client';

// ============================================================================
// Types
// ============================================================================

export interface StreamChunkResponse {
  success: boolean;
  chunk_number: number;
  session_id: string;
  audio_hash?: string;
  transcript?: string;
  job_id?: string;
}

export interface CheckpointResponse {
  session_id: string;
  checkpoint_at: string;
  chunks_concatenated: number;
  full_audio_size: number;
  message: string;
}

export interface DiarizationJobResponse {
  job_id: string;
  session_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
}

export interface DiarizationStatusResponse {
  job_id: string;
  session_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  segment_count: number;
  transcription_sources: {
    webspeech_final?: unknown[];
    transcription_per_chunks?: string[];
    full_transcription?: string;
  } | null;
  error: string | null;
}

export interface SOAPGenerationResponse {
  job_id: string;
  session_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  soap_note?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

export interface DiarizationSegment {
  speaker: string;
  text: string;
  start_time: number;
  end_time: number;
  confidence?: number;
  improved_text?: string;
}

export interface DiarizationSegmentsResponse {
  session_id: string;
  segments: DiarizationSegment[];
  segment_count: number;
  provider: string;
  completed_at: string;
}

export interface EndSessionResponse {
  success: boolean;
  session_id: string;
  audio_path: string;
  chunks_count: number;
  duration: number;
}

// ============================================================================
// Medical Workflow API
// ============================================================================

export const medicalWorkflowApi = {
  /**
   * Upload audio chunk for streaming transcription
   */
  uploadChunk: async (
    sessionId: string,
    chunkNumber: number,
    audioBlob: Blob,
    options?: {
      timestampStart?: number;
      timestampEnd?: number;
      filename?: string;
    }
  ): Promise<StreamChunkResponse> => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('chunk_number', chunkNumber.toString());
    formData.append('mime', audioBlob.type || '');

    const filename = options?.filename || `chunk_${chunkNumber.toString().padStart(3, '0')}.webm`;
    formData.append('audio', audioBlob, filename);

    if (options?.timestampStart !== undefined) {
      formData.append('timestamp_start', options.timestampStart.toString());
    }
    if (options?.timestampEnd !== undefined) {
      formData.append('timestamp_end', options.timestampEnd.toString());
    }

    return api.upload<StreamChunkResponse>(
      '/api/workflows/aurity/stream',
      formData
    );
  },

  /**
   * Create checkpoint (concatenate audio on pause)
   */
  createCheckpoint: async (
    sessionId: string,
    lastChunkIdx?: number
  ): Promise<CheckpointResponse> => {
    return api.post<CheckpointResponse>(
      `/api/workflows/aurity/sessions/${sessionId}/checkpoint`,
      lastChunkIdx !== undefined ? { last_chunk_idx: lastChunkIdx } : undefined
    );
  },

  /**
   * End session and save full audio
   */
  endSession: async (
    sessionId: string,
    fullAudioBlob: Blob
  ): Promise<EndSessionResponse> => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('full_audio', fullAudioBlob, 'session.webm');

    return api.upload<EndSessionResponse>(
      '/api/workflows/aurity/end-session',
      formData
    );
  },

  /**
   * Start diarization (speaker separation)
   */
  startDiarization: async (sessionId: string): Promise<DiarizationJobResponse> => {
    return api.post<DiarizationJobResponse>(
      `/api/workflows/aurity/sessions/${sessionId}/diarization`
    );
  },

  /**
   * Get diarization job status (for polling)
   */
  getDiarizationStatus: async (jobId: string): Promise<DiarizationStatusResponse> => {
    return api.get<DiarizationStatusResponse>(
      `/api/workflows/aurity/diarization/jobs/${jobId}`
    );
  },

  /**
   * Start SOAP note generation (Phase 4 - NEW)
   */
  startSOAPGeneration: async (sessionId: string): Promise<SOAPGenerationResponse> => {
    return api.post<SOAPGenerationResponse>(
      `/api/workflows/aurity/sessions/${sessionId}/soap`
    );
  },

  /**
   * Get SOAP generation status (for polling)
   */
  getSOAPStatus: async (jobId: string): Promise<SOAPGenerationResponse> => {
    return api.get<SOAPGenerationResponse>(
      `/api/workflows/aurity/soap/jobs/${jobId}`
    );
  },

  /**
   * Get diarization segments (after completion)
   */
  getDiarizationSegments: async (sessionId: string): Promise<DiarizationSegmentsResponse> => {
    return api.get<DiarizationSegmentsResponse>(
      `/api/workflows/aurity/sessions/${sessionId}/diarization/segments`
    );
  },
};
