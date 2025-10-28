// =============================================================================
// VoiceReactiveMicrophone Component
// =============================================================================
// Animated microphone icon that reacts to voice input
// Version: 0.1.0
// =============================================================================

'use client';

import React, { useEffect, useState } from 'react';

interface VoiceReactiveMicrophoneProps {
  isRecording: boolean;
  volume: number; // 0-100
  className?: string;
}

export function VoiceReactiveMicrophone({
  isRecording,
  volume,
  className = '',
}: VoiceReactiveMicrophoneProps) {
  const [scale, setScale] = useState(1);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isRecording) {
      // Scale based on volume (0-100 -> 1.0-1.5)
      const newScale = 1 + (volume / 100) * 0.5;
      setScale(newScale);

      // Pulse effect when volume is high
      if (volume > 50) {
        setPulse(true);
        const timeout = setTimeout(() => setPulse(false), 200);
        return () => clearTimeout(timeout);
      } else {
        setPulse(false);
      }
    } else {
      setScale(1);
      setPulse(false);
    }
  }, [isRecording, volume]);

  return (
    <div
      className={`voice-reactive-mic ${className}`}
      style={{
        transform: `scale(${scale})`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div className={`mic-icon ${isRecording ? 'recording' : ''} ${pulse ? 'pulse' : ''}`}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Microphone body */}
          <path
            d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z"
            fill="currentColor"
          />
          {/* Microphone stand */}
          <path
            d="M17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Animated rings when recording */}
      {isRecording && (
        <>
          <div className="mic-ring ring-1" />
          <div className="mic-ring ring-2" />
          <div className="mic-ring ring-3" />
        </>
      )}
    </div>
  );
}
