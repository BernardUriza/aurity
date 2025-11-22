'use client';

/**
 * Unified Timeline Page - Memoria Longitudinal Unificada
 *
 * FI-PHIL-DOC-014: "No existen sesiones. Solo una conversación infinita"
 *
 * REFACTORED: Now uses useUnifiedTimeline hook for:
 * - Pagination via backend /timeline/unified endpoint
 * - Event type filtering (all/chat/audio)
 * - Time range filtering (presets)
 * - Infinite scroll with IntersectionObserver
 *
 * Updated: 2025-11-22 - Migrated to unified hook architecture
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { timelineHeader } from '@/config/page-headers';
import { useUnifiedTimeline } from '@/hooks/useUnifiedTimeline';
import { TimelineFilters } from '@/components/timeline/TimelineFilters';
import { EventTimeline, type TimelineEvent } from '@/components/audit/EventTimeline';
import { unifiedTimelineConfig } from '@/lib/timeline-config';
import {
  MessageCircle,
  Mic,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// Main Component
// ============================================================================

export default function TimelinePage() {
  // Use unified timeline hook (replaces all legacy state management)
  const {
    events,
    stats,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    chatCount,
    audioCount,
    filters,
    setEventType,
    setTimeRangePreset,
    loadMore,
    refresh,
    isAuthenticated,
  } = useUnifiedTimeline();

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ============================================================================
  // Infinite Scroll with IntersectionObserver
  // ============================================================================

  useEffect(() => {
    // SSR-safe: check for IntersectionObserver
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          void loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  // ============================================================================
  // Transform UnifiedEvent to TimelineEvent for EventTimeline component
  // ============================================================================

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    return events.map((e, idx) => ({
      id: e.id,
      timestamp: e.timestamp, // Unix timestamp (seconds)
      // Normalize: event_type → type for EventTimeline compatibility
      type: (e as any).type ?? e.event_type,
      content: e.content,
      metadata: {
        event_number: idx + 1,
        session_id: e.session_id,
        persona: e.persona,
        chunk_number: e.chunk_number,
        duration: e.duration,
        confidence: e.confidence,
        language: e.language,
        stt_provider: e.stt_provider,
        source: e.source,
      },
    }));
  }, [events]);

  // ============================================================================
  // Calculate metrics for header
  // ============================================================================

  const metrics = useMemo(() => {
    const audioEvents = events.filter(e => e.source === 'audio');
    const totalDuration = audioEvents.reduce((sum, e) => sum + (e.duration || 0), 0);

    // Calculate p95 latency from stats or estimate
    const p95Latency = stats?.total_events ?? 0 > 0 ? 850 : 0; // Placeholder

    return {
      totalEvents: total,
      chatCount,
      audioCount,
      totalDuration,
      p95Latency,
      successRate: 100, // Will be calculated from actual data
    };
  }, [events, stats, total, chatCount, audioCount]);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400 text-[15px] leading-6">
            Cargando memoria longitudinal...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Header Configuration
  // ============================================================================

  const headerConfig = timelineHeader({
    totalEvents: metrics.totalEvents,
    p95Latency: metrics.p95Latency,
    sessionId: 'unified',
    successRate: metrics.successRate,
    totalDuration: metrics.totalDuration,
  });

  const headerActions = (
    <button
      onClick={() => refresh()}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="timeline-page min-h-screen bg-slate-950">
      <PageHeader {...headerConfig} actions={headerActions} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <main className="space-y-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-white">{metrics.totalEvents}</div>
              <div className="text-xs text-slate-400">Total Eventos</div>
            </div>
            <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-700/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-sky-400" />
                <div className="text-2xl font-bold text-sky-400">{metrics.chatCount}</div>
              </div>
              <div className="text-xs text-slate-400">Chat Messages</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-700/30">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-emerald-400" />
                <div className="text-2xl font-bold text-emerald-400">{metrics.audioCount}</div>
              </div>
              <div className="text-xs text-slate-400">Transcripciones</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="text-2xl font-bold text-white">
                {metrics.totalDuration.toFixed(0)}s
              </div>
              <div className="text-xs text-slate-400">Audio Total</div>
            </div>
          </div>

          {/* TimelineFilters Component (replaces hardcoded tabs) */}
          <TimelineFilters
            eventType={filters.eventType}
            selectedPreset={filters.preset}
            totalCount={metrics.totalEvents}
            chatCount={metrics.chatCount}
            audioCount={metrics.audioCount}
            onEventTypeChange={setEventType}
            onPresetChange={setTimeRangePreset}
          />

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-700/30 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-300">{error}</p>
              </div>
              <button
                onClick={() => refresh()}
                className="px-3 py-1.5 text-xs font-medium text-red-300 hover:text-white bg-red-900/30 hover:bg-red-800/50 rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && timelineEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">
                Sin eventos en el período seleccionado.
              </p>
              <p className="text-slate-500 text-xs mt-2">
                "No existen sesiones. Solo una conversación infinita"
              </p>
            </div>
          )}

          {/* Unified Timeline - All Events */}
          {timelineEvents.length > 0 && (
            <EventTimeline
              events={timelineEvents}
              config={unifiedTimelineConfig}
              isLoading={false}
              error={null}
              onRefresh={refresh}
              className="rounded-2xl ring-1 ring-white/5 shadow-sm"
            />
          )}

          {/* Infinite Scroll Sentinel */}
          <div
            ref={sentinelRef}
            aria-hidden="true"
            className="h-1"
          />

          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6 text-emerald-500 mr-2" />
              <span className="text-sm text-slate-400">Cargando más eventos...</span>
            </div>
          )}

          {/* End of Timeline Indicator */}
          {!hasMore && timelineEvents.length > 0 && !isLoadingMore && (
            <div className="text-center py-8 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Fin de la memoria longitudinal · {total} eventos totales
              </p>
            </div>
          )}

          {/* Philosophy Note */}
          <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
            <p className="text-xs text-slate-500 italic text-center">
              💡 "No existen sesiones. Solo una conversación infinita" — FI-PHIL-DOC-014
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
