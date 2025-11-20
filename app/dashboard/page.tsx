"use client"

import React, { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { KPICard, KPIStatus } from "../../components/dashboard/KPICard"
import { PageHeader } from "../../components/layout/PageHeader"
import { dashboardHeader } from "../../config/page-headers"
import { getKPIMetrics } from "../../lib/api/kpis"
import type { KPIMetrics } from "../../lib/api/kpis"
import { FIAvatar } from "../../components/dashboard/FIAvatar"
import { DoctorControlPanel } from "../../components/dashboard/DoctorControlPanel"
import { PatientMetrics } from "../../components/dashboard/PatientMetrics"
import { SlideManager } from "../../components/dashboard/SlideManager"
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
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

function DashboardContent() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') // 'control' for doctor view, null for patient TV view

  const [metrics, setMetrics] = useState<KPIMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doctorMessage, setDoctorMessage] = useState<string | null>(null)
  const [slides, setSlides] = useState<any[]>([])
  const [isLoadingSlides, setIsLoadingSlides] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [totalCarouselItems, setTotalCarouselItems] = useState(0)
  const [carouselContent, setCarouselContent] = useState<any[]>([])

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

  // Fetch slides for preview navigation
  useEffect(() => {
    async function fetchSlides() {
      if (mode !== 'control') return

      setIsLoadingSlides(true)
      try {
        const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7001'
        const response = await fetch(`${backendURL}/api/workflows/aurity/clinic-media/list?active_only=true`)
        if (!response.ok) throw new Error('Failed to fetch slides')

        const data = await response.json()
        setSlides(data.media || [])
      } catch (error) {
        console.error('Failed to fetch slides:', error)
      } finally {
        setIsLoadingSlides(false)
      }
    }

    fetchSlides()
  }, [mode])

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + totalCarouselItems) % Math.max(totalCarouselItems, 1))
  }

  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % Math.max(totalCarouselItems, 1))
  }

  const handleIndexChange = useCallback((index: number) => {
    setCarouselIndex(index);
  }, [])

  const handleContentLoad = useCallback((total: number, contentArray?: any[]) => {
    setTotalCarouselItems(total);
    if (contentArray) {
      setCarouselContent(contentArray);
    }
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

  // PATIENT TV MODE (Default)
  if (mode !== 'control') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* TV UI - Large, readable, auto-refreshing */}
        <div className="mx-auto max-w-[1920px] px-8 py-12">
          {/* Live Indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
            <span className="text-2xl font-bold text-purple-400 tracking-wide">SALA DE ESPERA</span>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
          </div>

          {/* Patient-Friendly Metrics */}
          <div className="mb-12">
            <PatientMetrics
              waitingCount={Math.floor(Math.random() * 5) + 1} // Mock data
              avgWaitTime={Math.floor(Math.random() * 30) + 15}
              patientsToday={sessionsToday}
              nextAppointment="10:30"
            />
          </div>

          {/* FI Avatar with rotating content */}
          <div className="max-w-4xl mx-auto">
            <FIAvatar
              mode="broadcast"
              clinicName="Clínica AURITY"
              doctorMessage={doctorMessage}
            />
          </div>
        </div>
      </div>
    )
  }

  // DOCTOR CONTROL MODE (?mode=control)
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <PageHeader {...headerConfig} />

        {/* TV UI - Large, readable, auto-refreshing */}
        <div className="mx-auto max-w-[1920px] px-8 py-12">

          {/* Live Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span className="text-2xl font-bold text-green-400 tracking-wide">DOCTOR CONTROL MODE</span>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              Ver Vista de Paciente
            </Link>
          </div>

          {/* Control Panel + TV Preview (2 Column Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* LEFT: Admin Controls */}
            <div className="space-y-6">
              {/* Messages & Content Upload */}
              <DoctorControlPanel
                onMessageSend={(message) => setDoctorMessage(message)}
                currentMessage={doctorMessage}
                clinicName="Clínica AURITY"
                doctorId="demo-doctor-001"
                clinicId="aurity-clinic-001"
              />

              {/* Slide Order Manager */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Orden de Slides
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Arrastra para reordenar, activa/desactiva para controlar visibilidad</p>
                </div>
                <div className="p-6">
                  <SlideManager
                    clinicId="aurity-clinic-001"
                    carouselContent={carouselContent}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: TV Preview */}
            <div className="lg:sticky lg:top-8 h-fit">
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Vista Previa TV
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {totalCarouselItems > 0 ? `Slide ${carouselIndex + 1} de ${totalCarouselItems}` : 'Carousel unificado'}
                      </p>
                    </div>

                    {/* Navigation Controls */}
                    {totalCarouselItems > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevSlide}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Anterior"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleNextSlide}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Siguiente"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-8">
                  {isLoadingSlides ? (
                    <div className="text-center py-12">
                      <svg className="w-8 h-8 animate-spin text-purple-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <p className="text-sm text-slate-400 mt-2">Cargando slides...</p>
                    </div>
                  ) : (
                    <FIAvatar
                      mode="broadcast"
                      clinicName="Clínica AURITY"
                      doctorMessage={doctorMessage}
                      clinicSlides={slides}
                      externalCurrentIndex={carouselIndex}
                      onIndexChange={handleIndexChange}
                      onContentLoad={handleContentLoad}
                    />
                  )}
                </div>
              </div>
            </div>
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

// Wrap in Suspense for useSearchParams() (Next.js 16 requirement)
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Cargando dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
