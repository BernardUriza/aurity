'use client';

/**
 * ChatMessagesContent - Single Responsibility: Content state rendering
 *
 * SOLID Principles:
 * - S: Only decides which content state to render (loading/empty/messages)
 * - O: Accepts custom components for each state
 * - L: All state components can be substituted
 * - D: Depends on abstractions (components as props)
 */

import { memo, type ReactNode } from 'react';
import type { FIMessage } from '@/types/assistant';
import type { ChatConfig } from '@/config/chat.config';
import { ChatEmptyState } from '../ChatEmptyState';
import { ChatLoadingState } from '../ChatLoadingState';
import { ChatMessageList } from '../ChatMessageList';
import { ChatLegalDisclaimer } from '../ChatLegalDisclaimer';

export interface ChatMessagesContentProps {
  /** Messages to display */
  messages: FIMessage[];
  /** Is assistant typing */
  isTyping: boolean;
  /** Is loading initial messages */
  loadingInitial: boolean;
  /** Chat configuration */
  config: ChatConfig;
  /** User name for empty state */
  userName?: string;
  /** Show legal disclaimer */
  showLegalDisclaimer?: boolean;
  /** Custom loading component */
  LoadingComponent?: ReactNode;
  /** Custom empty component */
  EmptyComponent?: ReactNode;
}

export const ChatMessagesContent = memo(function ChatMessagesContent({
  messages,
  isTyping,
  loadingInitial,
  config,
  userName,
  showLegalDisclaimer = true,
  LoadingComponent,
  EmptyComponent,
}: ChatMessagesContentProps) {
  // Determine current state
  const isLoading = loadingInitial && messages.length === 0;
  const isEmpty = messages.length === 0 && !isTyping;
  const hasMessages = messages.length > 0 || isTyping;

  return (
    <div
      className="relative space-y-4"
      style={{
        zIndex: 10,
        maxWidth: '100%',
        wordWrap: 'break-word',
      }}
    >
      {isLoading ? (
        // LOADING STATE
        LoadingComponent ?? <ChatLoadingState />
      ) : isEmpty ? (
        // EMPTY STATE
        EmptyComponent ?? <ChatEmptyState userName={userName} />
      ) : (
        // MESSAGES LIST
        <>
          <ChatMessageList
            messages={messages}
            isTyping={isTyping}
            config={config}
          />

          {/* Legal Disclaimer */}
          {showLegalDisclaimer && hasMessages && (
            <ChatLegalDisclaimer shouldShow={true} />
          )}
        </>
      )}
    </div>
  );
});
