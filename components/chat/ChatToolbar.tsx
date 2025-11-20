'use client';

/**
 * ChatToolbar Component
 *
 * Toolbar with action buttons for chat functionality:
 * - Attach files
 * - Change language
 * - Text formatting
 * - Theme toggle
 * - Voice input
 */

import { Plus, Globe, Type, Zap, FileText, Mic } from 'lucide-react';

export type ResponseMode = 'explanatory' | 'concise';

export interface ChatToolbarProps {
  /** Enable/disable attach button */
  showAttach?: boolean;

  /** Enable/disable language button */
  showLanguage?: boolean;

  /** Enable/disable formatting button */
  showFormatting?: boolean;

  /** Enable/disable response mode toggle button */
  showResponseMode?: boolean;

  /** Enable/disable voice button */
  showVoice?: boolean;

  /** Current response mode ('explanatory' | 'concise') */
  responseMode?: ResponseMode;

  /** Callbacks */
  onAttach?: () => void;
  onLanguage?: () => void;
  onFormatting?: () => void;
  onResponseModeToggle?: () => void;
  onVoice?: () => void;
}

export function ChatToolbar({
  showAttach = true,
  showLanguage = true,
  showFormatting = true,
  showResponseMode = true,
  showVoice = true,
  responseMode = 'explanatory',
  onAttach,
  onLanguage,
  onFormatting,
  onResponseModeToggle,
  onVoice,
}: ChatToolbarProps) {
  const buttonBaseClass = `
    p-2.5 rounded-lg
    text-slate-400 hover:text-white hover:bg-slate-700/50
    transition-all duration-200
    disabled:opacity-40 disabled:cursor-not-allowed
    active:scale-95
  `;

  return (
    <div className="
      flex items-center justify-between gap-2
      px-4 py-2
      border-t border-slate-700/50
      bg-slate-900/95 backdrop-blur-sm
    ">
      {/* Left side: Utility actions */}
      <div className="flex items-center gap-1">
        {showAttach && (
          <button
            onClick={onAttach}
            className={buttonBaseClass}
            title="Adjuntar archivo"
            aria-label="Adjuntar archivo"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        {showLanguage && (
          <button
            onClick={onLanguage}
            className={buttonBaseClass}
            title="Cambiar idioma"
            aria-label="Cambiar idioma"
          >
            <Globe className="w-5 h-5" />
          </button>
        )}

        {showFormatting && (
          <button
            onClick={onFormatting}
            className={buttonBaseClass}
            title="Formato de texto"
            aria-label="Formato de texto"
          >
            <Type className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Right side: Response Mode & Voice */}
      <div className="flex items-center gap-1">
        {showResponseMode && (
          <button
            onClick={onResponseModeToggle}
            className={`${buttonBaseClass} ${responseMode === 'concise' ? 'text-cyan-400 hover:text-cyan-300' : 'text-emerald-400 hover:text-emerald-300'}`}
            title={responseMode === 'explanatory' ? 'Modo: Explicativo (detallado)' : 'Modo: Conciso (breve)'}
            aria-label={responseMode === 'explanatory' ? 'Cambiar a modo conciso' : 'Cambiar a modo explicativo'}
          >
            {responseMode === 'explanatory' ? (
              <FileText className="w-5 h-5" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
          </button>
        )}

        {showVoice && (
          <button
            onClick={onVoice}
            className={`${buttonBaseClass} hover:text-purple-400`}
            title="Entrada de voz"
            aria-label="Entrada de voz"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
