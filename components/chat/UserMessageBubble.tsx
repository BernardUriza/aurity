'use client';

/**
 * UserMessageBubble Component
 *
 * Message bubble for user messages (aligned right, different style)
 */

import type { FIMessage } from '@/types/assistant';
import { MessageTimestamp } from './MessageTimestamp';
import { CopyButton } from './MessageActions';
import type { TimestampConfig } from '@/config/chat.config';

export interface UserMessageBubbleProps {
  /** Message to display */
  message: FIMessage;

  /** Show timestamp */
  showTimestamp?: boolean;

  /** Timestamp configuration */
  timestampConfig?: Partial<TimestampConfig>;

  /** Animate entrance */
  animate?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Override border radius (for grouped messages) */
  borderRadiusOverride?: string;
}

/**
 * User message bubble (right-aligned, blue gradient)
 */
export function UserMessageBubble({
  message,
  showTimestamp = true,
  timestampConfig,
  animate = true,
  className = '',
  borderRadiusOverride,
}: UserMessageBubbleProps) {
  // Use override or default border radius
  const borderRadius = borderRadiusOverride || 'rounded-2xl rounded-tr-sm';
  return (
    <div
      className={`
        flex items-start gap-3 justify-end
        ${animate ? 'animate-fade-in-up' : ''}
        ${className}
      `}
      role="article"
      aria-label="User message"
    >
      {/* Message Bubble */}
      <div
        className={`
          relative group
          max-w-[85%]
          p-4 ${borderRadius}
          bg-gradient-to-br from-blue-600/20 to-purple-600/20
          border border-blue-500/30
          backdrop-blur-xl
          shadow-lg shadow-blue-500/5
          transition-all duration-300
          hover:shadow-xl hover:shadow-blue-500/10
        `}
      >
        {/* Header: Label + Timestamp + Actions */}
        <div className="flex items-center gap-2 mb-2 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-blue-300">
              TÚ
            </span>
            {showTimestamp && (
              <MessageTimestamp
                timestamp={message.timestamp}
                config={timestampConfig}
                position="inline"
                size="xs"
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <CopyButton content={message.content} size="sm" />
          </div>
        </div>

        {/* Message Content */}
        <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    </div>
  );
}
