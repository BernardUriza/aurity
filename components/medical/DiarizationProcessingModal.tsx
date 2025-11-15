/**
 * Diarization Processing Modal
 *
 * Blocking modal that shows diarization progress while polling
 *
 * Author: Bernard Uriza Orozco
 * Created: 2025-11-14
 */

import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface DiarizationProcessingModalProps {
  isOpen: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  segmentCount?: number;
  error?: string;
}

export function DiarizationProcessingModal({
  isOpen,
  status,
  progress,
  segmentCount,
  error,
}: DiarizationProcessingModalProps) {
  if (!isOpen) return null;

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
        <h2 className="text-2xl font-semibold text-white text-center mb-2">
          {status === 'completed'
            ? '¡Diarización Completada!'
            : status === 'failed'
            ? 'Error en Diarización'
            : 'Procesando Diarización...'}
        </h2>

        {/* Description */}
        <p className="text-slate-400 text-center mb-6">
          {status === 'completed'
            ? `Se identificaron ${segmentCount || 0} segmentos con clasificación de hablantes.`
            : status === 'failed'
            ? error || 'Ocurrió un error al procesar la diarización.'
            : 'Analizando el audio con IA para identificar y clasificar hablantes (MEDICO/PACIENTE).'}
        </p>

        {/* Progress bar */}
        {status !== 'failed' && status !== 'completed' && (
          <div className="space-y-3">
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 text-center">
              {progress}% completado
            </p>
          </div>
        )}

        {/* Info */}
        {status === 'processing' && (
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
      </div>
    </div>
  );
}
