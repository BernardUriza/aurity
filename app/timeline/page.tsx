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
import { SessionHeader } from '@/aurity/modules/fi-timeline';
import type { SessionHeaderData } from '@/aurity/modules/fi-timeline';
import { UserDisplay } from '@/components/UserDisplay';
import { getSessionSummaries, getSessionDetail, getSessionChunks, type AudioChunk } from '@/lib/api/timeline';
import { EventTimeline, type TimelineEvent } from '@/components/EventTimeline';
import { timelineEventConfig } from '@/lib/timeline-config';
import { Activity, CheckCircle2, Zap, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TimelinePage() {
  const [sessionData, setSessionData] = useState<SessionHeaderData | null>(null);
  const [chunks, setChunks] = useState<AudioChunk[]>([]);
  const [loadTime, setLoadTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load available sessions list
  useEffect(() => {
    async function fetchSessions() {
      try {
        const sessions = await getSessionSummaries({ limit: 20 });
        setAvailableSessions(sessions);
      } catch (err) {
        console.error('[Timeline] Failed to load sessions list:', err);
      }
    }

    fetchSessions();
  }, []);

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
  const metrics = useMemo(() => {
    const transcriptionEvents = timelineEvents.filter(e => e.type.toLowerCase() === 'transcription');
    const totalEvents = transcriptionEvents.length;
    const validEvents = transcriptionEvents.filter(e => e.content?.trim().length > 0).length;
    const emptyEvents = totalEvents - validEvents;
    const totalDuration = transcriptionEvents.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0);
    const avgDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;
    const successRate = totalEvents > 0 ? (validEvents / totalEvents) * 100 : 0;
    const avgLatency = transcriptionEvents.reduce((sum, e) => sum + (e.metadata?.latency_ms || 0), 0) / (totalEvents || 1);

    return {
      totalEvents,
      validEvents,
      emptyEvents,
      totalDuration,
      avgDuration,
      successRate,
      avgLatency,
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

  return (
    <div className="timeline-page min-h-screen bg-slate-950">
      {/* Top Navigation */}
      <div className="flex justify-end p-4">
        <UserDisplay />
      </div>

      {/* SessionHeader (sticky) */}
      <SessionHeader
        session={sessionData}
        sticky={true}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Main Content - with max-width container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid Layout - aside + main */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Aside - Demo Controls */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Session Selector Card */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-100">
                    Session Selector
                  </h2>
                  <span className="text-xs text-emerald-500">Required</span>
                </div>

                <div className="space-y-4">
                  {/* Current Session Display */}
                  {sessionData && (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-900 rounded-xl">
                      <div className="text-xs text-emerald-400 mb-1">Current Session</div>
                      <div className="text-sm font-mono text-slate-200 break-all">
                        {sessionData.metadata.session_id}
                      </div>
                    </div>
                  )}

                  {/* Session Dropdown */}
                  {availableSessions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Recent Sessions ({availableSessions.length})
                      </label>
                      <select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors"
                      >
                        <option value="">Select a session...</option>
                        {availableSessions.map((session) => (
                          <option key={session.metadata.session_id} value={session.metadata.session_id}>
                            {session.metadata.session_id.substring(0, 8)}... ({session.metadata.created_at})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Manual Session ID Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Or paste Session ID
                    </label>
                    <input
                      type="text"
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      placeholder="e.g., 1958eb21-34a3-49df-99e5-a74ca1db19db"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm font-mono focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors placeholder:text-slate-500"
                    />
                  </div>

                  {/* Load Button */}
                  <button
                    onClick={() => loadSpecificSession(selectedSessionId)}
                    disabled={!selectedSessionId || loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 border border-emerald-500 disabled:border-slate-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <span className="text-base">⇨</span>
                        Load Session
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Session Info Card */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Session Info</h3>
                <div className="space-y-3">
                  {loadTime > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Load Time</span>
                      <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        loadTime < 100
                          ? 'bg-emerald-950/30 text-emerald-300 ring-emerald-900'
                          : 'bg-amber-950/30 text-amber-300 ring-amber-900'
                      }`}>
                        {loadTime.toFixed(0)}ms {loadTime < 100 ? '✓' : '⚠'}
                      </span>
                    </div>
                  )}
                  {error && (
                    <div className="text-xs text-amber-400 bg-amber-950/20 rounded-lg px-3 py-2 border border-amber-900/50">
                      ⚠️ {error}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Interactions</span>
                    <span className="inline-flex items-center rounded-xl bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-slate-700">
                      {sessionData.size.interaction_count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total Tokens</span>
                    <span className="inline-flex items-center rounded-xl bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-slate-700">
                      {sessionData.size.total_tokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Duration</span>
                    <span className="inline-flex items-center rounded-xl bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-slate-700">
                      {sessionData.timespan.duration_human}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main - Session Timeline */}
          <main className="lg:col-span-8 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-2">
                Audio Transcription Timeline
              </h1>
              <p className="text-sm text-slate-500">
                Chunk-level transcription with gantt visualization · STT provider · Audio playback
              </p>
            </div>

            {/* Metrics Dashboard */}
            {metrics.totalEvents > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Events */}
                <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Total Events
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-50">
                      {metrics.totalEvents}
                    </span>
                  </div>
                </div>

                {/* Success Rate */}
                <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Success Rate
                      </span>
                    </div>
                    {metrics.successRate > 80 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : metrics.successRate > 50 ? (
                      <Minus className="w-4 h-4 text-slate-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-50">
                      {metrics.successRate.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                </div>

                {/* Avg Latency */}
                <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Avg Latency
                      </span>
                    </div>
                    {metrics.avgLatency < 100 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : metrics.avgLatency < 300 ? (
                      <Minus className="w-4 h-4 text-slate-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-50">
                      {metrics.avgLatency.toFixed(0)}
                    </span>
                    <span className="text-sm text-slate-400">ms</span>
                  </div>
                </div>

                {/* Total Duration */}
                <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Total Duration
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-50">
                      {metrics.totalDuration.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400">s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Trace (Gantt Chart) */}
            {metrics.totalEvents > 0 && (
              <div className="p-4 rounded-lg border bg-slate-800/30 border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-300">
                    Timeline Trace
                  </h4>
                  {timelineEvents.some(e => e.metadata?.timestamp_start !== undefined) ? (
                    <span className="text-xs text-slate-500">
                      {Math.max(...timelineEvents.map(e => e.metadata?.timestamp_end || 0)).toFixed(1)}s total
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400">
                      No timestamp data available
                    </span>
                  )}
                </div>

                {timelineEvents.some(e => e.metadata?.timestamp_start !== undefined) ? (
                  <div className="relative space-y-2">
                    {timelineEvents
                      .filter(e => e.metadata?.timestamp_start !== undefined && e.metadata?.timestamp_end !== undefined)
                      .map((event) => {
                        const maxTimestamp = Math.max(...timelineEvents.map(e => e.metadata?.timestamp_end || 0));
                        const left = ((event.metadata?.timestamp_start || 0) / maxTimestamp) * 100;
                        const width = (((event.metadata?.timestamp_end || 0) - (event.metadata?.timestamp_start || 0)) / maxTimestamp) * 100;
                        const hasTranscript = event.content.trim().length > 0;

                        return (
                          <div
                            key={event.id}
                            className="relative"
                            title={`Event ${event.metadata?.event_number}: ${event.metadata?.timestamp_start?.toFixed(1)}s → ${event.metadata?.timestamp_end?.toFixed(1)}s`}
                          >
                            <div className="h-8 rounded flex items-center px-2 text-xs font-mono bg-slate-700">
                              <span className="text-slate-400">
                                {event.metadata?.event_number}
                              </span>
                            </div>
                            <div
                              className={`absolute top-0 h-8 rounded transition-all ${
                                hasTranscript
                                  ? 'bg-green-500/40 border border-green-500/60'
                                  : 'bg-yellow-500/40 border border-yellow-500/60'
                              }`}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                              }}
                            />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
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
              className="rounded-2xl border ring-1 ring-white/5 shadow-sm"
            />

          </main>
        </div>
      </div>
    </div>
  );
}
