'use client';

/**
 * EventTimeline - Generic Reusable Timeline Component
 *
 * Unified component for displaying chronological events with:
 * - Configurable rendering (via config objects)
 * - Support for DialogFlow segments, Timeline events, and more
 * - Optimistic updates (React 19)
 * - Search, filter, export
 * - Audio sync (optional)
 *
 * Author: Bernard Uriza Orozco
 * Created: 2025-11-18
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface TimelineEvent {
  id: string;
  timestamp: string | number; // ISO string or seconds
  type: string; // e.g., "transcription", "diarization", "SOAP"
  content: string; // Main text
  metadata?: Record<string, any>; // Additional data (speaker, confidence, tags, etc.)
}

export interface TimelineConfig {
  // Header rendering with full context
  renderHeader?: (
    event: TimelineEvent,
    isExpanded: boolean,
    toggleExpanded: () => void,
    actions?: {
      onPlay?: (event: TimelineEvent) => void;
      playingId?: string | null;
    }
  ) => React.ReactNode;

  // Badge rendering (event type, speaker, etc.)
  renderBadge?: (event: TimelineEvent) => React.ReactNode;

  // Timestamp formatting
  formatTimestamp?: (timestamp: string | number) => string;

  // Content rendering (can include collapsible sections)
  renderContent?: (event: TimelineEvent, isExpanded: boolean) => React.ReactNode;

  // Footer metadata
  renderFooter?: (event: TimelineEvent) => React.ReactNode;

  // Color scheme (based on event type/speaker)
  getColors?: (event: TimelineEvent) => {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };

  // Export format
  formatExport?: (events: TimelineEvent[]) => string;

  // Search filter
  searchFilter?: (event: TimelineEvent, query: string) => boolean;

  // Actions (edit, play, etc.)
  actions?: {
    onEdit?: (event: TimelineEvent) => void;
    onPlay?: (event: TimelineEvent) => void;
    onDelete?: (event: TimelineEvent) => void;
  };

  // UI customization
  title?: string;
  emptyMessage?: string;
  showSearch?: boolean;
  showExport?: boolean;
  maxHeight?: string;
}

interface EventTimelineProps {
  events: TimelineEvent[];
  config: TimelineConfig;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  className?: string;
  showHeader?: boolean; // Show/hide timeline header (default: true)
}

// ============================================================================
// Main Component
// ============================================================================

export function EventTimeline({
  events,
  config,
  isLoading = false,
  error = null,
  onRefresh,
  className = '',
  showHeader = true,
}: EventTimelineProps) {
  // ========================================
  // State
  // ========================================

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ========================================
  // Computed Values
  // ========================================

  const filteredEvents = useMemo(() => {
    if (!searchQuery || !config.searchFilter) return events;

    const query = searchQuery.toLowerCase();
    return events.filter((event) => config.searchFilter!(event, query));
  }, [events, searchQuery, config]);

  const stats = useMemo(() => {
    const total = events.length;
    const typeBreakdown = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, typeBreakdown };
  }, [events]);

  // ========================================
  // Event Handlers
  // ========================================

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    if (!config.formatExport) return;

    const content = config.formatExport(events);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-export-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events, config]);

  // ========================================
  // Default Renderers (Fallbacks)
  // ========================================

  const defaultFormatTimestamp = (timestamp: string | number): string => {
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const defaultGetColors = () => ({
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    badge: 'bg-slate-500',
  });

  const defaultSearchFilter = (event: TimelineEvent, query: string): boolean => {
    return (
      event.content.toLowerCase().includes(query) ||
      event.type.toLowerCase().includes(query) ||
      JSON.stringify(event.metadata).toLowerCase().includes(query)
    );
  };

  // ========================================
  // Render
  // ========================================

  const formatTimestamp = config.formatTimestamp || defaultFormatTimestamp;
  const getColors = config.getColors || defaultGetColors;
  const searchFilter = config.searchFilter || defaultSearchFilter;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ===== Header ===== */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {config.title || 'Event Timeline'}
            </h2>
            <p className="text-sm text-slate-400">
              {isLoading ? 'Cargando eventos...' : `${stats.total} eventos`}
            </p>
          </div>

          {/* Type Breakdown */}
          {!isLoading && events.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.typeBreakdown).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-700/30 border border-slate-600/30 rounded-md"
                >
                  <span className="text-xs text-slate-300 font-medium uppercase">
                    {type} ({count})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Loading State ===== */}
      {isLoading && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
              <div className="h-16 bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Error State ===== */}
      {error && !isLoading && (
        <div className="bg-red-900/20 rounded-xl p-6 border border-red-700/30 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Error al cargar eventos</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-auto px-4 py-2 bg-red-700/30 hover:bg-red-700/50 text-red-400 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* ===== Empty State ===== */}
      {!isLoading && !error && events.length === 0 && (
        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
          <p className="text-slate-400">
            {config.emptyMessage || 'No hay eventos disponibles'}
          </p>
        </div>
      )}

      {/* ===== Search & Export ===== */}
      {!isLoading && !error && events.length > 0 && (config.showSearch || config.showExport) && (
        <div className="flex gap-3">
          {config.showSearch && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}
          {config.showExport && config.formatExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white transition-colors"
              title="Exportar eventos"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
        </div>
      )}

      {/* ===== Events Timeline ===== */}
      {!isLoading && !error && filteredEvents.length > 0 && (
        <div
          ref={scrollContainerRef}
          className={`bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-3 ${config.maxHeight || 'max-h-[600px]'} overflow-y-auto custom-scrollbar`}
          role="feed"
          aria-label="Timeline de eventos"
        >
          {filteredEvents.map((event) => {
            const colors = getColors(event);
            const isExpanded = expandedIds.has(event.id);

            return (
              <div
                key={event.id}
                className={`rounded-lg border transition-all ${colors.bg} ${colors.border}`}
                role="article"
              >
                <div className="p-4">
                  {/* Custom Header (if provided) */}
                  {config.renderHeader &&
                    config.renderHeader(
                      event,
                      isExpanded,
                      () => toggleExpanded(event.id),
                      config.actions
                        ? {
                            onPlay: config.actions.onPlay,
                            playingId,
                          }
                        : undefined
                    )}

                  {/* Default Header (if no custom header) */}
                  {!config.renderHeader && (
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Badge */}
                        {config.renderBadge ? (
                          config.renderBadge(event)
                        ) : (
                          <div className={`px-3 py-1.5 rounded-md ${colors.bg} border ${colors.border}`}>
                            <span className={`text-sm font-semibold ${colors.text}`}>
                              {event.type.toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded-md">
                          <span className="text-xs font-mono text-slate-400">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Expand/Collapse Toggle */}
                      <button
                        onClick={() => toggleExpanded(event.id)}
                        className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                        aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  {config.renderContent ? (
                    config.renderContent(event, isExpanded)
                  ) : (
                    <div className="space-y-2">
                      <p className="text-slate-300 leading-relaxed">{event.content}</p>
                      {isExpanded && event.metadata && (
                        <div className="pt-2 border-t border-slate-700/50">
                          <pre className="text-xs text-slate-400 overflow-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Footer (if provided) */}
                  {config.renderFooter && config.renderFooter(event)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Search Results Info ===== */}
      {!isLoading && !error && searchQuery && (
        <div className="text-center text-sm text-slate-400">
          Mostrando {filteredEvents.length} de {events.length} eventos
        </div>
      )}
    </div>
  );
}
