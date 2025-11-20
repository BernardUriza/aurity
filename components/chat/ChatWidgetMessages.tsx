'use client';

/**
 * ChatWidgetMessages Component - MODULAR REDESIGN (2024)
 *
 * Main container for chat messages with:
 * - Modular sub-components (EmptyState, LoadingState, MessageList, LegalDisclaimer)
 * - Centralized configuration (config/chat-messages.config.ts)
 * - 4pt grid system (spacing in multiples of 4)
 * - WCAG 2.1 Level AA accessibility
 * - ARIA live regions for screen readers
 * - Keyboard navigation support
 *
 * References:
 * - bricxlabs.com/blogs/message-screen-ui-deisgn
 * - cometchat.com/blog/chat-app-design-best-practices
 * - WCAG 2.1 Guidelines (POUR principles)
 */

import { useRef, useCallback, useEffect } from 'react';
import type { FIMessage } from '@/types/assistant';
import type { ChatConfig } from '@/config/chat.config';
import type { ChatViewMode } from './ChatWidgetContainer';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatLoadingState, LoadOlderMessagesIndicator } from './ChatLoadingState';
import { ChatMessageList } from './ChatMessageList';
import { ChatLegalDisclaimer } from './ChatLegalDisclaimer';
import { spacing, a11yLabels } from '@/config/chat-messages.config';

export interface ChatWidgetMessagesProps {
  /** Messages to display */
  messages: FIMessage[];

  /** Is assistant typing */
  isTyping: boolean;

  /** Loading initial conversation from storage/backend */
  loadingInitial?: boolean;

  /** Configuration */
  config: ChatConfig;

  /** Container ID for scroll */
  containerId?: string;

  /** User name for empty state */
  userName?: string;

  /** View mode (for watermark display) */
  mode?: ChatViewMode;

  /** Infinite scroll: load older messages */
  onLoadOlder?: () => void;

  /** Infinite scroll: is loading older messages? */
  loadingOlder?: boolean;

  /** Infinite scroll: are there more messages to load? */
  hasMoreMessages?: boolean;
}

export function ChatWidgetMessages({
  messages,
  isTyping,
  loadingInitial = false,
  config,
  containerId = 'chat-widget-messages',
  userName,
  mode = 'normal',
  onLoadOlder,
  loadingOlder = false,
  hasMoreMessages = false,
}: ChatWidgetMessagesProps) {
  const showWatermark = mode === 'fullscreen';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number>(0);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Handle scroll to detect when user reaches top (infinite scroll)
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = e.currentTarget;

      // If scrolled to top and there are more messages, load them
      if (scrollTop <= 100 && !loadingOlder && hasMoreMessages && onLoadOlder) {
        // Store current scroll height to restore position after loading
        if (scrollContainerRef.current) {
          previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
        }
        onLoadOlder();
      }
    },
    [loadingOlder, hasMoreMessages, onLoadOlder]
  );

  // Restore scroll position after loading older messages
  useEffect(() => {
    if (!loadingOlder && scrollContainerRef.current && previousScrollHeightRef.current > 0) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
      if (scrollDiff > 0) {
        scrollContainerRef.current.scrollTop = scrollDiff;
        previousScrollHeightRef.current = 0;
      }
    }
  }, [loadingOlder]);

  // Announce new messages to screen readers
  useEffect(() => {
    if (messages.length > 0 && liveRegionRef.current) {
      const lastMessage = messages[messages.length - 1];
      const announcement =
        lastMessage.role === 'user'
          ? a11yLabels.newMessageAnnouncement.user
          : a11yLabels.newMessageAnnouncement.assistant;
      liveRegionRef.current.textContent = announcement;
    }
  }, [messages]);

  // Determine if legal disclaimer should show (when there are messages)
  const shouldShowLegalDisclaimer = messages.length > 0;

  return (
    <div
      ref={scrollContainerRef}
      id={containerId}
      onScroll={handleScroll}
      role="log"
      aria-label={a11yLabels.messagesContainer}
      aria-live="polite"
      aria-atomic="false"
      className={`
        relative flex-1
        ${spacing.container.horizontal}
        ${spacing.container.top}
        ${spacing.container.bottom}
        ${config.theme.background.body}
      `}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: '#334155 #0f172a',
        backgroundColor: showWatermark ? 'rgba(2, 6, 23, 0.85)' : undefined,
      }}
      tabIndex={0}
    >
      {/* ARIA Live Region for Screen Readers (invisible) */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Watermark - FIXED position, always present */}
      {showWatermark && (
        <div
          aria-hidden="true"
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

      {/* Loading Older Messages Indicator */}
      <LoadOlderMessagesIndicator isLoading={loadingOlder} />

      {/* Messages Content - Following 4pt grid system */}
      <div
        className="relative space-y-4"
        style={{
          zIndex: 10,
          maxWidth: '100%',
          wordWrap: 'break-word',
        }}
      >
        {/* LOADING STATE */}
        {loadingInitial && messages.length === 0 ? (
          <ChatLoadingState />
        ) : /* EMPTY STATE */
        messages.length === 0 && !isTyping ? (
          <ChatEmptyState userName={userName} />
        ) : (
          /* MESSAGES LIST */
          <>
            <ChatMessageList
              messages={messages}
              isTyping={isTyping}
              config={config}
            />

            {/* Legal Disclaimer - Ephemeral (15s timer) */}
            <ChatLegalDisclaimer shouldShow={shouldShowLegalDisclaimer} />
          </>
        )}
      </div>

      {/* Bottom padding for scroll comfort (20px = 4pt grid) */}
      <div className="h-5" aria-hidden="true" />
    </div>
  );
}
