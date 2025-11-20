'use client';

/**
 * ChatWidgetHeader Component
 *
 * Header for chat widget with title, subtitle, and control buttons
 * (minimize, fullscreen, close)
 */

import { X, Minimize2, Maximize2, MessageCircle } from 'lucide-react';

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

  /** Callbacks */
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

export function ChatWidgetHeader({
  title,
  subtitle,
  backgroundClass = 'bg-gradient-to-r from-purple-600 to-blue-600',
  mode,
  showControls = true,
  onMinimize,
  onMaximize,
  onClose,
}: ChatWidgetHeaderProps) {
  return (
    <div className={`${backgroundClass} px-4 py-3 flex items-center justify-between flex-shrink-0`}>
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
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

          {/* Fullscreen/Normal */}
          {mode !== 'minimized' && (
            <button
              onClick={onMaximize}
              className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              aria-label={mode === 'fullscreen' ? 'Exit fullscreen' : 'Fullscreen'}
              title={mode === 'fullscreen' ? 'Salir de pantalla completa' : 'Pantalla completa'}
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
