// =============================================================================
// ConversationCapture Component
// =============================================================================
// Main conversation capture component with recording and transcription
// Extracted from symfarmia/dev for Aurity Framework
// Version: 0.1.0
// =============================================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useUIState } from './hooks/useUIState';
import { useTranscriptionState } from './hooks/useTranscriptionState';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import {
  VoiceReactiveMicrophone,
  LiveTranscriptionDisplay,
  RecordingControls,
  RecordingTimer,
  AudioWaveform,
} from './components';
import {
  ConversationCaptureProps,
  ConversationSession,
  RecordingState,
  TranscriptionSegment,
} from './types';
import './styles/conversation-capture.css';

export function ConversationCapture({
  onSave,
  onCancel,
  autoTranscribe = false,
  showLiveTranscription = true,
  whisperOptions = {},
  recordingOptions = {},
  darkMode = false,
}: ConversationCaptureProps) {
  const {
    uiState,
    startRecording: startUIRecording,
    pauseRecording: pauseUIRecording,
    resumeRecording: resumeUIRecording,
    stopRecording: stopUIRecording,
    finishProcessing,
    toggleTranscription,
    toggleDarkMode,
    setVolume,
    reset: resetUI,
  } = useUIState(darkMode);

  const {
    transcriptionState,
    addSegment,
    clearSegments,
    startLive,
    stopLive,
    setError: setTranscriptionError,
    reset: resetTranscription,
    getFullTranscript,
  } = useTranscriptionState();

  const {
    isRecording,
    isPaused,
    audioBlob,
    audioMetadata,
    error: recorderError,
    startRecording: startAudioRecording,
    pauseRecording: pauseAudioRecording,
    resumeRecording: resumeAudioRecording,
    stopRecording: stopAudioRecording,
    reset: resetRecorder,
  } = useAudioRecorder(recordingOptions);

  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Monitor audio volume for voice reactivity
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Simulate volume detection (in production, use Web Audio API AnalyserNode)
      const interval = setInterval(() => {
        const simulatedVolume = Math.random() * 100;
        setVolume(simulatedVolume);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setVolume(0);
    }
  }, [isRecording, isPaused, setVolume]);

  // Show recorder errors
  useEffect(() => {
    if (recorderError) {
      Swal.fire({
        icon: 'error',
        title: 'Recording Error',
        text: recorderError.message,
        background: uiState.isDarkMode ? '#1f2937' : '#ffffff',
        color: uiState.isDarkMode ? '#f3f4f6' : '#1f2937',
        confirmButtonColor: '#ef4444',
      });
    }
  }, [recorderError, uiState.isDarkMode]);

  const handleStartRecording = useCallback(async () => {
    try {
      startUIRecording();
      await startAudioRecording();
      setSessionStartTime(new Date());

      if (showLiveTranscription) {
        startLive();
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Recording started',
        showConfirmButton: false,
        timer: 2000,
        background: uiState.isDarkMode ? '#1f2937' : '#ffffff',
        color: uiState.isDarkMode ? '#f3f4f6' : '#1f2937',
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [startUIRecording, startAudioRecording, startLive, showLiveTranscription, uiState.isDarkMode]);

  const handlePauseRecording = useCallback(() => {
    pauseUIRecording();
    pauseAudioRecording();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Recording paused',
      showConfirmButton: false,
      timer: 2000,
      background: uiState.isDarkMode ? '#1f2937' : '#ffffff',
      color: uiState.isDarkMode ? '#f3f4f6' : '#1f2937',
    });
  }, [pauseUIRecording, pauseAudioRecording, uiState.isDarkMode]);

  const handleResumeRecording = useCallback(() => {
    resumeUIRecording();
    resumeAudioRecording();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Recording resumed',
      showConfirmButton: false,
      timer: 2000,
      background: uiState.isDarkMode ? '#1f2937' : '#ffffff',
      color: uiState.isDarkMode ? '#f3f4f6' : '#1f2937',
    });
  }, [resumeUIRecording, resumeAudioRecording, uiState.isDarkMode]);

  const handleStopRecording = useCallback(async () => {
    stopUIRecording();
    const blob = await stopAudioRecording();
    stopLive();

    if (!blob || !sessionStartTime) {
      finishProcessing();
      return;
    }

    // Process transcription if enabled
    if (autoTranscribe) {
      try {
        // TODO: Implement Whisper API transcription
        // const transcript = await transcribeAudio(blob, whisperOptions);
        // addSegment(transcript);
        console.log('Transcription would happen here');
      } catch (error) {
        console.error('Transcription failed:', error);
        setTranscriptionError('Failed to transcribe audio');
      }
    }

    // Create session
    const session: ConversationSession = {
      id: crypto.randomUUID(),
      startTime: sessionStartTime,
      endTime: new Date(),
      duration: audioMetadata?.duration || 0,
      transcription: transcriptionState.segments,
      audioBlob: blob,
      audioMetadata: audioMetadata || undefined,
      status: RecordingState.COMPLETED,
    };

    finishProcessing();

    // Show save dialog
    const result = await Swal.fire({
      title: 'Save Recording?',
      text: `Duration: ${Math.round(session.duration)}s`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Discard',
      background: uiState.isDarkMode ? '#1f2937' : '#ffffff',
      color: uiState.isDarkMode ? '#f3f4f6' : '#1f2937',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
    });

    if (result.isConfirmed && onSave) {
      onSave(session);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Recording saved',
        showConfirmButton: false,
        timer: 2000,
        background: uiState.isDarkMode ? '#1f2937' : '#ffffff',
        color: uiState.isDarkMode ? '#f3f4f6' : '#1f2937',
      });
    }

    // Reset state
    resetUI();
    resetTranscription();
    resetRecorder();
    setSessionStartTime(null);
  }, [
    stopUIRecording,
    stopAudioRecording,
    stopLive,
    finishProcessing,
    sessionStartTime,
    autoTranscribe,
    audioMetadata,
    transcriptionState.segments,
    onSave,
    resetUI,
    resetTranscription,
    resetRecorder,
    uiState.isDarkMode,
    setTranscriptionError,
  ]);

  const handleCancelRecording = useCallback(async () => {
    const result = await Swal.fire({
      title: 'Cancel Recording?',
      text: 'This will discard the current recording',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'Continue recording',
      background: uiState.isDarkMode ? '#1f2937' : '#ffffff',
      color: uiState.isDarkMode ? '#f3f4f6' : '#1f2937',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      resetUI();
      resetTranscription();
      resetRecorder();
      setSessionStartTime(null);

      if (onCancel) {
        onCancel();
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Recording cancelled',
        showConfirmButton: false,
        timer: 2000,
        background: uiState.isDarkMode ? '#1f2937' : '#ffffff',
        color: uiState.isDarkMode ? '#f3f4f6' : '#1f2937',
      });
    }
  }, [resetUI, resetTranscription, resetRecorder, onCancel, uiState.isDarkMode]);

  return (
    <div className={`conversation-capture ${uiState.isDarkMode ? 'dark' : 'light'}`}>
      <div className="capture-container fade-in">
        {/* Header */}
        <div className="capture-header">
          <h2 className="capture-title">Conversation Capture</h2>
          <button
            onClick={toggleDarkMode}
            className="btn-icon"
            aria-label="Toggle Dark Mode"
          >
            {uiState.isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Main Content */}
        <div className="capture-main">
          {/* Voice Reactive Microphone */}
          <div className="mic-section">
            <VoiceReactiveMicrophone
              isRecording={uiState.isRecording}
              volume={uiState.volume}
            />
            <RecordingTimer
              isRecording={uiState.isRecording}
              isPaused={uiState.isPaused}
              startTime={sessionStartTime || undefined}
            />
          </div>

          {/* Audio Waveform */}
          {uiState.isRecording && (
            <div className="waveform-section slide-in">
              <AudioWaveform
                isRecording={uiState.isRecording && !uiState.isPaused}
                volume={uiState.volume}
              />
            </div>
          )}

          {/* Live Transcription */}
          {showLiveTranscription && uiState.showTranscription && (
            <div className="transcription-section slide-in">
              <div className="section-header">
                <h3>Transcription</h3>
                <button
                  onClick={toggleTranscription}
                  className="btn-icon"
                  aria-label="Toggle Transcription"
                >
                  {uiState.showTranscription ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <LiveTranscriptionDisplay
                segments={transcriptionState.segments}
                isLive={transcriptionState.isLive}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="capture-controls">
          <RecordingControls
            isRecording={uiState.isRecording}
            isPaused={uiState.isPaused}
            isProcessing={uiState.isProcessing}
            onStart={handleStartRecording}
            onPause={handlePauseRecording}
            onResume={handleResumeRecording}
            onStop={handleStopRecording}
            onCancel={handleCancelRecording}
          />
        </div>
      </div>
    </div>
  );
}
