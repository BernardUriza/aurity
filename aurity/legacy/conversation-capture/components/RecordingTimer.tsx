// =============================================================================
// RecordingTimer Component
// =============================================================================
// Displays recording duration timer
// Version: 0.1.0
// =============================================================================

'use client';

import React, { useEffect, useState } from 'react';

interface RecordingTimerProps {
  isRecording: boolean;
  isPaused: boolean;
  startTime?: Date;
  className?: string;
}

export function RecordingTimer({
  isRecording,
  isPaused,
  startTime,
  className = '',
}: RecordingTimerProps) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isRecording && !isPaused && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setDuration(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRecording, isPaused, startTime]);

  useEffect(() => {
    if (!isRecording) {
      setDuration(0);
    }
  }, [isRecording]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return null;
  }

  return (
    <div className={`recording-timer ${isPaused ? 'paused' : 'active'} ${className}`}>
      <div className="timer-indicator">
        {!isPaused && <span className="recording-dot pulse" />}
        {isPaused && <span className="paused-icon">⏸</span>}
      </div>
      <span className="timer-duration">{formatDuration(duration)}</span>
      <span className="timer-status">{isPaused ? 'Paused' : 'Recording'}</span>
    </div>
  );
}
