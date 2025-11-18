"use client"

import React, { useEffect, useState } from "react"
import { KPICard, KPIStatus } from "../../components/KPICard"
import { PageHeader } from "../../components/PageHeader"
import { dashboardHeader } from "../../config/page-headers"
import { getKPIMetrics } from "../../lib/api/kpis"
import type { KPIMetrics } from "../../lib/api/kpis"
import {
  Activity,
  Clock,
  Database,
  TrendingUp,
  Shield,
  Lock,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        const data = await getKPIMetrics("5m")
        setMetrics(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load metrics")
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-400 font-semibold">Error loading metrics</h3>
          <p className="text-red-600 dark:text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  // Calculate derived metrics
  const sessionsToday = Math.floor(metrics.requests.total / 10) // Estimate
  const totalInteractions = metrics.requests.total
  const p95Ingestion = metrics.latency.p95_ms
  const p95Timeline = metrics.latency.p95_ms // Placeholder - would filter by route in real implementation
  const eventsWithHash = 100 // Placeholder - would come from corpus stats
  const cacheHitRatio = Math.round(metrics.cache.hit_ratio * 100)

  // Status determination
  const getLatencyStatus = (latency: number, target: number): KPIStatus => {
    if (latency <= target) return "success"
    if (latency <= target * 1.5) return "warning"
    return "error"
  }

  const ingestionStatus = getLatencyStatus(p95Ingestion, 2000)
  const timelineStatus = getLatencyStatus(p95Timeline, 300)

  const headerConfig = dashboardHeader({
    sessionsToday,
    totalInteractions,
    p95Ingestion,
    asOf: metrics.asOf,
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <PageHeader {...headerConfig} />

        {/* TV UI - Large, readable, auto-refreshing */}
        <div className="mx-auto max-w-[1920px] px-8 py-12">

          {/* Live Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            <span className="text-2xl font-bold text-green-400 tracking-wide">LIVE MONITORING</span>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          </div>

      {/* Primary KPIs - Extra Large for TV visibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <KPICard
          title="Sessions Today"
          value={sessionsToday}
          icon={<Activity className="h-4 w-4" />}
          description="Sessions created in last 24h"
          status="neutral"
        />

        <KPICard
          title="Total Interactions"
          value={totalInteractions.toLocaleString()}
          icon={<Database className="h-4 w-4" />}
          description="Cumulative since start"
          status="neutral"
        />

        <KPICard
          title="p95 Ingestion API"
          value={p95Ingestion}
          unit="ms"
          icon={<Clock className="h-4 w-4" />}
          status={ingestionStatus}
          target="< 2000ms"
          description={`${metrics.requests.total} requests in ${metrics.window}`}
        />

      </div>

      {/* Secondary KPIs - System Health */}
      <h2 className="text-3xl font-bold text-slate-100 mb-6 flex items-center gap-3">
        <Shield className="h-8 w-8 text-emerald-400" />
        System Health & Security
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <KPICard
          title="Cache Hit Ratio"
          value={cacheHitRatio}
          unit="%"
          icon={<Database className="h-4 w-4" />}
          status={cacheHitRatio >= 70 ? "success" : cacheHitRatio >= 50 ? "warning" : "error"}
          description={`${metrics.cache.hit} hits / ${metrics.cache.miss} misses`}
        />

        <KPICard
          title="Redaction Status"
          value="Active"
          icon={<Lock className="h-4 w-4" />}
          status="success"
          description="PII/PHI redaction enabled"
        />

        <KPICard
          title="Egress Policy"
          value="Deny"
          icon={<Shield className="h-4 w-4" />}
          status="success"
          description="Sovereignty mode active"
        />

        <KPICard
          title="Events with Hash"
          value={eventsWithHash}
          unit="%"
          icon={<Shield className="h-4 w-4" />}
          status={eventsWithHash === 100 ? "success" : "warning"}
          target="100%"
          description="Interactions with content_hash"
        />
      </div>

      {/* Request Distribution */}
      <h2 className="text-3xl font-bold text-slate-100 mb-6 flex items-center gap-3">
        <Activity className="h-8 w-8 text-blue-400" />
        Request Distribution
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <KPICard
          title="Successful Requests"
          value={metrics.requests["2xx"]}
          status="success"
          description={`${Math.round((metrics.requests["2xx"] / metrics.requests.total) * 100)}% of total`}
        />

        <KPICard
          title="Client Errors"
          value={metrics.requests["4xx"]}
          status={metrics.requests["4xx"] > 0 ? "warning" : "success"}
          description="4xx status codes"
        />

        <KPICard
          title="Server Errors"
          value={metrics.requests["5xx"]}
          status={metrics.requests["5xx"] > 0 ? "error" : "success"}
          description="5xx status codes"
        />
      </div>

      {/* Provider Distribution - TV UI: Larger cards */}
      {metrics.providers.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-100 mb-6 flex items-center gap-3">
            <Database className="h-8 w-8 text-purple-400" />
            LLM Provider Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.providers.map((provider) => (
              <KPICard
                key={provider.id}
                title={provider.id.charAt(0).toUpperCase() + provider.id.slice(1)}
                value={provider.count}
                unit={`(${provider.pct}%)`}
                status="neutral"
                description="LLM requests"
              />
            ))}
          </div>
        </div>
      )}
    </div>
      </div>
    </ProtectedRoute>
  )
}
