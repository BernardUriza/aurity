/**
 * Free Intelligence - Session Detail Page
 *
 * /sessions/[id] route - displays session detail with metadata.
 *
 * File: apps/aurity/app/sessions/[id]/page.tsx
 * Card: FI-UI-FEAT-202
 * Created: 2025-10-29
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "../../../ui/lib/apiClient";
import type { Session } from "../../../ui/types/session";
import ExportModal from "../../../ui/components/ExportModal";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await getSession(sessionId);
      setSession(data);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("not found") || err.message.includes("404")) {
          setNotFound(true);
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load session");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      complete: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 text-gray-500">
          Loading session...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Session Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The session with ID &ldquo;{sessionId}&rdquo; could not be found.
          </p>
          <button
            onClick={() => router.push("/sessions")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push("/sessions")}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
        >
          Back to Sessions
        </button>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => router.push("/sessions")}
              className="text-emerald-400 hover:text-emerald-300 mb-2 inline-block"
            >
              ← Back to Sessions
            </button>
            <h1 className="text-3xl font-bold text-slate-50">Session Detail</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setExportModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Export
            </button>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(
                session.status
              )}`}
            >
              {session.status}
            </span>
          </div>
        </div>

        {/* Session Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-50 mb-4">
              Basic Information
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-slate-400">Session ID</dt>
                <dd className="mt-1 text-sm text-slate-200 font-mono">
                  {session.id}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-400">Owner Hash</dt>
                <dd className="mt-1 text-sm text-slate-200 font-mono">
                  {session.owner_hash}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-400">Thread ID</dt>
                <dd className="mt-1 text-sm text-slate-200 font-mono">
                  {session.thread_id || "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-400">Persisted</dt>
                <dd className="mt-1 text-sm text-slate-200">
                  {session.is_persisted ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Timestamps */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-50 mb-4">
              Timestamps
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-slate-400">Created</dt>
                <dd className="mt-1 text-sm text-slate-200">
                  {formatDate(session.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-400">Updated</dt>
                <dd className="mt-1 text-sm text-slate-200">
                  {formatDate(session.updated_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-400">
                  Last Active
                </dt>
                <dd className="mt-1 text-sm text-slate-200">
                  {formatDate(session.last_active)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Metrics */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-50 mb-4">Metrics</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-slate-400">
                  Interactions
                </dt>
                <dd className="mt-1 text-3xl font-bold text-emerald-400">
                  {session.interaction_count}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Export Modal */}
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          sessionId={session.id}
          sessionPreview={`Session ${session.id.slice(0, 8)}... (${session.status})`}
        />
      </div>
    </div>
  );
}
