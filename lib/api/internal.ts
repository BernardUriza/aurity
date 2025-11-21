/**
 * Internal API Client
 *
 * Client for backend internal endpoints (/internal/*).
 * Only accessible in development or from localhost.
 *
 * File: apps/aurity/lib/api/internal.ts
 * Created: 2025-11-08
 *
 * @warning These endpoints are NOT accessible in production from external clients.
 * Use workflows client for production.
 */

import { api } from './client';

/**
 * Diarization endpoints (internal only)
 */
export const diarizationClient = {
  /**
   * Upload audio for diarization
   * POST /internal/diarization/upload
   */
  upload: async (audio: File, sessionId: string) => {
    const formData = new FormData();
    formData.append('audio', audio);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001'}/internal/diarization/upload`,
      {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Diarization upload failed: ${error}`);
    }

    return response.json();
  },

  /**
   * Get job status
   * GET /internal/diarization/jobs/{jobId}
   */
  getJobStatus: (jobId: string) =>
    api.get(`/internal/diarization/jobs/${jobId}`),
};

/**
 * Transcription endpoints (internal only)
 */
export const transcribeClient = {
  /**
   * Transcribe audio
   * POST /internal/transcribe
   */
  transcribe: async (audio: File, sessionId: string) => {
    const formData = new FormData();
    formData.append('audio', audio);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001'}/internal/transcribe`,
      {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    return response.json();
  },
};

/**
 * Internal API client namespace
 *
 * @warning Only use in development or tests
 */
export const internalClient = {
  diarization: diarizationClient,
  transcribe: transcribeClient,
};
