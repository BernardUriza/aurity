'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import {
  uploadAudioForDiarization,
  pollJobStatus,
  exportDiarizationResult,
  checkDiarizationHealth,
  listDiarizationJobs,
  getDiarizationJobStatus,
  type DiarizationJob,
  type ChunkInfo,
} from '@/lib/api/diarization';

interface DiarizationConfig {
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large-v3';
  enableLlmClassification: boolean;
  chunkSizeSec: number;
  beamSize: number;
  vadFilter: boolean;
}

const DEFAULT_CONFIG: DiarizationConfig = {
  whisperModel: 'base',
  enableLlmClassification: false,
  chunkSizeSec: 60,
  beamSize: 5,
  vadFilter: true,
};

export default function DiarizationPage() {
  const [sessionId] = useState(() => uuidv4());
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<DiarizationJob | null>(null);
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [healthOk, setHealthOk] = useState(false);
  const [jobHistory, setJobHistory] = useState<DiarizationJob[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<DiarizationConfig>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diarizationConfig');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    }
    return DEFAULT_CONFIG;
  });

  // Save config to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('diarizationConfig', JSON.stringify(config));
    }
  }, [config]);

  const updateConfig = (updates: Partial<DiarizationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const estimatedSpeedup = (): string => {
    let speedup = 1.0;
    if (config.whisperModel === 'base') speedup *= 2.5;
    else if (config.whisperModel === 'tiny') speedup *= 4.5;
    if (!config.enableLlmClassification) speedup *= 3.5;
    if (config.chunkSizeSec >= 60) speedup *= 1.25;
    if (config.beamSize === 1) speedup *= 1.5;
    return `${Math.min(speedup, 15).toFixed(1)}x`;
  };

  // Load job history on mount or when filter changes
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        // If showAllSessions is true, pass undefined to load all jobs
        const jobs = await listDiarizationJobs(showAllSessions ? undefined : sessionId, 20);
        setJobHistory(jobs);
      } catch (err) {
        console.error('Failed to load job history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [sessionId, showAllSessions]);

  // Check health on mount
  useEffect(() => {
    checkDiarizationHealth()
      .then(health => {
        // Backend returns 'whisper_available' and 'ollama_available'
        // Whisper (ASR) is REQUIRED for diarization
        // Ollama (LLM) is OPTIONAL
        const whisperOk = (health as any).whisper_available === true;
        const ollamaAvailable = (health as any).ollama_available === true;

        // Enable upload if Whisper is available (Ollama is optional)
        setHealthOk(whisperOk);

        // Log status for debugging
        console.info('Diarization Health:', {
          whisper_available: whisperOk,
          ollama_available: ollamaAvailable,
          services_ok: whisperOk
        });
      })
      .catch(err => {
        console.error('Health check failed:', err);
        setHealthOk(false);
      });
  }, []);

  // Dropzone callback
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      // Max 100MB file size check
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (selected.size > maxSize) {
        setError('El archivo es demasiado grande. Tamaño máximo: 100MB');
        return;
      }

      setFile(selected);
      setError(null);
      setChunks([]);
      setJob(null);
    }
  }, []);

  // Configure react-dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.webm', '.wav', '.mp3', '.m4a', '.ogg', '.flac'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: uploading,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setChunks([]);

    try {
      // Upload with user configuration (auto-detect language)
      const uploadResp = await uploadAudioForDiarization(file, sessionId, null, false, {
        whisperModel: config.whisperModel,
        enableLlmClassification: config.enableLlmClassification,
        chunkSizeSec: config.chunkSizeSec,
        beamSize: config.beamSize,
        vadFilter: config.vadFilter,
      });
      const jobId = uploadResp.job_id;

      // Poll status (1.5s intervals)
      const completedJob = await pollJobStatus(
        jobId,
        (updatedJob) => {
          setJob(updatedJob);
          // Update chunks incrementally as they arrive
          if (updatedJob.chunks && updatedJob.chunks.length > 0) {
            setChunks(updatedJob.chunks);
          }
        },
        1500,
        240
      );

      if (completedJob.status === 'failed') {
        setError(completedJob.error || 'Diarization failed');
        return;
      }

      // Final chunks update
      if (completedJob.chunks) {
        setChunks(completedJob.chunks);
      }

      // Reload job history to show the new job
      const jobs = await listDiarizationJobs(sessionId, 20);
      setJobHistory(jobs);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleViewJob = async (jobId: string) => {
    try {
      setError(null);
      const jobDetails = await getDiarizationJobStatus(jobId);
      setJob(jobDetails);
      if (jobDetails.chunks) {
        setChunks(jobDetails.chunks);
      }
    } catch (err: any) {
      setError(`Failed to load job: ${err.message}`);
    }
  };

  const handleExport = async (format: 'json' | 'markdown') => {
    if (!job) return;

    try {
      const blob = await exportDiarizationResult(job.job_id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diarization_${job.job_id}.${format === 'json' ? 'json' : 'md'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Export failed: ${err.message}`);
    }
  };

  const getSpeakerColor = (speaker: string): string => {
    switch (speaker) {
      case 'PACIENTE':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'MEDICO':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Diarización de Audio</h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            Transcripción + clasificación de hablantes (PACIENTE | MÉDICO)
          </p>
          {healthOk ? (
            <p className="mt-1 text-sm text-green-700 dark:text-green-400 font-medium">
              ✓ Whisper disponible (ASR) • Clasificación Ollama {config.enableLlmClassification ? 'habilitada' : 'deshabilitada'}
            </p>
          ) : (
            <p className="mt-1 text-sm text-red-700 dark:text-red-400 font-medium">
              ⚠ Whisper no disponible. Verifica que el backend esté corriendo en puerto 7001.
            </p>
          )}
        </div>

        {/* Performance Configuration */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg shadow p-6 mb-6 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
              ⚙️ Configuración de Rendimiento
            </h2>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs px-3 py-1 bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 rounded hover:bg-purple-300 transition-colors"
            >
              {showAdvanced ? '▼ Ocultar' : '▶ Mostrar'} Avanzado
            </button>
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-100 dark:border-purple-700">
              <div className="text-xs text-gray-600 dark:text-gray-400">Modelo</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{config.whisperModel}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-100 dark:border-purple-700">
              <div className="text-xs text-gray-600 dark:text-gray-400">Chunk Size</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{config.chunkSizeSec}s</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-100 dark:border-purple-700">
              <div className="text-xs text-gray-600 dark:text-gray-400">LLM Classification</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{config.enableLlmClassification ? '✓' : '✗'}</div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-3 rounded border border-green-300 dark:border-green-700">
              <div className="text-xs text-green-700 dark:text-green-300 font-medium">Speedup Est.</div>
              <div className="font-bold text-green-900 dark:text-green-200">{estimatedSpeedup()}</div>
            </div>
          </div>

          {/* Advanced Controls */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-purple-200 dark:border-purple-700">
              {/* Whisper Model */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  🎤 Modelo Whisper
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {(['tiny', 'base', 'small', 'medium', 'large-v3'] as const).map((model) => (
                    <button
                      key={model}
                      onClick={() => updateConfig({ whisperModel: model })}
                      className={`px-3 py-2 text-xs font-medium rounded transition-all ${
                        config.whisperModel === model
                          ? 'bg-purple-600 text-white border-2 border-purple-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  tiny (4-5x rápido) → large-v3 (más preciso)
                </p>
              </div>

              {/* Chunk Size */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  📦 Tamaño de Chunks: {config.chunkSizeSec}s
                </label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="10"
                  value={config.chunkSizeSec}
                  onChange={(e) => updateConfig({ chunkSizeSec: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                  <span>10s (granular)</span>
                  <span>120s (muy rápido)</span>
                </div>
              </div>

              {/* Beam Size */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  🎯 Beam Size: {config.beamSize}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 3, 5, 7, 10].map((beam) => (
                    <button
                      key={beam}
                      onClick={() => updateConfig({ beamSize: beam })}
                      className={`px-3 py-2 text-xs font-medium rounded transition-all ${
                        config.beamSize === beam
                          ? 'bg-blue-600 text-white border-2 border-blue-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      {beam}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  1 (rápido) → 10+ (preciso)
                </p>
              </div>

              {/* LLM Classification Toggle */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    🤖 Clasificación LLM (Speaker)
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {config.enableLlmClassification
                      ? 'Etiquetado automático PACIENTE/MÉDICO con LLM'
                      : 'Desactivado: etiquetas como DESCONOCIDO (3-4x más rápido)'}
                  </p>
                </div>
                <button
                  onClick={() => updateConfig({ enableLlmClassification: !config.enableLlmClassification })}
                  className={`px-4 py-2 text-sm font-medium rounded transition-all ${
                    config.enableLlmClassification
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-white hover:bg-gray-500'
                  }`}
                >
                  {config.enableLlmClassification ? 'Activado' : 'Desactivado'}
                </button>
              </div>

              {/* VAD Filter Toggle */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    🔊 Voice Activity Detection (VAD)
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Filtra silencio y ruido de fondo
                  </p>
                </div>
                <button
                  onClick={() => updateConfig({ vadFilter: !config.vadFilter })}
                  className={`px-4 py-2 text-sm font-medium rounded transition-all ${
                    config.vadFilter
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-white hover:bg-gray-500'
                  }`}
                >
                  {config.vadFilter ? 'Activado' : 'Desactivado'}
                </button>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetConfig}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                ↺ Resetear a valores por defecto
              </button>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Subir Audio</h2>

          <div className="space-y-4">
            {/* Dropzone Area */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                ${!isDragActive && !isDragReject ? 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500' : ''}
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />

              {isDragActive && !isDragReject ? (
                <div className="text-blue-600 dark:text-blue-400">
                  <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium">Suelta el archivo aquí</p>
                </div>
              ) : isDragReject ? (
                <div className="text-red-600 dark:text-red-400">
                  <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-lg font-medium">Formato de archivo no válido</p>
                  <p className="text-sm mt-1">Solo archivos de audio (.webm, .wav, .mp3, .m4a, .ogg, .flac)</p>
                </div>
              ) : (
                <div className="text-gray-600 dark:text-gray-400">
                  <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Arrastra un archivo de audio aquí
                  </p>
                  <p className="text-sm mt-1">o haz clic para seleccionar</p>
                  <p className="text-xs mt-2">
                    Formatos: webm, wav, mp3, m4a, ogg, flac (max 100MB)
                  </p>
                </div>
              )}
            </div>

            {/* Selected File Info */}
            {file && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setChunks([]);
                    setJob(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={uploading}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading || !healthOk}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {uploading ? 'Procesando...' : 'Iniciar Diarización'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Job History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Historial de Jobs</h2>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showAllSessions}
                onChange={(e) => setShowAllSessions(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Ver todas las sesiones"
              />
              <span className="text-gray-700 dark:text-gray-300">Ver todas las sesiones</span>
            </label>
          </div>

          {loadingHistory ? (
            <div className="space-y-3" role="status" aria-live="polite" aria-label="Cargando historial de jobs">
              {/* Skeleton loaders */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {showAllSessions
                ? 'No hay jobs en el sistema.'
                : 'No hay jobs previos para esta sesión.'}
            </p>
          ) : (
            <div className="space-y-3">
              {jobHistory.map((historyJob) => (
                <div
                  key={historyJob.job_id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => handleViewJob(historyJob.job_id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          historyJob.status
                        )}`}
                      >
                        {historyJob.status.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {historyJob.job_id.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">
                      {new Date(historyJob.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-300">
                    <div>
                      <span className="font-medium">Progreso:</span>{' '}
                      {historyJob.progress_pct}%
                    </div>
                    <div>
                      <span className="font-medium">Chunks:</span>{' '}
                      {historyJob.processed_chunks} / {historyJob.total_chunks}
                    </div>
                    <div>
                      <span className="font-medium">Actualizado:</span>{' '}
                      {new Date(historyJob.updated_at).toLocaleTimeString()}
                    </div>
                  </div>

                  {historyJob.error && (
                    <div className="mt-2 text-xs text-red-600">
                      Error: {historyJob.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Section */}
        {job && job.status !== 'completed' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6" role="region" aria-label="Progreso del job">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Progreso</h2>
            <div className="space-y-3">
              <div
                className="flex items-center justify-between text-sm"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="text-gray-700 dark:text-gray-300">Estado:</span>
                <span className="font-semibold capitalize text-gray-900 dark:text-gray-100">{job.status}</span>
              </div>
              <div
                className="flex items-center justify-between text-sm"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="text-gray-700 dark:text-gray-300">Chunks:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{job.processed_chunks} / {job.total_chunks}</span>
              </div>
              <div
                className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3"
                role="progressbar"
                aria-valuenow={job.progress_pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso: ${job.progress_pct}%`}
              >
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress_pct}%` }}
                />
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 text-right font-medium">
                {job.progress_pct}%
              </div>
            </div>
          </div>
        )}

        {/* Incremental Chunks Display */}
        {chunks.length > 0 && (
          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {job?.status === 'completed' ? 'Resultado' : 'Resultado (en progreso)'}
                </h2>
                {job?.status === 'completed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport('json')}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Exportar JSON
                    </button>
                    <button
                      onClick={() => handleExport('markdown')}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Exportar MD
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Chunks procesados:</span>
                  <span className="ml-2 font-medium">{chunks.length}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Última actualización:</span>
                  <span className="ml-2 font-medium text-xs">
                    {job?.updated_at ? new Date(job.updated_at).toLocaleTimeString() : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Progreso:</span>
                  <span className="ml-2 font-medium">{job?.progress_pct || 0}%</span>
                </div>
              </div>
            </div>

            {/* Chunks */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Transcripción (chunks incrementales)</h3>
              <div className="space-y-3">
                {chunks.map((chunk) => {
                  const isExpanded = expandedChunks.has(chunk.chunk_idx);
                  return (
                    <div
                      key={chunk.chunk_idx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow bg-white dark:bg-gray-900 cursor-pointer"
                      onClick={() => {
                        const newExpanded = new Set(expandedChunks);
                        if (isExpanded) {
                          newExpanded.delete(chunk.chunk_idx);
                        } else {
                          newExpanded.add(chunk.chunk_idx);
                        }
                        setExpandedChunks(newExpanded);
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getSpeakerColor(
                            chunk.speaker
                          )}`}
                        >
                          {chunk.speaker}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(chunk.start_time)} - {formatTime(chunk.end_time)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          ({(chunk.end_time - chunk.start_time).toFixed(1)}s)
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          RTF: {chunk.rtf.toFixed(3)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          Conf: {chunk.temperature.toFixed(2)}
                        </span>
                        <span className="text-xs text-blue-500 dark:text-blue-400">
                          #{chunk.chunk_idx}
                        </span>
                        <button className="ml-auto text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-2">{chunk.text}</p>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
                              <div className="font-mono text-gray-900 dark:text-gray-100">{chunk.timestamp}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">Start Time:</span>
                              <div className="font-mono text-gray-900 dark:text-gray-100">{chunk.start_time.toFixed(3)}s</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">End Time:</span>
                              <div className="font-mono text-gray-900 dark:text-gray-100">{chunk.end_time.toFixed(3)}s</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                              <div className="font-mono text-gray-900 dark:text-gray-100">{(chunk.end_time - chunk.start_time).toFixed(3)}s</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">RTF (Real-Time Factor):</span>
                              <div className="font-mono text-gray-900 dark:text-gray-100">{chunk.rtf.toFixed(6)}</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">Temperature (Confidence):</span>
                              <div className="font-mono text-gray-900 dark:text-gray-100">{chunk.temperature.toFixed(6)}</div>
                            </div>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                            <span className="text-blue-700 dark:text-blue-300 font-medium">📊 FI Debug Info</span>
                            <div className="mt-1 font-mono text-blue-900 dark:text-blue-200 text-xs">
                              Processing: {(chunk.rtf * (chunk.end_time - chunk.start_time)).toFixed(3)}s wall-clock time
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* FI Debug Panel - Complete Job Visibility */}
              {job && (
                <div className="mt-6 border border-yellow-200 dark:border-yellow-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
                    🔍 FI Debug Panel - Complete Job State
                  </h4>
                  <div className="space-y-3 text-xs">
                    {/* Job Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-yellow-300 dark:border-yellow-600">
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">Job ID:</span>
                        <div className="font-mono text-gray-900 dark:text-gray-100 text-[10px] break-all">{job.job_id}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-yellow-300 dark:border-yellow-600">
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">Session ID:</span>
                        <div className="font-mono text-gray-900 dark:text-gray-100 text-[10px] break-all">{job.session_id}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-yellow-300 dark:border-yellow-600">
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">Status:</span>
                        <div className="font-mono text-gray-900 dark:text-gray-100 font-bold">{job.status}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-yellow-300 dark:border-yellow-600">
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">Created At:</span>
                        <div className="font-mono text-gray-900 dark:text-gray-100 text-[10px]">
                          {(() => {
                            try {
                              const date = new Date(job.created_at);
                              return isNaN(date.getTime()) ? job.created_at : date.toISOString();
                            } catch {
                              return job.created_at;
                            }
                          })()}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-[9px] mt-1">
                          {(() => {
                            try {
                              const date = new Date(job.created_at);
                              return isNaN(date.getTime()) ? '' : `(${date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })})`;
                            } catch {
                              return '';
                            }
                          })()}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-yellow-300 dark:border-yellow-600">
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">Updated At:</span>
                        <div className="font-mono text-gray-900 dark:text-gray-100 text-[10px]">
                          {(() => {
                            try {
                              const date = new Date(job.updated_at);
                              return isNaN(date.getTime()) ? job.updated_at : date.toISOString();
                            } catch {
                              return job.updated_at;
                            }
                          })()}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-[9px] mt-1">
                          {(() => {
                            try {
                              const date = new Date(job.updated_at);
                              return isNaN(date.getTime()) ? '' : `(${date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })})`;
                            } catch {
                              return '';
                            }
                          })()}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-yellow-300 dark:border-yellow-600">
                        <span className="text-gray-600 dark:text-gray-400 block mb-1">Progress:</span>
                        <div className="font-mono text-gray-900 dark:text-gray-100">
                          {job.processed_chunks} / {job.total_chunks} chunks
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-[9px] mt-1">
                          ({job.progress_pct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    {/* Time Since Last Update */}
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border border-yellow-300 dark:border-yellow-600">
                      <span className="text-gray-600 dark:text-gray-400 block mb-1">⏱️ Time Since Last Update:</span>
                      <div className="font-mono text-gray-900 dark:text-gray-100">
                        {(() => {
                          const now = Date.now();
                          const updated = new Date(job.updated_at).getTime();
                          const diffMs = now - updated;
                          const diffSec = Math.floor(diffMs / 1000);
                          const diffMin = Math.floor(diffSec / 60);

                          if (diffMin > 0) {
                            return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ${diffSec % 60} seconds ago`;
                          }
                          return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
                        })()}
                      </div>
                    </div>

                    {/* Note about old jobs */}
                    {job.session_id === 'unknown' && (
                      <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded border border-orange-300 dark:border-orange-700">
                        <div className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
                          ℹ️ Legacy Job
                        </div>
                        <div className="text-orange-700 dark:text-orange-400 space-y-1">
                          <div>This job was created before the HDF5 storage system was enabled.</div>
                          <div>• Restart/Cancel actions may not work</div>
                          <div>• Limited diagnostic information available</div>
                          <div>• Please upload a new audio file for full functionality</div>
                        </div>
                      </div>
                    )}

                    {/* Diagnostic Warning if Job Appears Stuck */}
                    {job.status === 'in_progress' && (() => {
                      const now = Date.now();
                      const updated = new Date(job.updated_at).getTime();
                      const diffMin = Math.floor((now - updated) / 60000);
                      const isStuck = diffMin > 2; // No updates for 2+ minutes

                      if (isStuck) {
                        return (
                          <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-300 dark:border-red-700">
                            <div className="font-semibold text-red-800 dark:text-red-300 mb-2">
                              ⚠️ Diagnostic Warning: Job May Be Stuck
                            </div>
                            <div className="text-red-700 dark:text-red-400 space-y-1">
                              <div>• Last update was {diffMin} minutes ago</div>
                              <div>• Processed {job.processed_chunks} / {job.total_chunks} chunks ({job.progress_pct.toFixed(1)}%)</div>
                              <div>• Status shows as: {job.status}</div>
                              <div className="mt-2 pt-2 border-t border-red-300 dark:border-red-600">
                                <strong>Possible Causes:</strong>
                                <ul className="ml-4 mt-1">
                                  <li>• Backend worker crashed or stopped</li>
                                  <li>• CPU idle threshold not met (low-priority mode)</li>
                                  <li>• Audio chunk processing error (check backend logs)</li>
                                  <li>• Model loading issue (Whisper/Pyannote)</li>
                                  {job.session_id === 'unknown' && <li>• This is a legacy job (HDF5 not enabled)</li>}
                                </ul>
                              </div>
                              <div className="mt-2 pt-2 border-t border-red-300 dark:border-red-600">
                                <strong>Actions:</strong>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`http://localhost:7001/api/diarization/jobs/${job.job_id}/restart`, {
                                          method: 'POST'
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                          alert(`✅ Job restarted successfully\n\nNew Job ID: ${data.new_job_id}\n\nReloading page...`);
                                          window.location.reload();
                                        } else {
                                          if (res.status === 404 && data.detail?.includes('HDF5')) {
                                            alert(`❌ Cannot restart old job\n\n${data.detail}\n\nPlease upload a new audio file instead.`);
                                          } else {
                                            alert(`❌ Failed to restart job\n\n${data.detail || 'Unknown error'}`);
                                          }
                                        }
                                      } catch (err) {
                                        alert('❌ Error: ' + err);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                                  >
                                    🔄 Restart Job
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`http://localhost:7001/api/diarization/jobs/${job.job_id}/cancel`, {
                                          method: 'POST'
                                        });
                                        if (res.ok) {
                                          alert('✅ Job cancelled');
                                          window.location.reload();
                                        } else {
                                          alert('❌ Failed to cancel job');
                                        }
                                      } catch (err) {
                                        alert('❌ Error: ' + err);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                                  >
                                    🛑 Cancel Job
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`http://localhost:7001/api/diarization/jobs/${job.job_id}/logs`);
                                        const logs = await res.json();
                                        const logWindow = window.open('', 'Job Logs', 'width=800,height=600');
                                        if (logWindow) {
                                          logWindow.document.write(`
                                            <html>
                                              <head><title>Job Logs - ${job.job_id}</title></head>
                                              <body style="font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff;">
                                                <h2>Job Logs: ${job.job_id}</h2>
                                                <pre style="background: #000; padding: 15px; border-radius: 5px; overflow: auto;">${JSON.stringify(logs, null, 2)}</pre>
                                              </body>
                                            </html>
                                          `);
                                        }
                                      } catch (err) {
                                        alert('❌ Error fetching logs: ' + err);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                                  >
                                    📋 View Logs
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch('http://localhost:7001/api/system/health');
                                        const health = await res.json();
                                        const healthWindow = window.open('', 'System Health', 'width=800,height=600');
                                        if (healthWindow) {
                                          healthWindow.document.write(`
                                            <html>
                                              <head><title>System Health</title></head>
                                              <body style="font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff;">
                                                <h2>System Health</h2>
                                                <pre style="background: #000; padding: 15px; border-radius: 5px; overflow: auto;">${JSON.stringify(health, null, 2)}</pre>
                                              </body>
                                            </html>
                                          `);
                                        }
                                      } catch (err) {
                                        alert('❌ Error fetching health: ' + err);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                                  >
                                    🏥 System Health
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Error Display */}
                    {job.error && (
                      <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-300 dark:border-red-700">
                        <div className="font-semibold text-red-800 dark:text-red-300 mb-2">❌ Error Details:</div>
                        <div className="font-mono text-red-700 dark:text-red-400 text-xs break-all">
                          {job.error}
                        </div>
                      </div>
                    )}

                    {/* Processing Statistics */}
                    {job.chunks && job.chunks.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-300 dark:border-blue-700">
                        <div className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📊 Processing Statistics:</div>
                        <div className="text-blue-700 dark:text-blue-400 space-y-1">
                          <div>• Average RTF: {(job.chunks.reduce((sum, c) => sum + c.rtf, 0) / job.chunks.length).toFixed(4)}</div>
                          <div>• Average Confidence: {(job.chunks.reduce((sum, c) => sum + c.temperature, 0) / job.chunks.length).toFixed(4)}</div>
                          <div>• Total Audio Duration: {job.chunks.reduce((sum, c) => sum + (c.end_time - c.start_time), 0).toFixed(1)}s</div>
                          <div>• Unique Speakers: {new Set(job.chunks.map(c => c.speaker)).size}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {job?.status === 'in_progress' && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded text-sm text-blue-700 dark:text-blue-300">
                  ⏳ Procesando... los chunks se actualizan automáticamente conforme se completan
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
