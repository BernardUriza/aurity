// =============================================================================
// RecordingControls Component
// =============================================================================
// Control buttons for recording (start, pause, stop, cancel)
// Version: 0.1.0
// =============================================================================

'use client';

import React from 'react';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onCancel: () => void;
  className?: string;
}

export function RecordingControls({
  isRecording,
  isPaused,
  isProcessing,
  onStart,
  onPause,
  onResume,
  onStop,
  onCancel,
  className = '',
}: RecordingControlsProps) {
  if (isProcessing) {
    return (
      <div className={`recording-controls processing ${className}`}>
        <div className="processing-spinner" />
        <p className="processing-text">Processing recording...</p>
      </div>
    );
  }

  if (!isRecording) {
    return (
      <div className={`recording-controls idle ${className}`}>
        <button
          onClick={onStart}
          className="btn btn-primary btn-start slide-in"
          aria-label="Start Recording"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
          </svg>
          <span>Start Recording</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`recording-controls recording ${className}`}>
      <div className="controls-group">
        {isPaused ? (
          <button
            onClick={onResume}
            className="btn btn-success btn-resume"
            aria-label="Resume Recording"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
            </svg>
            <span>Resume</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="btn btn-warning btn-pause"
            aria-label="Pause Recording"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="4" width="4" height="16" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" fill="currentColor" />
            </svg>
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={onStop}
          className="btn btn-danger btn-stop"
          aria-label="Stop Recording"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="6" width="12" height="12" fill="currentColor" />
          </svg>
          <span>Stop</span>
        </button>

        <button
          onClick={onCancel}
          className="btn btn-secondary btn-cancel"
          aria-label="Cancel Recording"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
              fill="currentColor"
            />
          </svg>
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
