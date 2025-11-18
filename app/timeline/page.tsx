'use client';

/**
 * Timeline Demo Page
 *
 * FI-UI-FEAT-100: Encabezado Contextual de Sesión
 *
 * Demonstrates SessionHeader component with:
 * - Session ID, timespan, size metrics
 * - Policy badges (Hash/Policy/Redaction/Audit)
 * - Sticky header on scroll
 * - Refresh and export actions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { timelineHeader } from '@/config/page-headers';
import { SessionHeader } from '@/aurity/modules/fi-timeline';
import type { SessionHeaderData } from '@/aurity/modules/fi-timeline';
import { getSessionSummaries, getSessionDetail, getSessionChunks, type AudioChunk } from '@/lib/api/timeline';
import { EventTimeline, type TimelineEvent } from '@/components/EventTimeline';
import { timelineEventConfig } from '@/lib/timeline-config';
import { Activity, CheckCircle2, Zap, Clock, TrendingUp, TrendingDown, Minus, Navigation, ChevronDown, Search, X } from 'lucide-react';

export default function TimelinePage() {
  const [sessionData, setSessionData] = useState<SessionHeaderData | null>(null);
  const [chunks, setChunks] = useState<AudioChunk[]>([]);
  const [loadTime, setLoadTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showNavigateDrawer, setShowNavigateDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Load available sessions list (all sessions for Navigate drawer)
  useEffect(() => {
    async function fetchSessions() {
      try {
        const sessions = await getSessionSummaries({ limit: 100 });
        setAvailableSessions(sessions);
      } catch (err) {
        console.error('[Timeline] Failed to load sessions list:', err);
      }
    }

    fetchSessions();
  }, []);

  // Filtered sessions for Navigate drawer (search + date range)
  const filteredSessions = useMemo(() => {
    return availableSessions.filter(session => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const sessionId = session.metadata.session_id.toLowerCase();
        const createdAt = new Date(session.metadata.created_at).toLocaleString().toLowerCase();
        if (!sessionId.includes(query) && !createdAt.includes(query)) {
          return false;
        }
      }

      // Date range filter
      const sessionDate = new Date(session.metadata.created_at);
      if (dateRange.start && sessionDate < new Date(dateRange.start)) return false;
      if (dateRange.end && sessionDate > new Date(dateRange.end)) return false;

      return true;
    });
  }, [availableSessions, searchQuery, dateRange]);

  // Initialize session data and chunks on client only (avoid hydration mismatch)
  useEffect(() => {
    async function loadSession() {
      try {
        const start = performance.now();

        // Fetch first session from backend API
        const sessions = await getSessionSummaries({ limit: 1 });

        if (sessions.length === 0) {
          throw new Error('No sessions available from API');
        }

        const sessionId = sessions[0].metadata.session_id;

        // Fetch session detail (for metadata) and chunks (for timeline) in parallel
        const [detail, sessionChunks] = await Promise.all([
          getSessionDetail(sessionId),
          getSessionChunks(sessionId),
        ]);

        // Validate detail has required structure
        if (!detail || !detail.metadata || !detail.metadata.session_id) {
          throw new Error('Invalid session detail format from API');
        }

        const elapsed = performance.now() - start;
        setLoadTime(elapsed);

        // Convert backend format to SessionHeaderData
        setSessionData({
          metadata: {
            session_id: detail.metadata.session_id,
            thread_id: detail.metadata.thread_id || undefined,
            owner_hash: detail.metadata.owner_hash || undefined,
            created_at: detail.metadata.created_at,
            is_persisted: true,
            last_active: detail.timespan.end || detail.metadata.updated_at || new Date().toISOString(),
            interaction_count: detail.size.interaction_count,
          },
          timespan: detail.timespan,
          size: {
            ...detail.size,
            total_prompts_chars: 0,
            total_responses_chars: 0,
          },
          policy_badges: detail.policy_badges,
        });

        // Store chunks (instead of events)
        setChunks(sessionChunks);

        setError(null);
        console.log('[Timeline] Loaded from API in', elapsed.toFixed(0), 'ms', `(${sessionChunks.length} chunks)`);
      } catch (err) {
        console.error('[Timeline] API error:', err);
        setError(String(err));
      }
    }

    loadSession();
  }, []);

  // Load specific session
  const loadSpecificSession = async (sessionId: string) => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const start = performance.now();

      // Fetch session detail and chunks in parallel
      const [detail, sessionChunks] = await Promise.all([
        getSessionDetail(sessionId),
        getSessionChunks(sessionId),
      ]);

      if (!detail || !detail.metadata || !detail.metadata.session_id) {
        throw new Error('Invalid session detail format from API');
      }

      const elapsed = performance.now() - start;
      setLoadTime(elapsed);

      setSessionData({
        metadata: {
          session_id: detail.metadata.session_id,
          thread_id: detail.metadata.thread_id || undefined,
          owner_hash: detail.metadata.owner_hash || undefined,
          created_at: detail.metadata.created_at,
          is_persisted: true,
          last_active: detail.timespan.end || detail.metadata.updated_at || new Date().toISOString(),
          interaction_count: detail.size.interaction_count,
        },
        timespan: detail.timespan,
        size: {
          ...detail.size,
          total_prompts_chars: 0,
          total_responses_chars: 0,
        },
        policy_badges: detail.policy_badges,
      });

      setChunks(sessionChunks);
      setError(null);
      console.log('[Timeline] Loaded session', sessionId, 'in', elapsed.toFixed(0), 'ms', `(${sessionChunks.length} chunks)`);
    } catch (err) {
      console.error('[Timeline] Failed to load session:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log('[Timeline] Refreshing session data...');
    window.location.reload();
  };

  const handleExport = () => {
    console.log('[Timeline] Exporting session...');
    alert('Export functionality will be implemented in FI-UI-FEAT-105');
  };

  // Transform AudioChunks to TimelineEvent format (SOLID: Dependency Inversion)
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    return chunks.map((chunk, idx) => ({
      id: `chunk-${chunk.chunk_number}`,
      timestamp: chunk.created_at,
      type: 'transcription',
      content: chunk.transcript,
      metadata: {
        event_number: idx + 1,
        chunk_number: chunk.chunk_number,
        who: 'system',
        tags: ['transcription', chunk.language],
        confidence: chunk.confidence_score,
        // Audio-related metadata (complete from chunks)
        audio_hash: chunk.audio_hash,
        stt_provider: chunk.stt_provider,
        provider: chunk.stt_provider,
        duration: chunk.duration,
        language: chunk.language,
        latency_ms: chunk.latency_ms,
        audio_quality: chunk.audio_quality,
        timestamp_start: chunk.timestamp_start,
        timestamp_end: chunk.timestamp_end,
      },
    }));
  }, [chunks]);

  // Calculate metrics (for events with transcriptions)
  // Anti-Oracle: Show p95 latency (limits) not averages (promises)
  const metrics = useMemo(() => {
    const transcriptionEvents = timelineEvents.filter(e => e.type.toLowerCase() === 'transcription');
    const totalEvents = transcriptionEvents.length;
    const validEvents = transcriptionEvents.filter(e => e.content?.trim().length > 0).length;
    const emptyEvents = totalEvents - validEvents;
    const totalDuration = transcriptionEvents.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0);
    const avgDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;
    const successRate = totalEvents > 0 ? (validEvents / totalEvents) * 100 : 0;

    // Calculate p95 latency (Anti-Oracle principle)
    const latencies = transcriptionEvents.map(e => e.metadata?.latency_ms || 0).sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies.length > 0 ? latencies[p95Index] || 0 : 0;
    const avgLatency = transcriptionEvents.reduce((sum, e) => sum + (e.metadata?.latency_ms || 0), 0) / (totalEvents || 1);

    return {
      totalEvents,
      validEvents,
      emptyEvents,
      totalDuration,
      avgDuration,
      successRate,
      avgLatency,
      p95Latency, // Anti-Oracle: show realistic worst-case
    };
  }, [timelineEvents]);

  // Loading state while session data initializes
  if (!sessionData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-[15px] leading-6">Loading session data...</p>
        </div>
      </div>
    );
  }

  const headerConfig = timelineHeader({
    totalEvents: metrics.totalEvents,
    p95Latency: metrics.p95Latency,
    sessionId: sessionData?.metadata.session_id || '',
    successRate: metrics.successRate,
    totalDuration: metrics.totalDuration,
  })

  const headerActions = (
    <>
      <button
        onClick={handleRefresh}
        className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
      >
        Refresh
      </button>
      <button
        onClick={handleExport}
        className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
      >
        Export
      </button>
    </>
  )

  return (
    <div className="timeline-page min-h-screen bg-slate-950">
      <PageHeader {...headerConfig} actions={headerActions} />

      {/* Main Content - Full Width (Memoria Longitudinal Unificada: "No existen sesiones. Solo una conversación infinita") */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <main className="space-y-6">
            {/* Continuous Timeline Visualization (Memoria Longitudinal Unificada) */}
            {metrics.totalEvents > 0 && (
              <div className="p-6 rounded-xl border-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-emerald-700/30 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Conversación Continua
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Flujo temporal de eventos · Sin fragmentación
                    </p>
                  </div>
                  {timelineEvents.some(e => e.metadata?.timestamp_start !== undefined) ? (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">
                        {Math.max(...timelineEvents.map(e => e.metadata?.timestamp_end || 0)).toFixed(1)}s
                      </div>
                      <div className="text-xs text-slate-500">duración total</div>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400">
                      No timestamp data available
                    </span>
                  )}
                </div>

                {timelineEvents.some(e => e.metadata?.timestamp_start !== undefined) ? (
                  <div className="relative space-y-3 bg-slate-900/50 p-4 rounded-lg">
                    {timelineEvents
                      .filter(e => e.metadata?.timestamp_start !== undefined && e.metadata?.timestamp_end !== undefined)
                      .map((event, idx) => {
                        const maxTimestamp = Math.max(...timelineEvents.map(e => e.metadata?.timestamp_end || 0));
                        const left = ((event.metadata?.timestamp_start || 0) / maxTimestamp) * 100;
                        const width = (((event.metadata?.timestamp_end || 0) - (event.metadata?.timestamp_start || 0)) / maxTimestamp) * 100;
                        const hasTranscript = event.content.trim().length > 0;

                        return (
                          <div
                            key={event.id}
                            className="relative group"
                            title={`Event ${event.metadata?.event_number}: ${event.metadata?.timestamp_start?.toFixed(1)}s → ${event.metadata?.timestamp_end?.toFixed(1)}s`}
                          >
                            {/* Background track */}
                            <div className="h-12 rounded-lg flex items-center px-3 text-sm font-mono bg-slate-800/60 border border-slate-700/50">
                              <span className="text-slate-400 font-semibold">
                                #{event.metadata?.event_number}
                              </span>
                            </div>
                            {/* Event bar with gradient */}
                            <div
                              className={`absolute top-0 h-12 rounded-lg transition-all shadow-md group-hover:shadow-lg ${
                                hasTranscript
                                  ? 'bg-gradient-to-r from-emerald-600/70 to-green-500/70 border-2 border-emerald-400/60'
                                  : 'bg-gradient-to-r from-yellow-600/70 to-amber-500/70 border-2 border-yellow-400/60'
                              }`}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                              }}
                            >
                              <div className="h-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white/90">
                                  {event.metadata?.timestamp_start?.toFixed(1)}s
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Events don't have timestamp_start/timestamp_end data for gantt visualization.
                    <br />
                    <span className="text-xs text-slate-600">
                      (Available in transcription events from /chunks endpoint)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Unified Timeline - Audio Chunks */}
            <EventTimeline
              events={timelineEvents}
              config={timelineEventConfig}
              isLoading={false}
              error={error}
              onRefresh={handleRefresh}
              showHeader={false}
              className="rounded-2xl ring-1 ring-white/5 shadow-sm"
            />

        </main>
      </div>

      {/* Floating Navigate Button (Filosofía: Sessions as metadata filters, not primary navigation) */}
      <button
        onClick={() => setShowNavigateDrawer(!showNavigateDrawer)}
        className="fixed bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl border-2 border-emerald-500 transition-all hover:scale-110 z-40"
        title="Navigate conversations"
      >
        <Navigation className="w-6 h-6" />
      </button>

      {/* Navigate Drawer (Collapsible) */}
      {showNavigateDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowNavigateDrawer(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Navigate Timeline</h2>
                <button
                  onClick={() => setShowNavigateDrawer(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Current Session */}
              {sessionData && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-900 rounded-xl">
                  <div className="text-xs text-emerald-400 mb-2">Current Filter</div>
                  <div className="text-sm font-mono text-slate-200 break-all mb-2">
                    {sessionData.metadata.session_id}
                  </div>
                  <div className="text-xs text-slate-400">
                    {sessionData.timespan.duration_human} · {sessionData.size.interaction_count} interactions
                  </div>
                </div>
              )}

              {/* Search & Filters */}
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sessions..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-700 rounded"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Results Counter */}
                <div className="text-xs text-slate-400">
                  {filteredSessions.length} of {availableSessions.length} sessions
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session: any) => (
                    <button
                      key={session.metadata.session_id}
                      onClick={() => {
                        loadSpecificSession(session.metadata.session_id);
                        setShowNavigateDrawer(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        sessionData?.metadata.session_id === session.metadata.session_id
                          ? 'bg-emerald-950/50 border-emerald-700'
                          : 'bg-slate-800/50 border-slate-700 hover:border-emerald-700/50'
                      }`}
                    >
                      <div className="text-xs font-mono text-slate-400 mb-1">
                        {session.metadata.session_id.substring(0, 16)}...
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(session.metadata.created_at).toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {session.size.interaction_count} interactions · {session.timespan.duration_human}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No sessions found
                  </div>
                )}
              </div>

              {/* Manual Input */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <label className="text-xs text-slate-400">Or paste session ID directly:</label>
                <input
                  type="text"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  placeholder="Paste session ID..."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
                />
                <button
                  onClick={() => {
                    if (selectedSessionId) {
                      loadSpecificSession(selectedSessionId);
                      setShowNavigateDrawer(false);
                    }
                  }}
                  disabled={!selectedSessionId || loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl font-medium transition-colors disabled:text-slate-500"
                >
                  {loading ? 'Loading...' : 'Load Session'}
                </button>
              </div>

              {/* Philosophy Note */}
              <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                <p className="text-xs text-slate-400 italic">
                  💡 "No existen sesiones. Solo una conversación infinita" - Sessions are metadata filters on the continuous timeline.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
