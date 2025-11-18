'use client';

/**
 * Personal History Timeline Page
 *
 * Connected to real HDF5 sessions via Timeline API
 * Shows user's medical consultation history
 */

import React, { useState, useEffect } from 'react';
import { getSessionSummaries } from '@/lib/api/timeline';
import { UserDisplay } from '@/components/UserDisplay';

interface Session {
  id: string;
  timestamp: string;
  title: string;
  summary: string;
  metadata: {
    sessionId: string;
    interactions: number;
    duration?: string;
  };
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // Load real sessions from HDF5
  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true);
        const summaries = await getSessionSummaries({ limit: 100 });

        const sessionData: Session[] = summaries.map((summary: any) => ({
          id: summary.metadata.session_id,
          timestamp: summary.metadata.created_at,
          title: `Medical Session ${summary.metadata.session_id.substring(0, 8)}`,
          summary: `${summary.size.interaction_count} interactions · ${summary.timespan.duration_human}`,
          metadata: {
            sessionId: summary.metadata.session_id,
            interactions: summary.size.interaction_count,
            duration: summary.timespan.duration_human,
          },
        }));

        setSessions(sessionData);
        setError(null);
      } catch (err) {
        console.error('[History] Failed to load sessions:', err);
        setError('Failed to load session history');
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, []);

  const filteredSessions = sessions.filter(session => {
    // Filter by search query
    if (searchQuery && !session.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !session.summary.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !session.metadata.sessionId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by date range
    if (dateRange.start && new Date(session.timestamp) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(session.timestamp) > new Date(dateRange.end)) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur border-b bg-slate-900/80 border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                Medical Session History
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {loading ? 'Loading...' : `${filteredSessions.length} sessions · Real HDF5 data`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <UserDisplay />
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors">
                <span>⇣</span>
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Search */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Búsqueda</h3>
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              />
            </div>


            {/* Date Range */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Rango de Fechas</h3>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Sessions</span>
                  <span className="text-slate-300 font-medium">{filteredSessions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Interactions</span>
                  <span className="text-slate-300 font-medium">
                    {sessions.reduce((sum, s) => sum + s.metadata.interactions, 0)}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Sessions List */}
          <main className="lg:col-span-9">
            <div className="space-y-4">
              {loading ? (
                <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading sessions from HDF5...</p>
                </div>
              ) : error ? (
                <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-12 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">⚠️</span>
                  </div>
                  <p className="text-slate-400">{error}</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-12 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">🔍</span>
                  </div>
                  <p className="text-slate-400">No sessions found</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Try adjusting your search filters
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm p-6 hover:ring-white/10 transition-all cursor-pointer"
                    onClick={() => window.location.href = `/timeline?session=${session.metadata.sessionId}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center text-xl">
                          🏥
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-semibold text-slate-100 mb-1">
                              {session.title}
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                              {session.summary}
                            </p>
                          </div>
                          <span className="text-2xl text-emerald-500">→</span>
                        </div>

                        {/* Metadata */}
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-slate-500">
                            {new Date(session.timestamp).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-800/60 text-xs text-slate-400 ring-1 ring-slate-700 font-mono">
                            {session.metadata.sessionId.substring(0, 8)}...
                          </span>

                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-950/30 text-xs text-emerald-400 ring-1 ring-emerald-900">
                            {session.metadata.interactions} interactions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
