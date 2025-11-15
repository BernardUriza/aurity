/**
 * Diarization Polling Hook
 *
 * Polls the diarization job status and waits for HDF5 triple vision completion
 *
 * Author: Bernard Uriza Orozco
 * Created: 2025-11-14
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface DiarizationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  segmentCount?: number;
  error?: string;
  hasTripleVision?: boolean; // All 3 sources present in HDF5
}

interface UseDiarizationPollingOptions {
  sessionId: string;
  jobId: string;
  enabled: boolean;
  pollInterval?: number;
  maxAttempts?: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

interface UseDiarizationPollingReturn {
  status: DiarizationStatus;
  isPolling: boolean;
  cancel: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

export function useDiarizationPolling(
  options: UseDiarizationPollingOptions
): UseDiarizationPollingReturn {
  const {
    sessionId,
    jobId,
    enabled,
    pollInterval = 2000, // Poll every 2 seconds
    maxAttempts = 150, // 5 minutes max (150 * 2s = 300s)
    onComplete,
    onError,
  } = options;

  const [status, setStatus] = useState<DiarizationStatus>({
    status: 'pending',
    progress: 0,
    hasTripleVision: false,
  });
  const [isPolling, setIsPolling] = useState(false);
  const attemptRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  const checkDiarizationStatus = useCallback(async (): Promise<DiarizationStatus | null> => {
    try {
      // Check diarization job status
      const response = await fetch(
        `${BACKEND_URL}/api/internal/diarization/jobs/${jobId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Check if HDF5 has triple vision (all 3 sources)
      const hasWebSpeech = data.transcription_sources?.webspeech_final?.length > 0;
      const hasChunks = data.transcription_sources?.transcription_per_chunks?.length > 0;
      const hasFullText = data.transcription_sources?.full_transcription?.length > 0;
      const hasTripleVision = hasWebSpeech && hasChunks && hasFullText;

      return {
        status: data.status,
        progress: data.progress || 0,
        segmentCount: data.segment_count,
        hasTripleVision,
      };
    } catch (error) {
      console.warn('[Diarization Poll] Error:', error);
      return null;
    }
  }, [jobId]);

  const startPolling = useCallback(() => {
    if (isCancelledRef.current) return;

    setIsPolling(true);
    attemptRef.current = 0;

    const poll = async () => {
      if (isCancelledRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPolling(false);
        return;
      }

      attemptRef.current++;

      // Check for timeout
      if (attemptRef.current > maxAttempts) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setStatus({
          status: 'failed',
          progress: 0,
          error: 'Timeout waiting for diarization',
          hasTripleVision: false,
        });
        setIsPolling(false);
        onError?.('Timeout waiting for diarization');
        return;
      }

      const result = await checkDiarizationStatus();

      if (result) {
        setStatus(result);

        // Check if completed AND has triple vision
        if (result.status === 'completed' && result.hasTripleVision) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsPolling(false);
          onComplete?.();
        } else if (result.status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsPolling(false);
          onError?.(result.error || 'Diarization failed');
        }
      }
    };

    // Start polling
    intervalRef.current = setInterval(poll, pollInterval);
    poll(); // Run immediately
  }, [checkDiarizationStatus, maxAttempts, pollInterval, onComplete, onError]);

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (enabled && sessionId && jobId) {
      isCancelledRef.current = false;
      startPolling();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, sessionId, jobId, startPolling]);

  return {
    status,
    isPolling,
    cancel,
  };
}
