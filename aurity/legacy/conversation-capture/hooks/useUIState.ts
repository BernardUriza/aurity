// =============================================================================
// useUIState Hook - UI State Management
// =============================================================================
// Manages UI state for ConversationCapture component
// Version: 0.1.0
// =============================================================================

import { useState, useCallback } from 'react';
import { UIState } from '../types';

const DEFAULT_UI_STATE: UIState = {
  isRecording: false,
  isPaused: false,
  isProcessing: false,
  showTranscription: true,
  isDarkMode: false,
  volume: 0,
};

export function useUIState(initialDarkMode: boolean = false) {
  const [uiState, setUIState] = useState<UIState>({
    ...DEFAULT_UI_STATE,
    isDarkMode: initialDarkMode,
  });

  const startRecording = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      isRecording: true,
      isPaused: false,
      isProcessing: false,
    }));
  }, []);

  const pauseRecording = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resumeRecording = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  const stopRecording = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      isProcessing: true,
    }));
  }, []);

  const finishProcessing = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      isProcessing: false,
    }));
  }, []);

  const toggleTranscription = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      showTranscription: !prev.showTranscription,
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setUIState((prev) => ({
      ...prev,
      isDarkMode: !prev.isDarkMode,
    }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setUIState((prev) => ({
      ...prev,
      volume: Math.max(0, Math.min(100, volume)),
    }));
  }, []);

  const reset = useCallback(() => {
    setUIState({
      ...DEFAULT_UI_STATE,
      isDarkMode: uiState.isDarkMode, // Preserve dark mode preference
    });
  }, [uiState.isDarkMode]);

  return {
    uiState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    finishProcessing,
    toggleTranscription,
    toggleDarkMode,
    setVolume,
    reset,
  };
}
