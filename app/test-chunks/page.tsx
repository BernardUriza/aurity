"use client";

/**
 * Test Chunks Page - Monitoring Dashboard
 *
 * Professional chunk monitoring interface with advanced observability features.
 */

import { useState } from "react";
import { ChunkBreakdown } from "@/components/ChunkBreakdown";
import { ArrowLeft, Play, Settings } from "lucide-react";
import Link from "next/link";

export default function TestChunksPage() {
  const [sessionId, setSessionId] = useState("69378bee-5a11-480f-ba99-706f73e6f554");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-50">
                  Chunk Monitoring Dashboard
                </h1>
                <p className="text-sm text-slate-400">
                  Real-time observability & tracing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
                <Play className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-400">
                  {autoRefresh ? `Live (${refreshInterval}ms)` : "Paused"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls card */}
        <div className="mb-6 p-5 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Session ID */}
            <div className="lg:col-span-2">
              <label className="block text-slate-400 mb-2 text-sm font-medium">
                Session ID
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="Enter session ID..."
              />
            </div>

            {/* Auto-refresh controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500/50"
                />
                <label htmlFor="autoRefresh" className="text-slate-300 text-sm font-medium">
                  Auto-refresh
                </label>
              </div>

              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                >
                  <option value={1000}>1s interval</option>
                  <option value={2000}>2s interval</option>
                  <option value={5000}>5s interval</option>
                  <option value={10000}>10s interval</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Chunk Breakdown Component */}
        <ChunkBreakdown
          sessionId={sessionId}
          autoRefresh={autoRefresh}
          refreshInterval={refreshInterval}
          darkMode={true}
          apiBaseUrl="http://localhost:7001"
        />
      </div>
    </div>
  );
}
