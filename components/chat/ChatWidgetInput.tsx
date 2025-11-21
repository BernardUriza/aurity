'use client';

/**
 * ChatWidgetInput Component
 *
 * Input area with auto-resize textarea and send button
 */

import { Send, Loader2 } from 'lucide-react';
import { AutoResizeTextarea } from './ChatUtilities';

export interface ChatWidgetInputProps {
  /** Current message value */
  message: string;

  /** Is sending message */
  loading: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Footer text */
  footer?: string;

  /** Callbacks */
  onMessageChange: (value: string) => void;
  onSend: () => void;
}

export function ChatWidgetInput({
  message,
  loading,
  placeholder = 'Escribe tu mensaje...',
  footer,
  onMessageChange,
  onSend,
}: ChatWidgetInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-slate-700/50 p-4 bg-slate-900/95 backdrop-blur-sm flex-shrink-0">
      {/* Input Row */}
      <div className="flex gap-3 items-end">
        {/* Textarea */}
        <AutoResizeTextarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          maxRows={5}
          showCounter={false}
          wrapperClassName="flex-1"
          className="
            w-full
            bg-slate-800/80 border border-slate-600/50
            rounded-xl px-4 py-3
            text-base text-white placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
            disabled:opacity-50
            transition-all
            min-h-[44px]
          "
        />

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={loading}
          className="
            bg-gradient-to-r from-purple-600 to-blue-600
            hover:from-purple-700 hover:to-blue-700
            active:scale-95
            text-white rounded-xl
            px-5 py-3
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
            flex items-center justify-center
            flex-shrink-0
            shadow-lg shadow-purple-500/20
            hover:shadow-xl hover:shadow-purple-500/30
            min-h-[44px] min-w-[44px]
          "
          aria-label="Send message"
          title="Enviar mensaje (Enter)"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Footer */}
      {footer && (
        <p className="text-xs text-slate-500/70 mt-3 text-center font-light">
          {footer}
        </p>
      )}
    </div>
  );
}
