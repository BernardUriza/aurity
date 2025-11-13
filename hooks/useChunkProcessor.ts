/**
 * useChunkProcessor Hook
 *
 * Maneja el procesamiento de chunks de audio con backend integration:
 * - Job polling con timeout y retry logic
 * - Status tracking por chunk (pending → processing → completed/failed)
 * - Métricas en tiempo real (latencia promedio, backend health)
 * - Activity logs
 *
 * Extraído de ConversationCapture durante refactoring incremental.
 *
 * @example
 * const { chunkStatuses, pollJobStatus, avgLatency, backendHealth, addLog } =
 *   useChunkProcessor({
 *     backendUrl: 'http://localhost:7001'
 *   });
 *
 * // Upload chunk and poll for result
 * const transcript = await pollJobStatus(jobId, chunkNumber);
 */

import { useState, useCallback } from 'react';

interface ChunkStatus {
  index: number;
  status: 'uploading' | 'pending' | 'processing' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  latency?: number;
  transcript?: string;
  error?: string;
}

interface UseChunkProcessorConfig {
  backendUrl?: string;
  maxAttempts?: number;
  pollInterval?: number;
}

interface UseChunkProcessorReturn {
  chunkStatuses: ChunkStatus[];
  setChunkStatuses: React.Dispatch<React.SetStateAction<ChunkStatus[]>>;
  avgLatency: number;
  backendHealth: 'healthy' | 'degraded' | 'down';
  activityLogs: string[];
  pollJobStatus: (jobId: string, chunkNumber: number) => Promise<string | null>;
  addLog: (message: string) => void;
  resetMetrics: () => void;
}

export function useChunkProcessor(
  config: UseChunkProcessorConfig = {}
): UseChunkProcessorReturn {
  const {
    backendUrl = 'http://localhost:7001',
    maxAttempts = 120, // 120 attempts * 500ms = 60s timeout
    pollInterval = 500, // 500ms between polls
  } = config;

  // State
  const [chunkStatuses, setChunkStatuses] = useState<ChunkStatus[]>([]);
  const [avgLatency, setAvgLatency] = useState<number>(0);
  const [backendHealth, setBackendHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');
  const [activityLogs, setActivityLogs] = useState<string[]>([]);

  // Add log entry (keep last 10)
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  }, []);

  // Poll job status with retry logic
  const pollJobStatus = useCallback(
    async (jobId: string, chunkNumber: number): Promise<string | null> => {
      const startTime = Date.now();

      // Update chunk status to pending
      setChunkStatuses((prev) => {
        const existing = prev.find((c) => c.index === chunkNumber);
        if (existing) {
          return prev.map((c) =>
            c.index === chunkNumber ? { ...c, status: 'pending' as const } : c
          );
        }
        return [...prev, { index: chunkNumber, status: 'pending' as const, startTime }];
      });

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          // Use PUBLIC workflow endpoint (AUR-PROMPT-4.2 compliance)
          const response = await fetch(
            `${backendUrl}/api/workflows/aurity/jobs/${jobId}`
          );

          if (!response.ok) {
            console.error(`[CHUNK ${chunkNumber}] Poll failed: ${response.status}`);
            setBackendHealth('degraded');
            return null;
          }

          const jobStatus = await response.json();

          // Update chunk status based on backend response
          if (jobStatus.status === 'processing') {
            setChunkStatuses((prev) =>
              prev.map((c) =>
                c.index === chunkNumber ? { ...c, status: 'processing' as const } : c
              )
            );
          }

          // Backend returns: {status: "pending"|"processing"|"completed"|"failed", transcript?: string}
          if (jobStatus.status === 'completed') {
            const endTime = Date.now();
            const latency = endTime - startTime;

            console.log(
              `[CHUNK ${chunkNumber}] ✅ Poll completed (${latency}ms)`,
              jobStatus
            );
            addLog(`Chunk ${chunkNumber} transcrito en ${(latency / 1000).toFixed(1)}s`);

            // Try different field names the backend might use
            const transcript =
              jobStatus.transcript || jobStatus.text || jobStatus.transcription;

            // Update chunk status to completed
            setChunkStatuses((prev) =>
              prev.map((c) =>
                c.index === chunkNumber
                  ? {
                      ...c,
                      status: 'completed' as const,
                      endTime,
                      latency,
                      transcript: transcript || '',
                    }
                  : c
              )
            );

            // Update average latency
            setChunkStatuses((current) => {
              const completed = current.filter((c) => c.status === 'completed' && c.latency);
              if (completed.length > 0) {
                const avg =
                  completed.reduce((sum, c) => sum + (c.latency || 0), 0) / completed.length;
                setAvgLatency(avg);
              }
              return current;
            });

            setBackendHealth('healthy');

            if (transcript) {
              return transcript;
            } else {
              console.warn(
                `[CHUNK ${chunkNumber}] Job completed but no transcript. Keys:`,
                Object.keys(jobStatus)
              );
              return null;
            }
          } else if (jobStatus.status === 'failed') {
            console.error(
              `[CHUNK ${chunkNumber}] Job failed: ${jobStatus.error || 'Unknown error'}`
            );
            addLog(`❌ Chunk ${chunkNumber} falló: ${jobStatus.error || 'Unknown'}`);

            setChunkStatuses((prev) =>
              prev.map((c) =>
                c.index === chunkNumber
                  ? {
                      ...c,
                      status: 'failed' as const,
                      endTime: Date.now(),
                      error: jobStatus.error,
                    }
                  : c
              )
            );
            setBackendHealth('degraded');
            return null;
          } else if (jobStatus.status === 'pending' || jobStatus.status === 'processing') {
            // Still processing, wait and continue polling
            if (attempt % 10 === 0) {
              // Log every 5 seconds (10 attempts * 500ms)
              console.log(
                `[CHUNK ${chunkNumber}] ⏳ Polling... (${jobStatus.status}, attempt ${attempt + 1})`
              );
            }
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            continue;
          } else {
            console.warn(
              `[CHUNK ${chunkNumber}] Unknown job status: ${jobStatus.status}`,
              jobStatus
            );
            return null;
          }
        } catch (err) {
          console.error(`[CHUNK ${chunkNumber}] Poll error:`, err);
          setBackendHealth('down');
          return null;
        }
      }

      // Timeout
      console.error(
        `[CHUNK ${chunkNumber}] Poll timeout after ${maxAttempts * pollInterval}ms`
      );
      addLog(`⏱️ Chunk ${chunkNumber} timeout (>60s)`);
      setChunkStatuses((prev) =>
        prev.map((c) =>
          c.index === chunkNumber
            ? { ...c, status: 'failed' as const, error: 'Timeout' }
            : c
        )
      );
      return null;
    },
    [backendUrl, maxAttempts, pollInterval, addLog]
  );

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setChunkStatuses([]);
    setAvgLatency(0);
    setBackendHealth('healthy');
    setActivityLogs([]);
  }, []);

  return {
    chunkStatuses,
    setChunkStatuses,
    avgLatency,
    backendHealth,
    activityLogs,
    pollJobStatus,
    addLog,
    resetMetrics,
  };
}
