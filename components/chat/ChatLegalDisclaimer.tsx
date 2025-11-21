'use client';

/**
 * ChatLegalDisclaimer Component
 *
 * Ephemeral legal disclaimer that auto-fades after configured time
 * Implements accessibility best practices (WCAG 2.1 Level AA)
 */

import { useEffect, useState } from 'react';
import { legalDisclaimerConfig, a11yLabels } from '@/config/chat-messages.config';

export interface ChatLegalDisclaimerProps {
  /** Should the disclaimer be visible? (controlled externally) */
  shouldShow: boolean;
}

export function ChatLegalDisclaimer({ shouldShow }: ChatLegalDisclaimerProps) {
  const [show, setShow] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Timer for ephemeral behavior
  useEffect(() => {
    if (shouldShow) {
      // Reset states when shouldShow changes
      setShow(true);
      setIsFading(false);

      // Start fade-out animation
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, legalDisclaimerConfig.timer.fadeStartMs);

      // Hide completely
      const hideTimer = setTimeout(() => {
        setShow(false);
      }, legalDisclaimerConfig.timer.hideCompleteMs);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [shouldShow]);

  if (!show) return null;

  return (
    <div
      className={`
        mt-12 pt-6 border-t border-slate-700/50
        transition-opacity duration-1000
        ${isFading ? 'opacity-0' : 'opacity-100'}
      `}
      role="contentinfo"
      aria-label={a11yLabels.legalInfo}
      aria-live="polite"
    >
      <div className="px-4 py-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <div className="text-xs text-slate-400 leading-relaxed space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">
              {legalDisclaimerConfig.emoji}
            </span>
            <p className="font-semibold text-slate-300">
              {legalDisclaimerConfig.title}
            </p>
          </div>

          {/* Main Content */}
          <p className="text-slate-400">
            {legalDisclaimerConfig.mainContent}
          </p>

          {/* Footer Note */}
          <p className="text-slate-500 text-[11px]">
            {legalDisclaimerConfig.footerNote}
          </p>
        </div>
      </div>
    </div>
  );
}
