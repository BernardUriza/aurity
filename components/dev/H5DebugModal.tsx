/**
 * H5 Debug Modal
 *
 * Development-only modal for inspecting HDF5 session data.
 *
 * Features:
 * - Summary cards (duration, words, WPM, chunks)
 * - Full transcription display
 * - Chunk detail breakdown with status indicators
 * - Metadata panel (latency, audio availability)
 *
 * Trigger: Ctrl+Shift+H (development mode only)
 *
 * Author: Bernard Uriza Orozco
 * Created: 2025-11-15 (Extracted from ConversationCapture Phase 7)
 */

import { formatTime } from '@/lib/audio/formatting';

interface H5Data {
  session_id: string;
  chunks?: Array<{
    index: number;
    transcript?: string;
    latency_ms?: number;
    status: string;
  }>;
  transcription_full: string;
  word_count: number;
  duration_seconds: number;
  avg_latency_ms?: number;
  wpm: number;
  full_audio_available: boolean;
}

interface H5DebugModalProps {
  h5Data: H5Data | null;
  isOpen: boolean;
  onClose: () => void;
}

export function H5DebugModal({ h5Data, isOpen, onClose }: H5DebugModalProps) {
  if (!isOpen || !h5Data) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 rounded-2xl border border-yellow-500/50 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
        {/* Modal Header - DEV MODE WARNING */}
        <div className="px-6 py-4 border-b border-yellow-500/50 flex items-center justify-between bg-gradient-to-r from-yellow-900/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded border border-yellow-500/50">
              DEV TOOLS
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">HDF5 Session Inspector</h2>
              <p className="text-sm text-slate-400">Session ID: {h5Data.session_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Duración Total</div>
              <div className="text-2xl font-bold text-cyan-400">{formatTime(h5Data.duration_seconds || 0)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Palabras</div>
              <div className="text-2xl font-bold text-emerald-400">{h5Data.word_count || 0}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">WPM</div>
              <div className="text-2xl font-bold text-purple-400">{h5Data.wpm || 0}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Chunks</div>
              <div className="text-2xl font-bold text-yellow-400">{h5Data.chunks?.length || 0}</div>
            </div>
          </div>

          {/* Full Transcription */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Transcripción Completa
            </h3>
            <div className="bg-slate-900/50 rounded p-3 max-h-48 overflow-y-auto">
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {h5Data.transcription_full || 'No hay transcripción disponible'}
              </p>
            </div>
          </div>

          {/* Chunks Detail */}
          {h5Data.chunks && h5Data.chunks.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Desglose por Chunks ({h5Data.chunks.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {h5Data.chunks.map((chunk, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-mono">
                          Chunk {chunk.index}
                        </span>
                        {chunk.latency_ms && (
                          <span className="text-xs text-slate-500">
                            {(chunk.latency_ms / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        chunk.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        chunk.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {chunk.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">
                      {chunk.transcript || <span className="text-slate-600 italic">Sin transcripción</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Metadatos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Latencia Promedio</div>
                <div className="text-lg font-mono text-cyan-400">
                  {h5Data.avg_latency_ms ? `${(h5Data.avg_latency_ms / 1000).toFixed(2)}s` : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Audio Completo</div>
                <div className="text-lg font-semibold">
                  {h5Data.full_audio_available ? (
                    <span className="text-emerald-400">✅ Disponible</span>
                  ) : (
                    <span className="text-slate-500">❌ No disponible</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer - DEV MODE INFO */}
        <div className="px-6 py-4 border-t border-yellow-500/50 flex items-center justify-between bg-slate-800/50">
          <p className="text-xs text-slate-400">
            Hotkey: <kbd className="px-2 py-1 bg-slate-700 rounded text-yellow-400 font-mono">Ctrl+Shift+H</kbd>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
