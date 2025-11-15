/**
 * StreamingTranscript Component
 *
 * Real-time streaming transcription display with last chunk highlighting.
 *
 * Features:
 * - Live transcription updates
 * - Last chunk highlight animation (cyan background)
 * - Blinking cursor effect (only when active)
 * - Paused state indicator
 * - Chunk count indicator
 *
 * Extracted from ConversationCapture (Phase 7)
 * Updated: Pause state support (2025-11-13)
 */

import type { TranscriptionData } from '@/hooks/useTranscription';

interface StreamingTranscriptProps {
  transcriptionData: TranscriptionData;
  lastChunkText: string;
  chunkCount: number;
  isPaused?: boolean;
}

export function StreamingTranscript({
  transcriptionData,
  lastChunkText,
  chunkCount,
  isPaused = false,
}: StreamingTranscriptProps) {
  if (!transcriptionData?.text) return null;

  return (
    <div className={`bg-slate-800 rounded-xl p-6 border animate-in fade-in duration-300 ${
      isPaused ? 'border-yellow-500/30' : 'border-cyan-500/30'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${
          isPaused ? 'bg-yellow-400' : 'bg-cyan-400 animate-pulse'
        }`} />
        <h3 className="text-lg font-semibold text-white">
          {isPaused ? 'Transcripción (Pausada)' : 'Transcripción en Tiempo Real'}
        </h3>
        <span className={`text-xs ml-auto ${
          isPaused ? 'text-yellow-400' : 'text-cyan-400'
        }`}>
          {chunkCount} chunks procesados
        </span>
      </div>

      <div className="bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
        <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
          {/* Render old text */}
          {transcriptionData.text.substring(0, transcriptionData.text.length - lastChunkText.length)}
          {/* Highlight last chunk with fade-in animation */}
          {lastChunkText && (
            <span className="animate-in fade-in duration-500 bg-cyan-500/20 rounded px-0.5">
              {lastChunkText}
            </span>
          )}
          {/* Blinking cursor - Only when NOT paused */}
          {!isPaused && (
            <span
              className="inline-block w-0.5 h-4 ml-1 bg-cyan-400"
              style={{
                animation: 'blink 1s step-end infinite'
              }}
            />
          )}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span>{isPaused ? '⏸️ Grabación pausada - texto preservado' : '💡 El texto se actualiza cada 3 segundos mientras hablas'}</span>
      </div>

      {/* Custom CSS for blink animation */}
      <style jsx>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
