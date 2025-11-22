'use client';

/**
 * UnreadDivider - Shows "X nuevos mensajes" divider
 *
 * Displays a divider indicating where unread messages begin.
 * Similar to Slack's "New messages" divider.
 *
 * SOLID: Single responsibility - only renders unread divider
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface UnreadDividerProps {
  /** Number of unread messages */
  count: number;
  /** Callback when user clicks to scroll to latest */
  onScrollToBottom?: () => void;
  /** Animate entrance */
  animate?: boolean;
}

export const UnreadDivider = memo(function UnreadDivider({
  count,
  onScrollToBottom,
  animate = true,
}: UnreadDividerProps) {
  if (count <= 0) return null;

  const content = (
    <div className="flex items-center justify-center gap-3 py-3">
      {/* Left line */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-500/50 to-red-500/50" />

      {/* Unread pill */}
      <button
        onClick={onScrollToBottom}
        className={`
          flex items-center gap-2
          px-3 py-1.5
          text-xs font-medium
          rounded-full
          bg-red-500/20 text-red-300
          border border-red-500/30
          hover:bg-red-500/30
          transition-colors duration-200
          cursor-pointer
        `}
        aria-label={`${count} mensajes nuevos. Click para ir al más reciente.`}
      >
        <span>
          {count === 1 ? '1 mensaje nuevo' : `${count} mensajes nuevos`}
        </span>
        {onScrollToBottom && (
          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        )}
      </button>

      {/* Right line */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-red-500/50 to-red-500/50" />
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  );
});

// ============================================================================
// HOOK: Track unread messages
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { FIMessage } from '@/types/assistant';

export interface UseUnreadMessagesOptions {
  /** All messages */
  messages: FIMessage[];
  /** ID of the last message the user has read */
  lastReadMessageId?: string | null;
  /** Is the chat currently visible/focused? */
  isVisible?: boolean;
}

export interface UseUnreadMessagesReturn {
  /** Number of unread messages */
  unreadCount: number;
  /** ID of first unread message (for scroll target) */
  firstUnreadId: string | null;
  /** Mark all messages as read */
  markAllAsRead: () => void;
  /** Check if a specific message is unread */
  isUnread: (messageId: string) => boolean;
}

export function useUnreadMessages({
  messages,
  lastReadMessageId = null,
  isVisible = true,
}: UseUnreadMessagesOptions): UseUnreadMessagesReturn {
  // Track the last read message ID
  const [lastReadId, setLastReadId] = useState<string | null>(lastReadMessageId);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Calculate unread count
  const getUnreadInfo = useCallback(() => {
    if (!lastReadId || messages.length === 0) {
      return { unreadCount: 0, firstUnreadId: null };
    }

    const lastReadIndex = messages.findIndex(
      (m) => m.id === lastReadId || m.metadata?.id === lastReadId
    );

    if (lastReadIndex === -1 || lastReadIndex === messages.length - 1) {
      return { unreadCount: 0, firstUnreadId: null };
    }

    const unreadMessages = messages.slice(lastReadIndex + 1);
    // Only count assistant messages as "unread"
    const unreadAssistantMessages = unreadMessages.filter(
      (m) => m.role === 'assistant'
    );

    return {
      unreadCount: unreadAssistantMessages.length,
      firstUnreadId:
        unreadAssistantMessages.length > 0
          ? unreadAssistantMessages[0].id || unreadAssistantMessages[0].metadata?.id || null
          : null,
    };
  }, [messages, lastReadId]);

  const { unreadCount, firstUnreadId } = getUnreadInfo();

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      setLastReadId(lastMessage.id || lastMessage.metadata?.id || null);
    }
  }, [messages]);

  // Auto-mark as read when visible and at bottom
  useEffect(() => {
    if (isVisible && unreadCount > 0) {
      // Auto-mark after a short delay if user is viewing
      const timer = setTimeout(markAllAsRead, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, unreadCount, markAllAsRead]);

  // Check if specific message is unread
  const isUnread = useCallback(
    (messageId: string) => {
      if (!lastReadId) return false;

      const lastReadIndex = messages.findIndex(
        (m) => m.id === lastReadId || m.metadata?.id === lastReadId
      );
      const messageIndex = messages.findIndex(
        (m) => m.id === messageId || m.metadata?.id === messageId
      );

      return messageIndex > lastReadIndex;
    },
    [messages, lastReadId]
  );

  return {
    unreadCount,
    firstUnreadId,
    markAllAsRead,
    isUnread,
  };
}
