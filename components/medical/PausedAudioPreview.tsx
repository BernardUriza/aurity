/**
 * PausedAudioPreview Component
 *
 * Audio player shown when recording is paused, with concatenated audio preview.
 *
 * Features:
 * - Audio player for concatenated segments
 * - "Finalizar Sesión" button
 * - Visual indicator of paused state
 * - Segment count display
 *
 * Created: Phase 7 Enhancement (2025-11-13)
 */

import { StopCircle, Play } from 'lucide-react';

interface PausedAudioPreviewProps {
  audioUrl: string | null;
  segmentCount: number;
  chunkCount: number;
  onEndSession: () => void;
  onResume: () => void;
}

export function PausedAudioPreview({
  audioUrl,
  segmentCount,
  chunkCount,
  onEndSession,
  onResume,
}: PausedAudioPreviewProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-yellow-500/30 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <h3 className="text-lg font-semibold text-white">
          Grabación Pausada
        </h3>
        <span className="text-xs ml-auto text-yellow-400">
          {chunkCount} chunks procesados
        </span>
      </div>

      {/* Audio Player - Only if audio available */}
      {audioUrl ? (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-500/20 mb-4">
          <p className="text-sm text-white font-semibold mb-3">
            🎧 Audio grabado ({segmentCount} segmento{segmentCount !== 1 ? 's' : ''})
          </p>
          <audio
            controls
            src={audioUrl}
            className="w-full"
            preload="auto"
            style={{
              minHeight: '54px',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
            }}
          />
        </div>
      ) : (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-red-500/20 mb-4">
          <p className="text-sm text-red-400">
            ⚠️ Audio no disponible (audioUrl: {audioUrl === null ? 'null' : 'undefined'})
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onResume}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-lg"
        >
          <Play className="h-5 w-5" />
          Continuar Grabando
        </button>

        <button
          onClick={onEndSession}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-lg"
        >
          <StopCircle className="h-5 w-5" />
          Finalizar Sesión
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-yellow-400">
        <span>⏸️ Puedes escuchar el audio grabado o continuar grabando</span>
      </div>
    </div>
  );
}
