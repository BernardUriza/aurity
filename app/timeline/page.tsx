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

import React, { useState, useEffect } from 'react';
import { SessionHeader } from '@/aurity/modules/fi-timeline';
import {
  generateMockSessionHeader,
  generateMockSessionHeaderWithStatus,
} from '@/aurity/modules/fi-timeline';
import type { SessionHeaderData } from '@/aurity/modules/fi-timeline';

export default function TimelinePage() {
  const [sessionData, setSessionData] = useState<SessionHeaderData | null>(null);
  const [statusScenario, setStatusScenario] = useState<string>('all-ok');

  // Initialize session data on client only (avoid hydration mismatch)
  useEffect(() => {
    setSessionData(generateMockSessionHeader());
  }, []);

  const handleRefresh = () => {
    console.log('[Timeline] Refreshing session data...');
    setSessionData(generateMockSessionHeader());
  };

  const handleExport = () => {
    console.log('[Timeline] Exporting session...');
    alert('Export functionality will be implemented in FI-UI-FEAT-105');
  };

  const handleScenarioChange = (scenario: string) => {
    setStatusScenario(scenario);

    switch (scenario) {
      case 'all-ok':
        setSessionData(
          generateMockSessionHeaderWithStatus('OK', 'OK', 'N/A', 'OK')
        );
        break;
      case 'hash-fail':
        setSessionData(
          generateMockSessionHeaderWithStatus('FAIL', 'OK', 'N/A', 'OK')
        );
        break;
      case 'policy-fail':
        setSessionData(
          generateMockSessionHeaderWithStatus('OK', 'FAIL', 'N/A', 'OK')
        );
        break;
      case 'redaction-ok':
        setSessionData(
          generateMockSessionHeaderWithStatus('OK', 'OK', 'OK', 'OK')
        );
        break;
      case 'all-pending':
        setSessionData(
          generateMockSessionHeaderWithStatus('PENDING', 'PENDING', 'PENDING', 'PENDING')
        );
        break;
      default:
        setSessionData(generateMockSessionHeader());
    }
  };

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
            {/* Demo Controls Card */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-100">
                    Demo Controls
                  </h2>
                  <span className="text-xs text-slate-500">Interactive</span>
                </div>

                <div className="space-y-4">
                  {/* Scenario selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Policy Status Scenario
                    </label>
                    <select
                      value={statusScenario}
                      onChange={(e) => handleScenarioChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-[15px] leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors"
                    >
                      <option value="all-ok">All OK (Hash ✓, Policy ✓, Audit ✓)</option>
                      <option value="hash-fail">Hash FAIL (integrity violated)</option>
                      <option value="policy-fail">Policy FAIL (mutation detected)</option>
                      <option value="redaction-ok">Redaction OK (PII removed)</option>
                      <option value="all-pending">All PENDING (verification in progress)</option>
                    </select>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleRefresh}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                    >
                      <span className="text-base">↻</span>
                      Refresh Session
                    </button>
                    <button
                      onClick={handleExport}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 border border-slate-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                    >
                      <span className="text-base">⇣</span>
                      Export Session
                    </button>
                  </div>
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
                Session Timeline
              </h1>
              <p className="text-sm text-slate-500">
                FI-UI-FEAT-100: Encabezado Contextual de Sesión
              </p>
            </div>

            {/* Features Card */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-100">
                    Features Implemented
                  </h3>
                </div>
                <ul className="space-y-2.5 text-[15px] leading-6">
                  {[
                    'Session ID display (session_YYYYMMDD_HHMMSS format)',
                    'Timespan with duration and human-readable format',
                    'Size metrics (interactions, tokens, chars)',
                    'Policy badges with 4 states (OK, FAIL, PENDING, N/A)',
                    'Sticky header on scroll',
                    'Refresh and export actions',
                    'Persisted status indicator',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Acceptance Criteria Card */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-100">
                    Acceptance Criteria
                  </h3>
                </div>
                <ul className="space-y-2.5 text-[15px] leading-6">
                  {[
                    'Session ID visible with format session_YYYYMMDD_HHMMSS',
                    'Timespan shows start → end with duration',
                    'Size shows interactions count and total tokens',
                    '4 policy badges (Hash/Policy/Redaction/Audit) with color coding',
                    'Sticky header remains at top on scroll',
                    'Responsive layout (mobile + desktop)',
                  ].map((criterion, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-emerald-600 mt-0.5">✓</span>
                      <span className="text-slate-300">{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Spacer for testing sticky header */}
            <div className="h-screen rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm flex items-center justify-center">
              <div className="text-center px-6">
                <div className="mb-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 ring-1 ring-slate-700">
                    <span className="text-2xl">↑</span>
                  </div>
                </div>
                <p className="text-slate-400 text-[15px] leading-6">
                  Scroll up to see the sticky header behavior
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  SessionHeader should remain fixed at top
                </p>
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="rounded-2xl border ring-1 ring-white/5 bg-slate-900 shadow-sm">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-100">
                    Next Steps
                  </h3>
                </div>
                <ul className="space-y-2.5 text-[15px] leading-6">
                  {[
                    { id: 'FI-UI-FEAT-101', title: 'Chips de Métrica por Interacción' },
                    { id: 'FI-UI-FEAT-103', title: 'Búsqueda y Filtros en Sesión' },
                    { id: 'FI-UI-FEAT-104', title: 'Panel de Metadatos Expandible' },
                    { id: 'FI-UI-FEAT-108', title: 'Virtualización y Budget de Render' },
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="inline-flex items-center rounded-lg bg-amber-950/30 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-900 mt-0.5">
                        {step.id}
                      </span>
                      <span className="text-slate-300">{step.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
