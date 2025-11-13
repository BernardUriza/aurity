/**
 * FinalTranscription Component
 *
 * Final transcription display with audio playback and continue button.
 *
 * Features:
 * - Completed transcription text
 * - Full audio playback (WebM)
 * - Continue button with loading state
 * - Chunk count indicator
 *
 * Extracted from ConversationCapture (Phase 7)
 */

import { CheckCircle } from 'lucide-react';
import type { TranscriptionData } from '@/hooks/useTranscription';

interface FinalTranscriptionProps {
  transcriptionData: TranscriptionData;
  fullAudioUrl: string | null;
  chunkCount: number;
  loadingH5: boolean;
  onContinue?: () => void;
}

export function FinalTranscription({
  transcriptionData,
  fullAudioUrl,
  chunkCount,
  loadingH5,
  onContinue,
}: FinalTranscriptionProps) {
  if (!transcriptionData?.text) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">Transcripción Completada</h3>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
        <p className="text-slate-300 whitespace-pre-wrap">{transcriptionData.text}</p>
      </div>

      {/* Audio Playback (DEMO REQUIREMENT) - Show when audio is available */}
      {fullAudioUrl && (
        <div className="bg-slate-900/70 rounded-lg p-4 border border-emerald-500/30 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h4 className="text-sm font-semibold text-white">Audio Completo</h4>
            <span className="ml-auto text-xs text-slate-400">
              {chunkCount} chunks grabados
            </span>
          </div>
          <audio
            controls
            className="w-full"
            src={fullAudioUrl}
            preload="metadata"
          >
            Tu navegador no soporta reproducción de audio.
          </audio>
          <div className="mt-2 text-xs text-slate-400">
            💡 Puedes reproducir el audio completo de la consulta
          </div>
        </div>
      )}

      {onContinue && (
        <button
          onClick={onContinue}
          disabled={loadingH5}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingH5 ? 'Cargando datos...' : 'Continuar al Siguiente Paso'}
        </button>
      )}
    </div>
  );
}
