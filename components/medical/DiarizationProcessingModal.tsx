/**
 * Diarization Processing Modal
 *
 * Blocking modal that shows diarization progress while polling
 * ESC key support added (2025-11-15) for emergency exit
 *
 * Author: Bernard Uriza Orozco
 * Created: 2025-11-14
 * Updated: 2025-11-15 (ESC key support)
 */

import React, { useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface DiarizationProcessingModalProps {
  isOpen: boolean;
  status: 'waiting_for_chunks' | 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  segmentCount?: number;
  error?: string;
  statusMessage?: string; // Detailed message from polling
  // Chunk transcription progress (for waiting_for_chunks state)
  completedChunks?: number;
  totalChunks?: number;
  estimatedSecondsRemaining?: number; // Time estimate for transcription
  // Adaptive polling metrics
  currentInterval?: number; // Current polling interval (ms)
  totalPolls?: number; // Total polls attempted
  isPolling?: boolean; // Whether polling is active
  // Emergency exit callback
  onCancel?: () => void; // Called when user presses ESC or clicks cancel button
}

export function DiarizationProcessingModal({
  isOpen,
  status,
  progress,
  segmentCount,
  error,
  statusMessage,
  completedChunks = 0,
  totalChunks = 0,
  estimatedSecondsRemaining = 0,
  currentInterval = 1000,
  totalPolls = 0,
  isPolling = false,
  onCancel,
}: DiarizationProcessingModalProps) {
  // ESC key listener for emergency exit
  useEffect(() => {
    if (!isOpen || !onCancel) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('[DiarizationModal] ESC pressed - emergency exit');
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Calculate chunk progress percentage
  const chunkProgress = totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

  // Format interval for display
  const intervalSeconds = (currentInterval / 1000).toFixed(1);

  // Determine polling mode (fast/adaptive/idle)
  const getPollingMode = () => {
    if (currentInterval <= 1000) return { label: 'Fast', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (currentInterval <= 3000) return { label: 'Adaptive', color: 'text-cyan-400', bg: 'bg-cyan-500/10' };
    return { label: 'Idle', color: 'text-slate-400', bg: 'bg-slate-500/10' };
  };

  const pollingMode = getPollingMode();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-slate-800 border border-slate-700 p-8 shadow-2xl animate-slide-up">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {status === 'completed' ? (
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          ) : status === 'failed' ? (
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white text-center mb-2">
          {status === 'completed'
            ? '¡Diarización Completada!'
            : status === 'failed'
            ? 'Error en Diarización'
            : status === 'waiting_for_chunks'
            ? 'Finalizando Sesión...'
            : 'Procesando Diarización...'}
        </h2>

        {/* Description */}
        <p className="text-slate-400 text-center mb-6">
          {status === 'completed'
            ? `Se identificaron ${segmentCount || 0} segmentos con clasificación de hablantes.`
            : status === 'failed'
            ? error || 'Ocurrió un error al procesar la diarización.'
            : status === 'waiting_for_chunks'
            ? `Transcribiendo audio: ${completedChunks}/${totalChunks} chunks completados`
            : statusMessage || 'Analizando el audio con IA para identificar y clasificar hablantes (MEDICO/PACIENTE).'}
        </p>

        {/* Progress bar */}
        {status !== 'failed' && status !== 'completed' && (
          <div className="space-y-3">
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(
                    status === 'waiting_for_chunks' ? chunkProgress : progress,
                    100
                  )}%`
                }}
              />
            </div>
            <p className="text-sm text-slate-500 text-center">
              {status === 'waiting_for_chunks'
                ? estimatedSecondsRemaining > 0
                  ? `${chunkProgress}% completado (${completedChunks}/${totalChunks} chunks) · ~${estimatedSecondsRemaining}s restantes`
                  : `${chunkProgress}% completado (${completedChunks}/${totalChunks} chunks)`
                : `${progress}% completado`}
            </p>
          </div>
        )}

        {/* Adaptive Polling Metrics - ALWAYS VISIBLE FOR DEBUG */}
        {status !== 'completed' && status !== 'failed' && (
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-yellow-500/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Monitor en tiempo real</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${pollingMode.bg} ${pollingMode.color} font-medium`}>
                {pollingMode.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col">
                <span className="text-slate-500 mb-1">Intervalo</span>
                <span className="text-white font-mono font-medium">{intervalSeconds}s</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 mb-1">Verificaciones</span>
                <span className="text-white font-mono font-medium">{totalPolls}</span>
              </div>
            </div>
            {currentInterval > 1000 && (
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Modo adaptativo: reduciendo frecuencia para ahorrar recursos
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        {status === 'waiting_for_chunks' && (
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 text-center">
              🎙️ <strong>Transcripción en progreso:</strong> Procesando chunks de audio
              con Whisper AI (13 segundos por chunk).
            </p>
          </div>
        )}
        {status === 'in_progress' && (
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 text-center">
              💡 <strong>Triple Vision:</strong> Analizando 3 fuentes de transcripción
              simultáneamente para máxima precisión.
            </p>
          </div>
        )}

        {/* Error details */}
        {status === 'failed' && error && (
          <div className="mt-4 p-3 bg-red-900/20 rounded-lg border border-red-700/30">
            <p className="text-xs text-red-400 font-mono">{error}</p>
          </div>
        )}

        {/* Note */}
        {status !== 'failed' && status !== 'completed' && (
          <p className="text-xs text-slate-500 text-center mt-6">
            Este proceso puede tomar 1-3 minutos dependiendo de la duración del audio.
          </p>
        )}

        {/* Emergency Exit Button (ESC key) */}
        {status !== 'completed' && status !== 'failed' && onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 w-full text-slate-400 hover:text-white transition-colors text-sm py-2 px-4 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-700/30"
          >
            Cancelar (ESC)
          </button>
        )}
      </div>
    </div>
  );
}
