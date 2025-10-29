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
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Make sure the FastAPI backend is running on port 9001
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Free Intelligence Dashboard
          </h1>
          <p className="text-gray-600">
            Local corpus analytics and session timeline
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Total Interactions
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.total_interactions.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Sessions
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.total_sessions.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Total Tokens
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.total_tokens.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Corpus Size
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {(stats.corpus_size_bytes / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        {/* Session Timeline */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Session Timeline
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Recent conversation sessions from your local corpus
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No sessions found in corpus
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-mono text-sm text-gray-900 font-medium">
                        {session.session_id}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(session.first_timestamp).toLocaleString()} -{' '}
                        {new Date(session.last_timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{session.interaction_count} interactions</span>
                      <span>{session.total_tokens.toLocaleString()} tokens</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                    <p className="line-clamp-2">{session.preview}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Sprint: SPR-2025W44 | FI-UI-FEAT-001 | Version: 0.1.0</p>
          <p className="mt-2">Local-first architecture - All data resides on your machine</p>
        </div>
      </div>
    </main>
  );
}
