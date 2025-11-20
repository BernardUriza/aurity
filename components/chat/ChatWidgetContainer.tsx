'use client';

/**
 * ChatWidgetContainer Component
 *
 * Container that handles different view modes:
 * - normal: Floating widget (bottom-right)
 * - fullscreen: Takes entire viewport
 * - minimized: Compact bar
 */

import { MessageCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';

export type ChatViewMode = 'normal' | 'fullscreen' | 'minimized';

export interface ChatWidgetContainerProps {
  /** Current view mode */
  mode: ChatViewMode;

  /** Widget title (for minimized view) */
  title: string;

  /** Children (header, messages, input) */
  children: ReactNode;

  /** Callbacks */
  onModeChange: (mode: ChatViewMode) => void;
}

export function ChatWidgetContainer({
  mode,
  title,
  children,
  onModeChange,
}: ChatWidgetContainerProps) {
  // ========================================================================
  // MINIMIZED VIEW
  // ========================================================================
  if (mode === 'minimized') {
    return (
      <div
        className="
          fixed bottom-6 right-6
          bg-slate-800 border border-slate-700
          rounded-xl shadow-2xl
          z-50
          flex items-center gap-3
          px-4 py-3
          hover:bg-slate-750
          transition-all duration-200
          cursor-pointer
          group
        "
        onClick={() => onModeChange('normal')}
      >
        {/* Icon */}
        <MessageCircle className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />

        {/* Title */}
        <span className="text-sm font-medium text-white">{title}</span>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onModeChange('normal'); // or handle close differently
          }}
          className="ml-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Expand chat"
        >
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        </button>
      </div>
    );
  }

  // ========================================================================
  // FULLSCREEN VIEW
  // ========================================================================
  if (mode === 'fullscreen') {
    return (
      <div
        className="
          fixed inset-0
          bg-slate-900
          z-50
          flex flex-col
          overflow-hidden
          animate-scale-in
        "
      >
        {children}
      </div>
    );
  }

  // ========================================================================
  // NORMAL VIEW (floating widget)
  // ========================================================================
  return (
    <div
      className="
        fixed bottom-6 right-6
        w-96 h-[600px]
        bg-slate-900 border border-slate-700
        rounded-2xl shadow-2xl
        z-50
        flex flex-col
        overflow-hidden
        animate-slide-in-up
      "
    >
      {children}
    </div>
  );
}
