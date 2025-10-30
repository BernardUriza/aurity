// =============================================================================
// AURITY FRAMEWORK - Dashboard Page
// =============================================================================
// FI-UI-FEAT-001: Dashboard Local con Timeline
// Sprint: SPR-2025W44
// Version: 0.1.0
// =============================================================================

'use client';

import { useEffect, useState } from 'react';

interface CorpusStats {
  total_interactions: number;
  total_sessions: number;
  total_tokens: number;
  corpus_size_bytes: number;
  date_range: {
    earliest: string;
    latest: string;
  };
}

interface Session {
  session_id: string;
  interaction_count: number;
  total_tokens: number;
  first_timestamp: string;
  last_timestamp: string;
  preview: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<CorpusStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Fetch corpus stats from FastAPI backend (port 9001)
        const statsResponse = await fetch('http://localhost:9001/api/corpus/stats');
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
        }
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch sessions summary
        const sessionsResponse = await fetch('http://localhost:9001/api/sessions/summary');
        if (!sessionsResponse.ok) {
          throw new Error(`Failed to fetch sessions: ${sessionsResponse.status}`);
        }
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen bg-slate-900 flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen bg-slate-900 flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-slate-300">{error}</p>
          <p className="text-sm text-slate-500 mt-4">
            Make sure the FastAPI backend is running on port 9001
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-50 mb-2">
            Free Intelligence Dashboard
          </h1>
          <p className="text-slate-400">
            Local corpus analytics and session timeline
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Total Interactions
              </h3>
              <p className="text-3xl font-bold text-emerald-400">
                {stats.total_interactions.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Sessions
              </h3>
              <p className="text-3xl font-bold text-emerald-400">
                {stats.total_sessions.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Total Tokens
              </h3>
              <p className="text-3xl font-bold text-emerald-400">
                {stats.total_tokens.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Corpus Size
              </h3>
              <p className="text-3xl font-bold text-emerald-400">
                {(stats.corpus_size_bytes / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        {/* Session Timeline */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-slate-50">
              Session Timeline
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Recent conversation sessions from your local corpus
            </p>
          </div>

          <div className="divide-y divide-slate-700">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No sessions found in corpus
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="p-6 hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-mono text-sm text-slate-200 font-medium">
                        {session.session_id}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(session.first_timestamp).toLocaleString()} -{' '}
                        {new Date(session.last_timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-400">
                      <span>{session.interaction_count} interactions</span>
                      <span>{session.total_tokens.toLocaleString()} tokens</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded p-3 text-sm text-slate-300">
                    <p className="line-clamp-2">{session.preview}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Sprint: SPR-2025W44 | FI-UI-FEAT-001 | Version: 0.1.0</p>
          <p className="mt-2">Local-first architecture - All data resides on your machine</p>
        </div>
      </div>
    </main>
  );
}
