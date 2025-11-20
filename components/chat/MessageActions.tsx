'use client';

/**
 * MessageActions Component
 *
 * Practical message actions (copy, delete, etc.)
 * Simple, clean, functional.
 */

import { useState } from 'react';
import { Copy, Check, MoreVertical, Trash2, Pin, Reply } from 'lucide-react';

export interface MessageActionsProps {
  /** Message content to copy */
  content: string;

  /** Message ID */
  messageId?: string;

  /** Show delete button */
  canDelete?: boolean;

  /** Show pin button */
  canPin?: boolean;

  /** Callbacks */
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReply?: (messageId: string) => void;

  /** Position: 'top-right' | 'bottom-right' */
  position?: 'top-right' | 'bottom-right';
}

/**
 * Copy button with visual feedback
 */
export function CopyButton({ content, size = 'sm' }: { content: string; size?: 'xs' | 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  const buttonSizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        ${buttonSizeClasses[size]}
        rounded-md
        ${copied ? 'bg-green-500/20 text-green-400' : 'bg-transparent hover:bg-slate-700 text-slate-400 hover:text-slate-200'}
        transition-all duration-200
        group-copy
        relative
      `}
      title={copied ? 'Copiado!' : 'Copiar mensaje'}
      aria-label={copied ? 'Copied' : 'Copy message'}
    >
      {copied ? (
        <Check className={`${sizeClasses[size]}`} />
      ) : (
        <Copy className={sizeClasses[size]} />
      )}

      {/* Tooltip */}
      <span className="
        absolute -top-9 left-1/2 -translate-x-1/2
        px-2.5 py-1.5 rounded-md
        bg-slate-900/95 backdrop-blur-sm border border-slate-700/50
        text-slate-200 text-xs font-medium
        opacity-0 group-copy-hover:opacity-100
        pointer-events-none
        transition-opacity
        whitespace-nowrap
        shadow-xl
      ">
        {copied ? '✓ ¡Copiado!' : 'Copiar mensaje'}
      </span>
    </button>
  );
}

/**
 * Message actions dropdown menu
 */
export function MessageActions({
  content,
  messageId,
  canDelete = false,
  canPin = false,
  onDelete,
  onPin,
  onReply,
  position = 'top-right',
}: MessageActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'bottom-right': '-bottom-1 -right-1',
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-20 opacity-100 group-hover:opacity-100 transition-opacity duration-200`}>
      {/* Quick action buttons (always visible for debugging) */}
      <div className="flex items-center gap-0.5 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-lg p-0.5">
        <CopyButton content={content} size="sm" />

        {/* More actions dropdown */}
        {(canDelete || canPin || onReply) && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="
                p-1.5 rounded-md
                bg-transparent hover:bg-slate-700
                text-slate-400 hover:text-slate-200
                transition-all duration-200
              "
              aria-label="More actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
              <>
                {/* Backdrop to close */}
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsOpen(false)}
                />

                {/* Menu (opens upward if at bottom) */}
                <div className={`
                  absolute right-0 z-30
                  w-44
                  bg-slate-800/98 backdrop-blur-md border border-slate-700/80
                  rounded-lg shadow-2xl
                  overflow-hidden
                  animate-fade-in
                  ${position === 'bottom-right' ? 'bottom-full mb-1' : 'top-full mt-1'}
                `}>
                  {/* Copy */}
                  <button
                    onClick={handleCopy}
                    className="
                      w-full px-3 py-2 text-left text-sm
                      text-slate-300 hover:bg-slate-700 hover:text-white
                      transition-colors
                      flex items-center gap-2
                    "
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {/* Reply */}
                  {onReply && messageId && (
                    <button
                      onClick={() => {
                        onReply(messageId);
                        setIsOpen(false);
                      }}
                      className="
                        w-full px-3 py-2 text-left text-sm
                        text-slate-300 hover:bg-slate-700 hover:text-white
                        transition-colors
                        flex items-center gap-2
                      "
                    >
                      <Reply className="w-4 h-4" />
                      <span>Responder</span>
                    </button>
                  )}

                  {/* Pin */}
                  {canPin && onPin && messageId && (
                    <button
                      onClick={() => {
                        onPin(messageId);
                        setIsOpen(false);
                      }}
                      className="
                        w-full px-3 py-2 text-left text-sm
                        text-slate-300 hover:bg-slate-700 hover:text-white
                        transition-colors
                        flex items-center gap-2
                      "
                    >
                      <Pin className="w-4 h-4" />
                      <span>Fijar</span>
                    </button>
                  )}

                  {/* Delete */}
                  {canDelete && onDelete && messageId && (
                    <>
                      <div className="h-px bg-slate-700 my-1" />
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este mensaje?')) {
                            onDelete(messageId);
                            setIsOpen(false);
                          }
                        }}
                        className="
                          w-full px-3 py-2 text-left text-sm
                          text-red-400 hover:bg-red-900/20 hover:text-red-300
                          transition-colors
                          flex items-center gap-2
                        "
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Code block with copy button
 */
export function CodeBlockWithCopy({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group">
      {/* Language label + Copy button */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        {language && (
          <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="
            px-2 py-1 rounded
            bg-slate-800/80 hover:bg-slate-700
            text-slate-400 hover:text-slate-200
            transition-all
            flex items-center gap-1.5
            opacity-0 group-hover:opacity-100
          "
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-green-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-xs">Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <pre className="bg-slate-900/80 p-4 rounded-xl overflow-x-auto">
        <code className="text-sm text-slate-200 font-mono">{code}</code>
      </pre>
    </div>
  );
}
