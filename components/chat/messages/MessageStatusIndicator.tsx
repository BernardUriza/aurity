'use client';

/**
 * MessageStatusIndicator - Shows message delivery status
 *
 * States:
 * - sending: Animated spinner
 * - sent: Checkmark (or hidden)
 * - failed: Error with retry button
 *
 * SOLID: Single responsibility - only displays status
 */

import { memo } from 'react';
import { Check, CheckCheck, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import type { MessageStatus } from '@/hooks/useOptimisticMessages';

export interface MessageStatusIndicatorProps {
  /** Current status */
  status: MessageStatus;
  /** Error message (for failed state) */
  error?: string;
  /** Retry callback (for failed state) */
  onRetry?: () => void;
  /** Dismiss callback (for failed state) */
  onDismiss?: () => void;
  /** Show status for sent messages */
  showSentStatus?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

export const MessageStatusIndicator = memo(function MessageStatusIndicator({
  status,
  error,
  onRetry,
  onDismiss,
  showSentStatus = false,
  size = 'sm',
}: MessageStatusIndicatorProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  // Sending state - animated spinner
  if (status === 'sending') {
    return (
      <div className={`flex items-center gap-1 text-slate-400 ${textSize}`}>
        <Loader2 className={`${iconSize} animate-spin`} />
        <span className="opacity-70">Enviando...</span>
      </div>
    );
  }

  // Failed state - error with retry
  if (status === 'failed') {
    return (
      <div className="flex flex-col gap-1">
        <div className={`flex items-center gap-1 text-red-400 ${textSize}`}>
          <AlertCircle className={iconSize} />
          <span>{error || 'Error al enviar'}</span>
        </div>

        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`
                flex items-center gap-1
                text-red-400 hover:text-red-300
                ${textSize} font-medium
                transition-colors
              `}
              aria-label="Reintentar envío"
            >
              <RotateCcw className={iconSize} />
              Reintentar
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`
                text-slate-500 hover:text-slate-400
                ${textSize}
                transition-colors
              `}
              aria-label="Descartar mensaje"
            >
              Descartar
            </button>
          )}
        </div>
      </div>
    );
  }

  // Sent state - optional checkmark
  if (status === 'sent' && showSentStatus) {
    return (
      <div className={`flex items-center gap-1 text-slate-500 ${textSize}`}>
        <CheckCheck className={iconSize} />
      </div>
    );
  }

  // Default: no indicator
  return null;
});
