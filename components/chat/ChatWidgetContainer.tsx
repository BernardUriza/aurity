'use client';

/**
 * ChatWidgetContainer Component
 *
 * Container that handles different view modes with responsive breakpoints:
 * - normal: Floating widget (bottom-right)
 * - fullscreen: Takes entire viewport
 * - minimized: Compact bar
 * - expanded: Large modal view
 *
 * Responsive behavior:
 * - Mobile (<640px): Auto fullscreen when open
 * - Tablet (640-1024px): Modal at 90% viewport
 * - Desktop (>1024px): Fixed widget 384×600px
 */

import { MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { CHAT_BREAKPOINTS } from '@/config/chat.config';

export type ChatViewMode = 'normal' | 'fullscreen' | 'minimized' | 'expanded';

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
  // Detect device breakpoints
  const { isMobile, isTablet, isDesktop } = useBreakpoints(CHAT_BREAKPOINTS, {
    ssrMatch: false, // Assume desktop on server to avoid hydration flash
  });

  // Compute effective mode based on breakpoint + user preference
  // Mobile: force fullscreen when not minimized
  // Tablet: use expanded mode for better UX
  // Desktop: respect user's chosen mode
  const effectiveMode: ChatViewMode =
    mode === 'minimized'
      ? 'minimized'
      : isMobile
        ? 'fullscreen'
        : isTablet && (mode === 'normal' || mode === 'expanded')
          ? 'expanded'
          : mode;

  // ========================================================================
  // MINIMIZED VIEW
  // ========================================================================
  if (effectiveMode === 'minimized') {
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
  // EXPANDED VIEW (responsive: tablet modal, desktop large widget)
  // ========================================================================
  if (effectiveMode === 'expanded') {
    // Tablet: large modal with backdrop
    if (isTablet) {
      return (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => onModeChange('normal')}
          />
          {/* Modal */}
          <div
            className="
              fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              bg-slate-900 border border-slate-700
              rounded-2xl shadow-2xl
              z-50
              flex flex-col
              overflow-hidden
              animate-scale-in
              transition-all duration-300
            "
            style={{
              width: 'min(90vw, 900px)',
              height: 'min(90vh, 800px)',
            }}
          >
            {children}
          </div>
        </>
      );
    }

    // Desktop: large bottom-right widget
    return (
      <div
        className="
          fixed bottom-6 right-6
          bg-slate-900 border border-slate-700
          rounded-2xl shadow-2xl
          z-50
          flex flex-col
          overflow-hidden
          animate-scale-in
          transition-all duration-300
        "
        style={{
          width: 'min(80vw, 1200px)',
          height: '700px',
          maxWidth: 'calc(100vw - 3rem)',
          maxHeight: 'calc(100vh - 3rem)',
        }}
      >
        {children}
      </div>
    );
  }

  // ========================================================================
  // FULLSCREEN VIEW (mobile automatic)
  // ========================================================================
  if (effectiveMode === 'fullscreen') {
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
  // NORMAL VIEW (desktop floating widget)
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
