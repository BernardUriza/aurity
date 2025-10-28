// =============================================================================
// useTranscriptionState Hook - Transcription Management
// =============================================================================
// Manages transcription state and segments
// Version: 0.1.0
// =============================================================================

import { useState, useCallback } from 'react';
import { TranscriptionState, TranscriptionSegment } from '../types';

const DEFAULT_TRANSCRIPTION_STATE: TranscriptionState = {
  segments: [],
  isLive: false,
  error: undefined,
};

export function useTranscriptionState() {
  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>(
    DEFAULT_TRANSCRIPTION_STATE
  );

  const addSegment = useCallback((segment: TranscriptionSegment) => {
    setTranscriptionState((prev) => ({
      ...prev,
      segments: [...prev.segments, segment],
    }));
  }, []);

  const updateSegment = useCallback((id: string, updates: Partial<TranscriptionSegment>) => {
    setTranscriptionState((prev) => ({
      ...prev,
      segments: prev.segments.map((seg) =>
        seg.id === id ? { ...seg, ...updates } : seg
      ),
    }));
  }, []);

  const removeSegment = useCallback((id: string) => {
    setTranscriptionState((prev) => ({
      ...prev,
      segments: prev.segments.filter((seg) => seg.id !== id),
    }));
  }, []);

  const clearSegments = useCallback(() => {
    setTranscriptionState((prev) => ({
      ...prev,
      segments: [],
    }));
  }, []);

  const startLive = useCallback(() => {
    setTranscriptionState((prev) => ({
      ...prev,
      isLive: true,
      error: undefined,
    }));
  }, []);

  const stopLive = useCallback(() => {
    setTranscriptionState((prev) => ({
      ...prev,
      isLive: false,
    }));
  }, []);

  const setError = useCallback((error: string | undefined) => {
    setTranscriptionState((prev) => ({
      ...prev,
      error,
      isLive: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setTranscriptionState(DEFAULT_TRANSCRIPTION_STATE);
  }, []);

  const getFullTranscript = useCallback(() => {
    return transcriptionState.segments
      .filter((seg) => seg.isFinal)
      .map((seg) => seg.text)
      .join(' ');
  }, [transcriptionState.segments]);

  return {
    transcriptionState,
    addSegment,
    updateSegment,
    removeSegment,
    clearSegments,
    startLive,
    stopLive,
    setError,
    reset,
    getFullTranscript,
  };
}
