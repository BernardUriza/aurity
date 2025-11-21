'use client';

/**
 * ChatEmptyState Component
 *
 * Engaging empty state for chat widget showing welcome message and capabilities
 * Follows WCAG 2.1 accessibility guidelines
 */

import { emptyStateConfig, a11yLabels } from '@/config/chat-messages.config';

export interface ChatEmptyStateProps {
  /** User name for personalized greeting */
  userName?: string;
}

export function ChatEmptyState({ userName }: ChatEmptyStateProps) {
  return (
    <div
      className="flex items-center justify-center min-h-[300px] px-8"
      role="status"
      aria-label={a11yLabels.emptyState}
    >
      <div className="text-center max-w-sm space-y-6">
        {/* Icon/Emoji */}
        <div className="text-6xl opacity-80" aria-hidden="true">
          {emptyStateConfig.emoji}
        </div>

        {/* Welcome Text */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-200">
            {emptyStateConfig.welcomeTitle(userName)}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {emptyStateConfig.welcomeSubtitle}
          </p>
        </div>

        {/* Features List - 4pt spacing */}
        <ul className="text-left text-sm text-slate-500 space-y-3">
          {emptyStateConfig.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="text-purple-400 mt-0.5" aria-hidden="true">
                {feature.icon}
              </span>
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>

        {/* CTA Text */}
        <p className="text-xs text-slate-600 italic pt-2">
          {emptyStateConfig.ctaText}
        </p>
      </div>
    </div>
  );
}
