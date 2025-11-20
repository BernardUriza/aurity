'use client';

/**
 * HistorySearch Component
 *
 * Semantic search over user's conversation history.
 * Leverages backend embeddings (conversation_memory.h5) for
 * "la conversación que nunca termina" (FI-PHIL-DOC-014)
 *
 * Features:
 * - Semantic search ("hipertensión" finds related conversations)
 * - Similarity scores
 * - Session grouping
 * - Jump to conversation
 */

import { useState } from 'react';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';

export interface InteractionResult {
  session_id: string;
  timestamp: number;
  role: 'user' | 'assistant';
  content: string;
  persona?: string;
  similarity: number;
}

export interface HistorySearchResponse {
  results: InteractionResult[];
  total_interactions: number;
  query: string;
}

export interface HistorySearchProps {
  /** Callback when user clicks on a result */
  onSelectResult?: (result: InteractionResult) => void;

  /** Show in modal/panel mode */
  mode?: 'panel' | 'modal';

  /** Close handler for modal */
  onClose?: () => void;
}

export function HistorySearch({
  onSelectResult,
  mode = 'panel',
  onClose
}: HistorySearchProps) {
  const { user } = useAuth0();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InteractionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || !user?.sub) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001';

      const response = await fetch(`${backendUrl}/api/workflows/aurity/assistant/history/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          doctor_id: user.sub,
          limit: 20,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('No tienes historial de conversaciones aún.');
          setResults([]);
          return;
        }
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: HistorySearchResponse = await response.json();
      setResults(data.results);
      setTotalInteractions(data.total_interactions);
    } catch (err) {
      console.error('History search error:', err);
      setError(err instanceof Error ? err.message : 'Error al buscar historial');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return date.toLocaleDateString('es-MX');
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-emerald-400 bg-emerald-950/30';
    if (similarity >= 0.6) return 'text-cyan-400 bg-cyan-950/30';
    if (similarity >= 0.4) return 'text-blue-400 bg-blue-950/30';
    return 'text-slate-400 bg-slate-900/30';
  };

  const containerClass = mode === 'modal'
    ? 'fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-50 flex items-center justify-center p-4'
    : 'w-full h-full';

  const panelClass = mode === 'modal'
    ? 'bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col'
    : 'bg-slate-900 h-full flex flex-col';

  return (
    <div className={containerClass}>
      <div className={panelClass}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Buscar en Historial</h3>
              {totalInteractions > 0 && (
                <p className="text-xs text-slate-400">
                  {totalInteractions.toLocaleString()} interacciones almacenadas
                </p>
              )}
            </div>
          </div>

          {mode === 'modal' && onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Busca temas, síntomas, diagnósticos..."
              className="
                flex-1 px-4 py-2.5 rounded-lg
                bg-slate-800/80 border border-slate-600/50
                text-white placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-purple-500/50
                transition-all
              "
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="
                px-6 py-2.5 rounded-lg
                bg-gradient-to-r from-purple-600 to-blue-600
                hover:from-purple-700 hover:to-blue-700
                text-white font-medium
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all
                flex items-center gap-2
              "
            >
              <Search className="h-4 w-4" />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {/* Hint */}
          <p className="text-xs text-slate-500 mt-2">
            💡 Búsqueda semántica: encuentra conversaciones por tema, no solo palabras exactas
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {error && (
            <div className="
              p-4 rounded-lg
              bg-red-950/20 border border-red-800/40
              text-red-300 text-sm
            ">
              {error}
            </div>
          )}

          {results.length === 0 && !error && !loading && query && (
            <div className="text-center py-12 text-slate-500">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No se encontraron resultados para "{query}"</p>
              <p className="text-xs mt-2">Prueba con otros términos o conceptos</p>
            </div>
          )}

          {results.length === 0 && !query && (
            <div className="text-center py-12 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Busca en tu historial completo</p>
              <p className="text-xs mt-2">
                Todas tus conversaciones están indexadas y listas para buscar
              </p>
            </div>
          )}

          {results.map((result, idx) => (
            <div
              key={`${result.session_id}-${idx}`}
              onClick={() => onSelectResult?.(result)}
              className="
                p-4 rounded-lg
                bg-slate-800/50 border border-slate-700/50
                hover:bg-slate-800 hover:border-slate-600
                cursor-pointer transition-all
                group
              "
            >
              {/* Header: Similarity + Timestamp */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`
                    text-xs font-mono px-2 py-1 rounded
                    ${getSimilarityColor(result.similarity)}
                  `}>
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    {Math.round(result.similarity * 100)}% relevante
                  </span>

                  {result.persona && (
                    <span className="text-xs text-slate-500">
                      {result.persona}
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(result.timestamp)}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-purple-300 uppercase">
                  {result.role === 'user' ? 'Tú' : 'Free Intelligence'}
                </div>
                <p className="text-sm text-slate-200 line-clamp-3 group-hover:line-clamp-none transition-all">
                  {result.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Stats */}
        {results.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-700/50 flex-shrink-0">
            <p className="text-xs text-slate-500 text-center">
              Mostrando {results.length} de {totalInteractions.toLocaleString()} interacciones
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
