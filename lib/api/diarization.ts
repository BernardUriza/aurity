/**
 * Diarization API Client
 * Card: FI-RELIABILITY-IMPL-004
 *
 * Client for interacting with low-priority diarization backend.
 * Uses HDF5 storage with incremental chunk results.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:7001';

/**
 * Chunk information from low-priority worker (incremental results)
 */
export interface ChunkInfo {
  chunk_idx: number;
  start_time: number;
  end_time: number;
  text: string;
  speaker: 'PACIENTE' | 'MEDICO' | 'DESCONOCIDO';
  temperature: number;
  rtf: number;
  timestamp: string;
}

/**
 * Legacy segment format (for backward compatibility)
 */
export interface DiarizationSegment {
  start_time: number;
  end_time: number;
  speaker: 'PACIENTE' | 'MEDICO' | 'DESCONOCIDO';
  text: string;
}

/**
 * Legacy result format (for backward compatibility)
 */
export interface DiarizationResult {
  session_id: string;
  audio_file_hash: string;
  duration_sec: number;
  language: string;
  model_asr: string;
  model_llm: string;
  segments: DiarizationSegment[];
  processing_time_sec: number;
  created_at: string;
}

/**
 * Job status response (low-priority worker format)
 */
export interface DiarizationJob {
  job_id: string;
  session_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress_pct: number;
  total_chunks: number;
  processed_chunks: number;
  chunks: ChunkInfo[];
  created_at: string;
  updated_at: string;
  error?: string | null;
}

export interface UploadResponse {
  job_id: string;
  session_id: string;
  status: string;
  message: string;
}

/**
 * Upload audio file for diarization (low-priority worker)
 * @param language - Language code or null for auto-detect (recommended)
 * @param config - Optional diarization configuration (model, LLM, chunk size, etc.)
 */
export async function uploadAudioForDiarization(
  file: File,
  sessionId: string,
  language: string | null = null,
  persist: boolean = false,
  config?: {
    whisperModel?: string;
    enableLlmClassification?: boolean;
    chunkSizeSec?: number;
    beamSize?: number;
    vadFilter?: boolean;
  }
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('audio', file);

  const url = new URL(`${API_BASE}/api/diarization/upload`);
  if (language) {
    url.searchParams.append('language', language);
  }
  url.searchParams.append('persist', persist.toString());

  // Add configuration parameters
  if (config?.whisperModel) {
    url.searchParams.append('whisper_model', config.whisperModel);
  }
  if (config?.enableLlmClassification !== undefined) {
    url.searchParams.append('enable_llm_classification', config.enableLlmClassification.toString());
  }
  if (config?.chunkSizeSec !== undefined) {
    url.searchParams.append('chunk_size_sec', config.chunkSizeSec.toString());
  }
  if (config?.beamSize !== undefined) {
    url.searchParams.append('beam_size', config.beamSize.toString());
  }
  if (config?.vadFilter !== undefined) {
    url.searchParams.append('vad_filter', config.vadFilter.toString());
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'X-Session-ID': sessionId,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `Upload failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get job status
 */
export async function getDiarizationJobStatus(jobId: string): Promise<DiarizationJob> {
  const response = await fetch(`${API_BASE}/api/diarization/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error(`Failed to get job status: ${response.status}`);
  }

  return response.json();
}

/**
 * List all diarization jobs, optionally filtered by session
 */
export async function listDiarizationJobs(
  sessionId?: string,
  limit: number = 20
): Promise<DiarizationJob[]> {
  const url = new URL(`${API_BASE}/api/diarization/jobs`);
  if (sessionId) {
    url.searchParams.append('session_id', sessionId);
  }
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to list jobs: ${response.status}`);
  }

  const responseData = await response.json();
  // API returns wrapped response with 'data' field containing the jobs array
  return responseData.data || [];
}

/**
 * Export diarization result
 */
export async function exportDiarizationResult(
  jobId: string,
  format: 'json' | 'markdown' = 'json'
): Promise<Blob> {
  const url = new URL(`${API_BASE}/api/diarization/export/${jobId}`);
  url.searchParams.append('format', format);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }

  return response.blob();
}


/**
 * Poll job status until completed or failed (low-priority worker optimized)
 * @param intervalMs - Polling interval in ms (default 1500ms for low-priority worker)
 */
export async function pollJobStatus(
  jobId: string,
  onProgress?: (job: DiarizationJob) => void,
  intervalMs: number = 1500,
  maxAttempts: number = 240 // 6 minutes max at 1.5s intervals
): Promise<DiarizationJob> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const job = await getDiarizationJobStatus(jobId);

    if (onProgress) {
      onProgress(job);
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error('Job polling timeout - exceeded maximum attempts');
}

/**
 * Check diarization service health
 */
export async function checkDiarizationHealth(): Promise<{
  status: string;
  whisper_available: boolean;
  ollama_available: boolean;
  message: string;
}> {
  const response = await fetch(`${API_BASE}/api/diarization/health`);

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Job log entry from audit system
 */
export interface JobLogEntry {
  log_id: string;
  timestamp: string;
  action: string;
  user_id: string;
  resource: string;
  result: 'success' | 'failed' | 'denied';
  details?: Record<string, any>;
}

/**
 * Get audit logs for a diarization job
 */
export async function getDiarizationJobLogs(jobId: string): Promise<JobLogEntry[]> {
  const response = await fetch(`${API_BASE}/internal/diarization/jobs/${jobId}/logs`);

  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.status}`);
  }

  const result = await response.json();
  return result.data || [];
}
