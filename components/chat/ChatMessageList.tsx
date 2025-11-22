'use client';

/**
 * ChatMessageList Component v2.0
 *
 * Renders list of messages with:
 * - Intelligent message grouping by sender + time
 * - Date dividers (Today/Yesterday/Date)
 * - Smooth animations with Framer Motion
 * - WhatsApp/Discord-style border radius
 *
 * Uses useMessageGroups hook for optimal grouping logic
 */

import { memo } from 'react';
import type { FIMessage } from '@/types/assistant';
import type { ChatConfig } from '@/config/chat.config';
import { spacing, a11yLabels } from '@/config/chat-messages.config';

// Components
import { FIMessageBubble } from '../onboarding/FIMessageBubble';
import { UserMessageBubble } from './UserMessageBubble';
import { FITypingIndicator } from '../onboarding/FITypingIndicator';
import {
  DateDivider,
  AnimatedMessage,
  AnimatedMessageList,
  TypingIndicator,
} from './messages';

// Hook for message grouping
import {
  useMessageGroups,
  isDateDivider,
  getMessageBorderRadius,
  type ProcessedMessage,
} from '@/hooks/useMessageGroups';

export interface ChatMessageListProps {
  /** Messages to display */
  messages: FIMessage[];
  /** Is assistant typing? */
  isTyping: boolean;
  /** Chat configuration */
  config: ChatConfig;
  /** Use new animation system */
  enableAnimations?: boolean;
  /** Use new grouping system */
  enableSmartGrouping?: boolean;
}

/**
 * ChatMessageList - Renders messages with grouping and animations
 */
export const ChatMessageList = memo(function ChatMessageList({
  messages,
  isTyping,
  config,
  enableAnimations = true,
  enableSmartGrouping = true,
}: ChatMessageListProps) {
  // Use smart grouping hook
  const { items } = useMessageGroups({
    messages,
    groupThresholdMs: (config.behavior.groupThresholdMinutes ?? 1) * 60 * 1000,
    locale: 'es-MX',
  });

  // If smart grouping disabled, use legacy rendering
  if (!enableSmartGrouping) {
    return (
      <LegacyMessageList
        messages={messages}
        isTyping={isTyping}
        config={config}
      />
    );
  }

  return (
    <AnimatedMessageList>
      {items.map((item, idx) => {
        // Render date divider
        if (isDateDivider(item)) {
          return (
            <DateDivider
              key={`divider-${item.date.toISOString()}`}
              label={item.label}
              type={item.dividerType}
              animate={enableAnimations}
            />
          );
        }

        // Render message with animations
        const processedMsg = item as ProcessedMessage;
        const isUser = processedMsg.role === 'user';
        const borderRadiusClass = getMessageBorderRadius(
          processedMsg.position,
          isUser
        );

        return (
          <AnimatedMessage
            key={processedMsg.id}
            messageId={processedMsg.id}
            isUser={isUser}
            variant={enableAnimations ? 'default' : 'none'}
            delay={idx * 0.02} // Stagger effect
          >
            <div
              className={
                processedMsg.endsSequence
                  ? spacing.messages.ungrouped
                  : spacing.messages.grouped
              }
            >
              {isUser ? (
                <UserMessageBubble
                  message={processedMsg}
                  showTimestamp={processedMsg.showTimestamp}
                  timestampConfig={config.timestamp}
                  animate={false} // Let AnimatedMessage handle it
                  borderRadiusOverride={borderRadiusClass}
                />
              ) : (
                <FIMessageBubble
                  message={processedMsg}
                  showTimestamp={processedMsg.showTimestamp}
                  showSenderName={processedMsg.showSenderName}
                  timestampConfig={config.timestamp}
                  animate={false}
                  borderRadiusOverride={borderRadiusClass}
                />
              )}
            </div>
          </AnimatedMessage>
        );
      })}

      {/* Typing Indicator */}
      {isTyping && (
        <div
          className={spacing.sections.typingIndicator}
          role="status"
          aria-label={a11yLabels.typingIndicator}
        >
          {enableAnimations ? (
            <TypingIndicator isTyping={isTyping} size="md" />
          ) : (
            <FITypingIndicator show={isTyping} />
          )}
        </div>
      )}
    </AnimatedMessageList>
  );
});

// ============================================================================
// LEGACY RENDERING (backward compatibility)
// ============================================================================

import { DayDivider } from './MessageTimestamp';
import { shouldGroupMessages } from '@/lib/chat/timestamp';

interface LegacyMessageListProps {
  messages: FIMessage[];
  isTyping: boolean;
  config: ChatConfig;
}

function LegacyMessageList({ messages, isTyping, config }: LegacyMessageListProps) {
  return (
    <>
      {messages.map((msg, idx) => {
        const prevMsg = idx > 0 ? messages[idx - 1] : null;

        const showDayDivider =
          config.behavior.showDayDividers &&
          (!prevMsg ||
            new Date(msg.timestamp).toDateString() !==
              new Date(prevMsg.timestamp).toDateString());

        const isGrouped =
          config.behavior.groupMessages &&
          prevMsg &&
          shouldGroupMessages(
            prevMsg.timestamp,
            msg.timestamp,
            config.behavior.groupThresholdMinutes
          );

        const messageSpacing = isGrouped
          ? spacing.messages.grouped
          : spacing.messages.ungrouped;

        return (
          <div key={msg.id || `legacy-${idx}`} className={messageSpacing}>
            {showDayDivider && (
              <div className={spacing.messages.dayDivider}>
                <DayDivider date={msg.timestamp} />
              </div>
            )}

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
