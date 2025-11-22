'use client';

/**
 * Chat Utility Components
 *
 * Practical, mundane but essential UX improvements:
 * - Scroll to bottom button
 * - Auto-resize textarea
 * - Character counter
 * - Loading states
 * - Error states with retry
 */

import { useState, useEffect, useRef, type TextareaHTMLAttributes } from 'react';
import { ArrowDown, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

// ============================================================================
// SCROLL TO BOTTOM BUTTON
// ============================================================================

export interface ScrollToBottomButtonProps {
  /** Container element to scroll */
  containerId: string;

  /** Show button when scrolled up by this many pixels */
  threshold?: number;

  /** Additional CSS classes */
  className?: string;
}

export function ScrollToBottomButton({
  containerId,
  threshold = 100,
  className = '',
}: ScrollToBottomButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Show button if scrolled up beyond threshold
      setIsVisible(distanceFromBottom > threshold);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerId, threshold]);

  const scrollToBottom = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const container = document.getElementById(containerId);
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });

    setUnreadCount(0);
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToBottom}
      className={`
        absolute bottom-4 left-1/2 -translate-x-1/2
        w-10 h-10
        bg-slate-800/90 backdrop-blur-sm
        hover:bg-slate-700/90
        border border-slate-600/50
        text-slate-300 hover:text-white
        rounded-full
        shadow-lg hover:shadow-xl
        transition-all duration-200
        flex items-center justify-center
        z-40
        ${className}
      `}
      aria-label="Scroll to bottom"
      title="Ir al final"
    >
      <ArrowDown className="w-4 h-4" />

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <span className="
          absolute -top-1 -right-1
          w-5 h-5 rounded-full
          bg-red-500 text-white
          text-xs font-bold
          flex items-center justify-center
        ">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// AUTO-RESIZE TEXTAREA
// ============================================================================

export interface AutoResizeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Max rows before scrolling */
  maxRows?: number;

  /** Show character counter */
  showCounter?: boolean;

  /** Max characters */
  maxLength?: number;

  /** Additional wrapper CSS classes */
  wrapperClassName?: string;
}

export function AutoResizeTextarea({
  value,
  onChange,
  maxRows = 5,
  showCounter = false,
  maxLength,
  wrapperClassName = '',
  className = '',
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  // Auto-resize on content change
  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = 'auto';

    const lineHeight = 20; // Approximate line height
    const newRows = Math.min(
      Math.ceil(textarea.scrollHeight / lineHeight),
      maxRows
    );

    setRows(newRows);
    textarea.style.height = `${newRows * lineHeight}px`;
  }, [value, maxRows]);

  const charCount = typeof value === 'string' ? value.length : 0;
  const isNearLimit = maxLength && charCount > maxLength * 0.9;
  const isOverLimit = maxLength && charCount > maxLength;

  return (
    <div className={`relative ${wrapperClassName}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className={`
          resize-none
          ${className}
        `}
        rows={rows}
        {...props}
      />

      {/* Character counter */}
      {showCounter && maxLength && (
        <div className={`
          absolute bottom-2 right-2
          text-xs font-mono
          transition-colors
          ${isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-slate-500'}
        `}>
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MESSAGE LOADING STATE
// ============================================================================

export function MessageLoadingState({ text = 'Enviando...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}

// ============================================================================
// MESSAGE ERROR STATE
// ============================================================================

export interface MessageErrorStateProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function MessageErrorState({ error, onRetry, onDismiss }: MessageErrorStateProps) {
  return (
    <div className="
      flex items-start gap-3
      p-3 rounded-lg
      bg-red-950/20 border border-red-800/40
      text-sm
    ">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />

      <div className="flex-1">
        <p className="text-red-300 font-medium mb-1">Error al enviar mensaje</p>
        <p className="text-red-400/80 text-xs">{error}</p>
      </div>

      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="
              px-3 py-1.5 rounded
              bg-red-600 hover:bg-red-700
              text-white text-xs font-medium
              transition-colors
              flex items-center gap-1.5
            "
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="
              px-2 py-1.5 rounded
              text-red-400 hover:text-red-300
              text-xs
              transition-colors
            "
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON LOADING (for messages)
// ============================================================================

export function MessageSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 animate-pulse"
        >
          <div className="
            flex-1 max-w-[85%]
            p-4 rounded-2xl rounded-tl-sm
            bg-slate-800/30 border border-slate-700/30
          ">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-32 bg-slate-700/50 rounded" />
              <div className="h-3 w-4 bg-slate-700/50 rounded" />
            </div>

            {/* Content lines */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-700/30 rounded" />
              <div className="h-3 w-5/6 bg-slate-700/30 rounded" />
              <div className="h-3 w-4/6 bg-slate-700/30 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="
      flex flex-col items-center justify-center
      text-center
      py-12 px-4
    ">
      {icon && (
        <div className="mb-4 text-slate-600">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-medium text-slate-300 mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="
            px-4 py-2 rounded-lg
            bg-gradient-to-r from-purple-600 to-blue-600
            hover:from-purple-700 hover:to-blue-700
            text-white text-sm font-medium
            transition-all
          "
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
