'use client';

/**
 * ChatWidgetHeader Component
 *
 * Header for chat widget with title, subtitle, and control buttons
 * (minimize, fullscreen, close)
 */

import Link from 'next/link';
import { X, Minimize2, Maximize2, MessageCircle, Search } from 'lucide-react';

export interface ChatWidgetHeaderProps {
  /** Widget title */
  title: string;

  /** Widget subtitle */
  subtitle?: string;

  /** Background gradient classes */
  backgroundClass?: string;

  /** Current view mode */
  mode: 'normal' | 'minimized' | 'fullscreen';

  /** Show control buttons (minimize, maximize, close) - defaults to true */
  showControls?: boolean;

  /** Show history search button */
  showHistorySearch?: boolean;

  /** Callbacks */
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onHistorySearch?: () => void;
}

export function ChatWidgetHeader({
  title,
  subtitle,
  backgroundClass = 'bg-gradient-to-r from-purple-600 to-blue-600',
  mode,
  showControls = true,
  showHistorySearch = true,
  onMinimize,
  onMaximize,
  onClose,
  onHistorySearch,
}: ChatWidgetHeaderProps) {
  return (
    <div className={`${backgroundClass} px-4 py-3 flex items-center justify-between flex-shrink-0`}>
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/chat"
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-colors cursor-pointer"
          title="Abrir chat completo"
        >
          <MessageCircle className="h-5 w-5 text-white" />
        </Link>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-purple-200 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Control Buttons */}
      {showControls && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* History Search */}
          {showHistorySearch && onHistorySearch && mode !== 'minimized' && (
            <button
              onClick={onHistorySearch}
              className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              aria-label="Search history"
              title="Buscar en historial"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Minimize/Restore */}
          {mode !== 'minimized' && (
            <button
              onClick={onMinimize}
              className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              aria-label="Minimize"
              title="Minimizar"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}

          {/* Expand/Normal */}
          {mode !== 'minimized' && (
            <button
              onClick={onMaximize}
              className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              aria-label={mode === 'expanded' ? 'Restaurar tamaño' : 'Expandir'}
              title={mode === 'expanded' ? 'Restaurar tamaño' : 'Expandir (60% más grande)'}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
            aria-label="Close"
            title="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
