'use client';

/**
 * ChatMessageList Component
 *
 * Renders list of messages with day dividers and message grouping
 * Handles message bubbles rendering and spacing (4pt grid system)
 */

import type { FIMessage } from '@/types/assistant';
import { FIMessageBubble } from '../onboarding/FIMessageBubble';
import { UserMessageBubble } from './UserMessageBubble';
import { FITypingIndicator } from '../onboarding/FITypingIndicator';
import { DayDivider } from './MessageTimestamp';
import { shouldGroupMessages } from '@/lib/chat/timestamp';
import type { ChatConfig } from '@/config/chat.config';
import { spacing, a11yLabels } from '@/config/chat-messages.config';

export interface ChatMessageListProps {
  /** Messages to display */
  messages: FIMessage[];

  /** Is assistant typing? */
  isTyping: boolean;

  /** Chat configuration */
  config: ChatConfig;
}

export function ChatMessageList({ messages, isTyping, config }: ChatMessageListProps) {
  return (
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

        // Spacing: 4px for grouped, 16px for ungrouped (4pt grid)
        const messageSpacing = isGrouped
          ? spacing.messages.grouped
          : spacing.messages.ungrouped;

        return (
          <div key={idx} className={messageSpacing}>
            {/* Day Divider with better spacing */}
            {showDayDivider && (
              <div className={spacing.messages.dayDivider}>
                <DayDivider date={msg.timestamp} />
              </div>
            )}

            {/* Message Bubble - User or Assistant */}
            {msg.role === 'user' ? (
              <UserMessageBubble
                message={msg}
                showTimestamp={!isGrouped}
                timestampConfig={config.timestamp}
                animate={config.animation.entrance.enabled}
                className={isGrouped ? '' : 'mb-2'}
              />
            ) : (
              <FIMessageBubble
                message={msg}
                showTimestamp={!isGrouped}
                timestampConfig={config.timestamp}
                animate={config.animation.entrance.enabled}
                className={isGrouped ? '' : 'mb-2'}
              />
            )}
          </div>
        );
      })}

      {/* Typing Indicator with proper spacing */}
      {isTyping && (
        <div
          className={spacing.sections.typingIndicator}
          role="status"
          aria-label={a11yLabels.typingIndicator}
        >
          <FITypingIndicator show={isTyping} />
        </div>
      )}
    </>
  );
}
