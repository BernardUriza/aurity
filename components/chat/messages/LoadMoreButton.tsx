'use client';

/**
 * LoadMoreButton - Single Responsibility: Pagination trigger
 *
 * SOLID Principles:
 * - S: Only handles "load more" action display and trigger
 * - O: Extensible via className and custom loading content
 * - I: Minimal props interface
 */

import { memo } from 'react';
import { ChevronUp, Loader2 } from 'lucide-react';

export interface LoadMoreButtonProps {
  /** Callback to load older messages */
  onLoadMore: () => void;
  /** Is currently loading? */
  isLoading: boolean;
  /** Custom loading text */
  loadingText?: string;
  /** Custom button text */
  buttonText?: string;
  /** Additional CSS classes */
  className?: string;
}

export const LoadMoreButton = memo(function LoadMoreButton({
  onLoadMore,
  isLoading,
  loadingText = 'Cargando...',
  buttonText = 'Cargar mensajes anteriores',
  className = '',
}: LoadMoreButtonProps) {
  return (
    <div className={`flex justify-center py-3 ${className}`}>
      <button
        onClick={onLoadMore}
        disabled={isLoading}
        className="
          px-4 py-2
          text-xs font-medium
          text-slate-400 hover:text-slate-200
          bg-slate-800/50 hover:bg-slate-700/50
          border border-slate-700/50 hover:border-slate-600/50
          rounded-full
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2
        "
        aria-label={isLoading ? loadingText : buttonText}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            <ChevronUp className="w-3 h-3" />
            {buttonText}
          </>
        )}
      </button>
    </div>
  );
});
