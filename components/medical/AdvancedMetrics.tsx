/**
 * AdvancedMetrics Component
 *
 * Expandable panel with performance metrics, chunk timeline, and activity logs.
 *
 * Features:
 * - Performance metrics grid (latency, WPM, completion rate)
 * - Chunk timeline visualization with tooltips
 * - Activity logs with scrollable view
 * - Backend health indicator
 * - Collapsible UI
 *
 * Extracted from ConversationCapture (Phase 7)
 */

import { useState } from 'react';

export interface ChunkStatus {
  index: number;
  status: 'uploading' | 'pending' | 'processing' | 'completed' | 'failed';
  startTime?: number;
  latency?: number;
  transcript?: string;
}

interface AdvancedMetricsProps {
  chunkStatuses: ChunkStatus[];
  avgLatency: number;
  wpm: number;
  backendHealth: 'healthy' | 'degraded' | 'down';
  activityLogs: string[];
}

export function AdvancedMetrics({
  chunkStatuses,
  avgLatency,
  wpm,
  backendHealth,
  activityLogs,
}: AdvancedMetricsProps) {
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  const completed = chunkStatuses.filter(c => c.status === 'completed').length;
  const failed = chunkStatuses.filter(c => c.status === 'failed').length;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 animate-in">
      <button
        onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Métricas Avanzadas</h3>
          {/* Backend Health Badge */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            backendHealth === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' :
            backendHealth === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {backendHealth === 'healthy' ? '🟢 Backend OK' :
             backendHealth === 'degraded' ? '🟡 Degradado' : '🔴 Down'}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${showAdvancedMetrics ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showAdvancedMetrics && (
        <div className="px-6 pb-6 space-y-6 animate-in fade-in">
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Latencia Promedio</div>
              <div className="text-xl font-bold text-cyan-400">
                {avgLatency > 0 ? `${(avgLatency / 1000).toFixed(1)}s` : '--'}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">WPM</div>
              <div className="text-xl font-bold text-emerald-400">{wpm || '--'}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Completados</div>
              <div className="text-xl font-bold text-purple-400">
                {completed}/{chunkStatuses.length}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Fallidos</div>
              <div className="text-xl font-bold text-red-400">
                {failed}
              </div>
            </div>
          </div>

          {/* Chunk Timeline Visualization */}
          <div>
            <div className="text-sm font-medium text-slate-300 mb-3">Timeline de Chunks</div>
            <div className="flex flex-wrap gap-1.5">
              {chunkStatuses.map((chunk) => (
                <div
                  key={chunk.index}
                  className={`relative group w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all ${
                    chunk.status === 'uploading' ? 'bg-blue-500/30 text-blue-300 animate-pulse' :
                    chunk.status === 'pending' ? 'bg-yellow-500/30 text-yellow-300' :
                    chunk.status === 'processing' ? 'bg-cyan-500/30 text-cyan-300 animate-pulse' :
                    chunk.status === 'completed' ? 'bg-emerald-500/30 text-emerald-300' :
                    'bg-red-500/30 text-red-300'
                  }`}
                  title={`Chunk ${chunk.index}: ${chunk.status}${chunk.latency ? ` (${(chunk.latency / 1000).toFixed(1)}s)` : ''}`}
                >
                  {chunk.index}
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 border border-slate-700">
                    <div>Chunk {chunk.index}</div>
                    <div className="text-slate-400">{chunk.status}</div>
                    {chunk.latency && <div className="text-cyan-400">{(chunk.latency / 1000).toFixed(1)}s</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500/30" />
                <span>Uploading</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500/30" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-cyan-500/30" />
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500/30" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500/30" />
                <span>Failed</span>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          {activityLogs.length > 0 && (
            <div>
              <div className="text-sm font-medium text-slate-300 mb-3">Registro de Actividad</div>
              <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-3 font-mono text-xs max-h-48 overflow-y-auto">
                {activityLogs.map((log, idx) => (
                  <div key={idx} className="text-slate-400 py-1 border-b border-slate-800 last:border-0">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
