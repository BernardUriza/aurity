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
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-page min-h-screen bg-gray-950">
      {/* SessionHeader (sticky) */}
      <SessionHeader
        session={sessionData}
        sticky={true}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Demo Controls */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Demo Controls
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Policy Status Scenario:
              </label>
              <select
                value={statusScenario}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="all-ok">All OK (Hash ✓, Policy ✓, Audit ✓)</option>
                <option value="hash-fail">Hash FAIL (integrity violated)</option>
                <option value="policy-fail">Policy FAIL (mutation detected)</option>
                <option value="redaction-ok">Redaction OK (PII removed)</option>
                <option value="all-pending">All PENDING (verification in progress)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600 transition-colors"
              >
                ↻ Refresh Session
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-blue-200 rounded border border-blue-600 transition-colors"
              >
                ⇣ Export Session
              </button>
            </div>
          </div>
        </div>

        {/* Demo Content (scrollable to test sticky header) */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Session Timeline
          </h2>

          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">FI-UI-FEAT-100:</strong> Encabezado Contextual de Sesión
            </p>

            <div className="bg-gray-800 border border-gray-700 rounded p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Features Implemented</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Session ID display (session_YYYYMMDD_HHMMSS format)</li>
                <li>Timespan with duration and human-readable format</li>
                <li>Size metrics (interactions, tokens, chars)</li>
                <li>Policy badges with 4 states (OK, FAIL, PENDING, N/A)</li>
                <li>Sticky header on scroll</li>
                <li>Refresh and export actions</li>
                <li>Persisted status indicator</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Acceptance Criteria ✓</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>✅ Session ID visible with format session_YYYYMMDD_HHMMSS</li>
                <li>✅ Timespan shows start → end with duration</li>
                <li>✅ Size shows interactions count and total tokens</li>
                <li>✅ 4 policy badges (Hash/Policy/Redaction/Audit) with color coding</li>
                <li>✅ Sticky header remains at top on scroll</li>
                <li>✅ Responsive layout (mobile + desktop)</li>
              </ul>
            </div>

            {/* Spacer for testing sticky header */}
            <div className="h-screen bg-gray-800 border border-gray-700 rounded p-4 flex items-center justify-center">
              <p className="text-gray-400 text-center">
                Scroll up to see the sticky header behavior
                <br />
                <span className="text-sm">(SessionHeader should remain fixed at top)</span>
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Next Steps</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>FI-UI-FEAT-101: Chips de Métrica por Interacción</li>
                <li>FI-UI-FEAT-103: Búsqueda y Filtros en Sesión</li>
                <li>FI-UI-FEAT-104: Panel de Metadatos Expandible</li>
                <li>FI-UI-FEAT-108: Virtualización y Budget de Render</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
