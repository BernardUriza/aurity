'use client';

/**
 * ScrollToBottomFAB - Single Responsibility: Scroll navigation FAB
 *
 * SOLID Principles:
 * - S: Only handles scroll-to-bottom button with unread badge
 * - O: Extensible via className and badge customization
 * - I: Minimal focused interface
 */

import { memo } from 'react';
import { ArrowDown } from 'lucide-react';

export interface ScrollToBottomFABProps {
  /** Click handler */
  onClick: (e: React.MouseEvent) => void;
  /** Number of unread messages (0 = no badge) */
  unreadCount?: number;
  /** Is button visible? */
  visible: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const ScrollToBottomFAB = memo(function ScrollToBottomFAB({
  onClick,
  unreadCount = 0,
  visible,
  className = '',
}: ScrollToBottomFABProps) {
  if (!visible) return null;

  const hasUnread = unreadCount > 0;
  const ariaLabel = hasUnread ? `${unreadCount} mensajes nuevos` : 'Ir al final';
  const title = hasUnread ? `${unreadCount} nuevos` : 'Ir al final';

  return (
    <button
      onClick={onClick}
      className={`
        sticky bottom-4 left-1/2 -translate-x-1/2
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
      aria-label={ariaLabel}
      title={title}
    >
      <ArrowDown className="w-4 h-4" />

      {/* Unread messages badge */}
      {hasUnread && (
        <span
          className="
            absolute -top-1 -right-1
            min-w-5 h-5 px-1
            bg-purple-500 text-white
            text-xs font-bold
            rounded-full
            flex items-center justify-center
            animate-pulse
          "
          aria-hidden="true"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
});
