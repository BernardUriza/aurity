// =============================================================================
// LiveTranscriptionDisplay Component
// =============================================================================
// Displays live transcription with auto-scroll
// Version: 0.1.0
// =============================================================================

'use client';

import React, { useEffect, useRef } from 'react';
import { TranscriptionSegment } from '../types';

interface LiveTranscriptionDisplayProps {
  segments: TranscriptionSegment[];
  isLive: boolean;
  className?: string;
}

export function LiveTranscriptionDisplay({
  segments,
  isLive,
  className = '',
}: LiveTranscriptionDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new segments arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [segments]);

  if (segments.length === 0 && !isLive) {
    return (
      <div className={`transcription-display empty ${className}`}>
        <p className="empty-message">Transcription will appear here when available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`transcription-display ${isLive ? 'live' : ''} ${className}`}>
      {isLive && (
        <div className="live-indicator">
          <span className="live-dot" />
          <span className="live-text">Live Transcription</span>
        </div>
      )}

      <div className="segments">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`segment ${segment.isFinal ? 'final' : 'interim'} fade-in`}
          >
            <div className="segment-content">
              <span className="segment-text">{segment.text}</span>
              {segment.confidence !== undefined && (
                <span className="segment-confidence">
                  {Math.round(segment.confidence * 100)}%
                </span>
              )}
            </div>
            {segment.speaker && (
              <span className="segment-speaker">{segment.speaker}</span>
            )}
            <span className="segment-timestamp">
              {new Date(segment.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {isLive && segments.length > 0 && !segments[segments.length - 1].isFinal && (
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
}
