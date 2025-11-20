'use client';

/**
 * ChatWidgetMessages Component
 *
 * Messages container with day dividers, grouping, and scroll handling
 */

import type { FIMessage } from '@/types/assistant';
import { FIMessageBubble } from '../onboarding/FIMessageBubble';
import { UserMessageBubble } from './UserMessageBubble';
import { FITypingIndicator } from '../onboarding/FITypingIndicator';
import { DayDivider } from './MessageTimestamp';
import { shouldGroupMessages } from '@/lib/chat/timestamp';
import type { ChatConfig } from '@/config/chat.config';
import type { ChatViewMode } from './ChatWidgetContainer';

export interface ChatWidgetMessagesProps {
  /** Messages to display */
  messages: FIMessage[];

  /** Is assistant typing */
  isTyping: boolean;

  /** Configuration */
  config: ChatConfig;

  /** Container ID for scroll */
  containerId?: string;

  /** User name for empty state */
  userName?: string;

  /** View mode (for watermark display) */
  mode?: ChatViewMode;
}

export function ChatWidgetMessages({
  messages,
  isTyping,
  config,
  containerId = 'chat-widget-messages',
  userName,
  mode = 'normal',
}: ChatWidgetMessagesProps) {
  const showWatermark = mode === 'fullscreen';

  return (
    <div
      id={containerId}
      className={`
        relative flex-1 p-4 space-y-2
        ${config.theme.background.body}
      `}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: '#334155 #0f172a',
        backgroundColor: showWatermark ? 'rgba(2, 6, 23, 0.85)' : undefined,
      }}
    >
      {/* Watermark - FIXED position, always present */}
      {showWatermark && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/images/fi.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.06,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Messages content */}
      <div className="relative" style={{ zIndex: 10, maxWidth: '100%', wordWrap: 'break-word' }}>
      {messages.length === 0 && !isTyping ? (
        /* Empty State */
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-500 text-sm">
            Hola {userName || 'Doctor'},<br />
            pregúntame lo que necesites...
          </div>
        </div>
      ) : (
        /* Messages List */
        <>
          {messages.map((msg, idx) => {
            const prevMsg = idx > 0 ? messages[idx - 1] : null;

            // Determine if we should show day divider
            const showDayDivider =
              config.behavior.showDayDividers &&
              (!prevMsg ||
                new Date(msg.timestamp).toDateString() !==
                  new Date(prevMsg.timestamp).toDateString());

            // Determine if messages should be grouped (hide timestamp)
            const isGrouped =
              config.behavior.groupMessages &&
              prevMsg &&
              shouldGroupMessages(
                prevMsg.timestamp,
                msg.timestamp,
                config.behavior.groupThresholdMinutes
              );

            return (
              <div key={idx}>
                {/* Day Divider */}
                {showDayDivider && <DayDivider date={msg.timestamp} />}

                {/* Message Bubble - User or Assistant */}
                {msg.role === 'user' ? (
                  <UserMessageBubble
                    message={msg}
                    showTimestamp={!isGrouped}
                    timestampConfig={config.timestamp}
                    animate={config.animation.entrance.enabled}
                    className={isGrouped ? 'mt-1' : 'mt-4'}
                  />
                ) : (
                  <FIMessageBubble
                    message={msg}
                    showTimestamp={!isGrouped}
                    timestampConfig={config.timestamp}
                    animate={config.animation.entrance.enabled}
                    className={isGrouped ? 'mt-1' : 'mt-4'}
                  />
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && <FITypingIndicator />}
        </>
      )}
      </div>
    </div>
  );
}
