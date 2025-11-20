'use client';

/**
 * ChatLoadingState Component
 *
 * Loading skeleton for initial chat load
 * Better contrast for accessibility (WCAG 2.1 Level AA)
 */

import { loadingStateConfig, a11yLabels } from '@/config/chat-messages.config';

export function ChatLoadingState() {
  return (
    <div
      className="flex items-center justify-center min-h-[200px] px-8"
      role="status"
      aria-label={a11yLabels.loadingConversation}
    >
      <div className="text-center text-slate-400 text-sm w-full max-w-sm">
        {/* Skeleton Bars */}
        <div className="animate-pulse space-y-4">
          {loadingStateConfig.skeletonBars.map((bar, idx) => (
            <div
              key={idx}
              className="h-3 bg-slate-700/50 rounded-lg mx-auto"
              style={{ width: bar.width }}
            />
          ))}
        </div>

        {/* Loading Text */}
        <p className="mt-6 text-xs text-slate-500">
          {loadingStateConfig.loadingText}
        </p>
      </div>
    </div>
  );
}

/**
 * LoadOlderMessagesIndicator Component
 *
 * Indicator shown at top of messages when loading older messages
 */
export interface LoadOlderMessagesIndicatorProps {
  /** Is currently loading older messages? */
  isLoading: boolean;
}

export function LoadOlderMessagesIndicator({ isLoading }: LoadOlderMessagesIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div
      className="flex justify-center py-4 mb-6"
      role="status"
      aria-label={a11yLabels.loadingOlderMessages}
    >
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <div
          className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"
          aria-hidden="true"
        />
        <span>{loadingStateConfig.loadOlderText}</span>
      </div>
    </div>
  );
}
