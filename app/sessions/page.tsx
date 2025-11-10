/**
 * Free Intelligence - Sessions Page
 *
 * /sessions route - list all sessions with pagination.
 *
 * File: apps/aurity/app/sessions/page.tsx
 * Card: FI-UI-FEAT-201
 * Created: 2025-10-29
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionsTable } from "../../components/SessionsTable";
import { getSessions } from "../../lib/api/apiClient";
import type { Session } from "../../types/session";

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    loadSessions();
  }, [offset]);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getSessions({ limit, offset });
      setSessions(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    router.push(`/sessions/${sessionId}`);
  };

  const handlePrevPage = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-50">Sessions</h1>
          <div className="text-sm text-slate-400">
            {total} total sessions
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400">
            Loading sessions...
          </div>
        ) : (
          <>
            <SessionsTable
              sessions={sessions}
              onSelectSession={handleSelectSession}
            />

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                  className="px-4 py-2 bg-slate-700 text-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                >
                  Previous
                </button>

                <span className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={offset + limit >= total}
                  className="px-4 py-2 bg-slate-700 text-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
