'use client';

/**
 * ChatWidgetMessages Component - BRUTAL REDESIGN (2024)
 *
 * Implements industry best practices:
 * - 4pt grid system (spacing in multiples of 4)
 * - Generous whitespace (20px top/bottom, 16px sides)
 * - WCAG 2.1 Level AA accessibility (4.5:1 contrast)
 * - ARIA live regions for screen readers
 * - Semantic HTML with proper roles
 * - Keyboard navigation support
 *
 * References:
 * - bricxlabs.com/blogs/message-screen-ui-deisgn
 * - cometchat.com/blog/chat-app-design-best-practices
 * - WCAG 2.1 Guidelines (POUR principles)
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
  const liveRegionRef = useRef<HTMLDivElement>(null);

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

  // Announce new messages to screen readers
  useEffect(() => {
    if (messages.length > 0 && liveRegionRef.current) {
      const lastMessage = messages[messages.length - 1];
      const announcement = lastMessage.role === 'user'
        ? 'Mensaje enviado'
        : 'Nuevo mensaje del asistente';
      liveRegionRef.current.textContent = announcement;
    }
  }, [messages.length]);

  return (
    <div
      ref={scrollContainerRef}
      id={containerId}
      onScroll={handleScroll}
      role="log"
      aria-label="Historial de mensajes del chat"
      aria-live="polite"
      aria-atomic="false"
      className={`
        relative flex-1
        px-4 pt-5 pb-5
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

      {/* Loading older messages indicator */}
      {loadingOlder && (
        <div
          className="flex justify-center py-4 mb-6"
          role="status"
          aria-label="Cargando mensajes anteriores"
        >
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div
              className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"
              aria-hidden="true"
            />
            <span>Cargando mensajes anteriores...</span>
          </div>
        </div>
      )}

      {/* Messages content - Following 4pt grid system */}
      <div
        className="relative space-y-4"
        style={{
          zIndex: 10,
          maxWidth: '100%',
          wordWrap: 'break-word',
        }}
      >
        {loadingInitial && messages.length === 0 ? (
          /* Loading Initial State - Skeleton with better padding */
          <div
            className="flex items-center justify-center min-h-[200px] px-8"
            role="status"
            aria-label="Cargando conversación"
          >
            <div className="text-center text-slate-400 text-sm w-full max-w-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-3 bg-slate-700/50 rounded-lg w-3/4 mx-auto"></div>
                <div className="h-3 bg-slate-700/50 rounded-lg w-1/2 mx-auto"></div>
                <div className="h-3 bg-slate-700/50 rounded-lg w-5/6 mx-auto"></div>
              </div>
              <p className="mt-6 text-xs text-slate-500">Cargando conversación...</p>
            </div>
          </div>
        ) : messages.length === 0 && !isTyping ? (
          /* Empty State - More engaging and informative */
          <div
            className="flex items-center justify-center min-h-[300px] px-8"
            role="status"
            aria-label="Sin mensajes"
          >
            <div className="text-center max-w-sm space-y-6">
              {/* Icon/Emoji */}
              <div className="text-6xl opacity-80" aria-hidden="true">
                💬
              </div>

              {/* Welcome Text */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-200">
                  Hola {userName || 'Doctor'} 👋
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Soy tu asistente de Free Intelligence. Puedo ayudarte con:
                </p>
              </div>

              {/* Features List - 4pt spacing */}
              <ul className="text-left text-sm text-slate-500 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-0.5" aria-hidden="true">✓</span>
                  <span>Consultas sobre pacientes y expedientes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-0.5" aria-hidden="true">✓</span>
                  <span>Generación de notas clínicas (SOAP)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 mt-0.5" aria-hidden="true">✓</span>
                  <span>Análisis de datos médicos</span>
                </li>
              </ul>

              {/* CTA Text */}
              <p className="text-xs text-slate-600 italic pt-2">
                Escribe tu pregunta abajo para comenzar...
              </p>
            </div>
          </div>
        ) : (
          /* Messages List - Generous spacing (following 4pt grid) */
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

              // Better spacing: 4px for grouped, 16px for ungrouped (4pt grid)
              const messageSpacing = isGrouped ? 'mt-1' : 'mt-4';

              return (
                <div key={idx} className={messageSpacing}>
                  {/* Day Divider with better spacing */}
                  {showDayDivider && (
                    <div className="mb-6">
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
              <div className="mt-4" role="status" aria-label="El asistente está escribiendo">
                <FITypingIndicator show={isTyping} />
              </div>
            )}

            {/* Legal Disclaimer - Better spacing and presentation (4pt grid) */}
            {messages.length > 0 && (
              <div
                className="mt-12 pt-6 border-t border-slate-700/50"
                role="contentinfo"
                aria-label="Información legal"
              >
                <div className="px-4 py-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <div className="text-xs text-slate-400 leading-relaxed space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-base" aria-hidden="true">⚕️</span>
                      <p className="font-semibold text-slate-300">
                        Aviso Legal y Protección de Datos
                      </p>
                    </div>

                    {/* Main Content */}
                    <p className="text-slate-400">
                      Esta aplicación cumple con estándares de protección de información
                      de salud (HIPAA). Los datos permanecen en tu infraestructura local
                      y no se transmiten a la nube. Como asistente de IA, no tengo acceso
                      directo a PHI sin tu autorización explícita.
                    </p>

                    {/* Footer Note */}
                    <p className="text-slate-500 text-[11px]">
                      Si necesitas más información sobre privacidad, consulta la política
                      de tu institución.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom padding for scroll comfort (20px = 4pt grid) */}
      <div className="h-5" aria-hidden="true" />
    </div>
  );
}
