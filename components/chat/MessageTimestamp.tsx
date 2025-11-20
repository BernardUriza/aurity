'use client';

/**
 * MessageTimestamp Component
 *
 * Elegant timestamp display with:
 * - Smart relative/absolute time
 * - Tooltip with full datetime on hover
 * - Live updates (optional)
 * - Fade-in animation
 * - Accessible markup
 */

import { useState, useEffect } from 'react';
import { formatMessageTime, formatAbsoluteTime } from '@/lib/chat/timestamp';
import type { TimestampConfig } from '@/config/chat.config';

export interface MessageTimestampProps {
  /** ISO timestamp string or Date object */
  timestamp: string | Date;

  /** Configuration options */
  config?: Partial<TimestampConfig>;

  /** Additional CSS classes */
  className?: string;

  /** Position: 'top' | 'bottom' | 'inline' */
  position?: 'top' | 'bottom' | 'inline';

  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
}

/**
 * Timestamp component with smart formatting and tooltip
 */
export function MessageTimestamp({
  timestamp,
  config = {},
  className = '',
  position = 'inline',
  size = 'xs',
}: MessageTimestampProps) {
  const {
    format = 'smart',
    showTooltip = true,
    relativeThreshold = 60,
    showSeconds = false,
    updateInterval = 60000,
  } = config;

  // State for live updates
  const [displayTime, setDisplayTime] = useState(() =>
    formatMessageTime(timestamp, {
      relative: format !== 'absolute',
      relativeThreshold,
      showSeconds,
    })
  );

  const [showTooltipState, setShowTooltipState] = useState(false);

  // Update timestamp periodically for relative time
  useEffect(() => {
    if (format === 'absolute' || !updateInterval) return;

    const interval = setInterval(() => {
      setDisplayTime(
        formatMessageTime(timestamp, {
          relative: true,
          relativeThreshold,
          showSeconds,
        })
      );
    }, updateInterval);

    return () => clearInterval(interval);
  }, [timestamp, format, relativeThreshold, showSeconds, updateInterval]);

  // Size classes
  const sizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
  };

  // Position classes
  const positionClasses = {
    top: 'mb-1',
    bottom: 'mt-1',
    inline: 'ml-auto',
  };

  const absoluteTime = formatAbsoluteTime(timestamp);

  return (
    <div className={`relative inline-block ${positionClasses[position]}`}>
      <time
        dateTime={typeof timestamp === 'string' ? timestamp : timestamp.toISOString()}
        className={`
          ${sizeClasses[size]}
          font-light
          text-slate-400/70
          transition-all duration-200
          hover:text-slate-300/90
          cursor-default
          ${className}
        `}
        onMouseEnter={() => setShowTooltipState(true)}
        onMouseLeave={() => setShowTooltipState(false)}
        aria-label={absoluteTime}
      >
        {displayTime}
      </time>

      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <div
          className="
            absolute z-50 px-3 py-1.5
            bg-slate-800/95 backdrop-blur-sm
            text-slate-200 text-xs font-medium
            rounded-lg shadow-xl
            border border-slate-700/50
            whitespace-nowrap
            pointer-events-none
            animate-fade-in
            -top-10 left-1/2 -translate-x-1/2
          "
          role="tooltip"
        >
          {absoluteTime}
          {/* Tooltip arrow */}
          <div
            className="
              absolute -bottom-1 left-1/2 -translate-x-1/2
              w-2 h-2 rotate-45
              bg-slate-800/95 border-r border-b border-slate-700/50
            "
          />
        </div>
      )}
    </div>
  );
}

/**
 * Day divider component for message grouping
 */
export interface DayDividerProps {
  /** Date for the divider */
  date: string | Date;

  /** Additional CSS classes */
  className?: string;
}

export function DayDivider({ date, className = '' }: DayDividerProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  let label = '';
  if (diffDays === 0) label = 'Hoy';
  else if (diffDays === 1) label = 'Ayer';
  else if (diffDays < 7) {
    label = dateObj.toLocaleDateString('es-MX', { weekday: 'long' });
  } else {
    label = dateObj.toLocaleDateString('es-MX', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div
      className={`
        flex items-center gap-3 my-6
        ${className}
      `}
      role="separator"
      aria-label={`Messages from ${label}`}
    >
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      <time
        dateTime={typeof date === 'string' ? date : date.toISOString()}
        className="
          text-xs font-medium text-slate-400/80
          px-3 py-1
          bg-slate-800/30 backdrop-blur-sm
          border border-slate-700/30
          rounded-full
          shadow-sm
        "
      >
        {label}
      </time>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
    </div>
  );
}

/**
 * Typing timestamp - shows when someone started typing
 */
export interface TypingTimestampProps {
  /** When typing started */
  startTime: Date;

  /** User/assistant name */
  name?: string;
}

export function TypingTimestamp({ startTime, name = 'Free Intelligence' }: TypingTimestampProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="text-xs text-slate-400/60 italic animate-pulse">
      {name} está escribiendo
      {elapsed > 3 && <span className="ml-1">({elapsed}s)</span>}
    </div>
  );
}
