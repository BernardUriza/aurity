'use client';

/**
 * ChatStartScreen Component
 *
 * Pre-conversation screen that requires user to explicitly start the chat.
 * Prevents accidental LLM calls and shows login prompt for unauthenticated users.
 */

import { LogIn, MessageSquareText, Shield, Sparkles } from 'lucide-react';

export interface ChatStartScreenProps {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** User's display name */
  userName?: string;
  /** Callback when user clicks "Comenzar" */
  onStart: () => void;
  /** Callback when user clicks "Iniciar sesión" */
  onLogin: () => void;
  /** Whether the start action is loading */
  isLoading?: boolean;
}

export function ChatStartScreen({
  isAuthenticated,
  userName,
  onStart,
  onLogin,
  isLoading = false,
}: ChatStartScreenProps) {
  // ========================================================================
  // NOT AUTHENTICATED - Show login prompt
  // ========================================================================
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[350px] px-6">
        <div className="text-center max-w-sm space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center">
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-200">
              Inicia sesión para continuar
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Para proteger tu privacidad y guardar tu historial de conversaciones,
              necesitas iniciar sesión.
            </p>
          </div>

          {/* Login Button */}
          <button
            onClick={onLogin}
            className="
              w-full py-3 px-4
              bg-gradient-to-r from-purple-600 to-blue-600
              hover:from-purple-700 hover:to-blue-700
              text-white font-medium
              rounded-xl
              transition-all duration-200
              flex items-center justify-center gap-2
              shadow-lg shadow-purple-500/20
              hover:shadow-purple-500/30
            "
          >
            <LogIn className="w-5 h-5" />
            Iniciar sesión
          </button>

          {/* Privacy note */}
          <p className="text-xs text-slate-500">
            Tus datos están protegidos con encriptación AES-256
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // AUTHENTICATED - Show start button
  // ========================================================================
  return (
    <div className="flex items-center justify-center min-h-[350px] px-6">
      <div className="text-center max-w-sm space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
        </div>

        {/* Welcome */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-200">
            Hola, {userName?.split(' ')[0] || 'Doctor'} 👋
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Soy tu asistente de Free Intelligence. Estoy listo para ayudarte con
            consultas médicas, notas SOAP y análisis clínicos.
          </p>
        </div>

        {/* Features */}
        <div className="text-left space-y-2 bg-slate-800/30 rounded-xl p-4">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <MessageSquareText className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>Conversación privada y segura</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>Datos encriptados localmente</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={isLoading}
          className="
            w-full py-3.5 px-4
            bg-gradient-to-r from-purple-600 to-blue-600
            hover:from-purple-700 hover:to-blue-700
            disabled:from-slate-600 disabled:to-slate-600
            disabled:cursor-not-allowed
            text-white font-medium text-base
            rounded-xl
            transition-all duration-200
            flex items-center justify-center gap-2
            shadow-lg shadow-purple-500/20
            hover:shadow-purple-500/30
            hover:scale-[1.02]
            active:scale-[0.98]
          "
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <MessageSquareText className="w-5 h-5" />
              Comenzar conversación
            </>
          )}
        </button>

        {/* Hint */}
        <p className="text-xs text-slate-500">
          Presiona para iniciar una nueva conversación
        </p>
      </div>
    </div>
  );
}
