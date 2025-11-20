'use client';

/**
 * ChatWidgetMessages Component
 *
 * Messages container with day dividers, grouping, scroll handling, and infinite scroll
 */

import { useRef, useCallback, useEffect } from 'react';
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

  // Handle scroll to detect when user reaches top
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;

    // If scrolled to top and there are more messages, load them
    if (scrollTop <= 100 && !loadingOlder && hasMoreMessages && onLoadOlder) {
      // Store current scroll height to restore position after loading
      if (scrollContainerRef.current) {
        previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      }
      onLoadOlder();
    }
  }, [loadingOlder, hasMoreMessages, onLoadOlder]);

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

  return (
    <div
      ref={scrollContainerRef}
      id={containerId}
      onScroll={handleScroll}
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

      {/* Loading older messages indicator */}
      {loadingOlder && (
        <div className="flex justify-center py-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full" />
            <span>Cargando mensajes anteriores...</span>
          </div>
        </div>
      )}

      {/* Messages content */}
      <div className="relative" style={{ zIndex: 10, maxWidth: '100%', wordWrap: 'break-word' }}>
      {loadingInitial && messages.length === 0 ? (
        /* Loading Initial State - Skeleton */
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-400 text-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-2 bg-slate-200 rounded w-3/4 mx-auto"></div>
              <div className="h-2 bg-slate-200 rounded w-1/2 mx-auto"></div>
              <div className="h-2 bg-slate-200 rounded w-5/6 mx-auto"></div>
            </div>
            <p className="mt-4 text-xs">Cargando conversación...</p>
          </div>
        </div>
      ) : messages.length === 0 && !isTyping ? (
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

          {/* Legal Disclaimer - Always at bottom */}
          {messages.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <div className="text-xs text-slate-500 leading-relaxed space-y-2">
                <p className="font-medium text-slate-400">
                  ⚕️ Aviso Legal y Protección de Datos
                </p>
                <p>
                  Esta aplicación cumple con estándares de protección de información de salud (HIPAA).
                  Los datos permanecen en tu infraestructura local y no se transmiten a la nube.
                  Como asistente de IA, no tengo acceso directo a PHI sin tu autorización explícita.
                </p>
                <p className="text-slate-600">
                  Si necesitas más información sobre privacidad, consulta la política de tu institución.
                </p>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
