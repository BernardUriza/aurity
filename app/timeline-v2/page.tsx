/**
 * Timeline Page v2 - Master-Detail Layout
 *
 * 2-panel layout: SessionList (col-4) | SessionDetail (col-8)
 * URL state sync: ?s=sessionId
 *
 * Card: FI-UI-FEAT-202
 * Philosophy: AURITY determinism - same action, same result
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SessionList } from '@/ui/components/timeline/SessionList';
import { SessionDetail } from '@/ui/components/timeline/SessionDetail';
import { useTimelineStore } from '@/ui/stores/timeline-store';
import { DemoBanner } from '@/components/demo-banner';
import { isDemoMode, getDemoAdapterIfEnabled, updateDemoConfig } from '@/lib/api/timeline-adapter';
import type { DemoConfig } from '@/lib/demo/types';

export default function TimelineV2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedSessionId, setSelectedSessionId } = useTimelineStore();

  // Demo mode state
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [demoConfig, setDemoConfig] = useState<DemoConfig | null>(null);
  const [demoManifest, setDemoManifest] = useState<any>(null);

  // Load demo state on mount
  useEffect(() => {
    const enabled = isDemoMode();
    setDemoEnabled(enabled);

    if (enabled) {
      const adapter = getDemoAdapterIfEnabled();
      if (adapter) {
        setDemoConfig(adapter.getConfig());
        setDemoManifest(adapter.getManifest());
      }
    }
  }, []);

  const handleDemoConfigUpdate = (newConfig: DemoConfig) => {
    updateDemoConfig(newConfig);
    setDemoConfig(newConfig);

    // Reload sessions with new config
    window.location.reload();
  };

  // Sync URL with store on mount
  useEffect(() => {
    const sessionIdFromURL = searchParams.get('s');
    if (sessionIdFromURL && sessionIdFromURL !== selectedSessionId) {
      setSelectedSessionId(sessionIdFromURL);
    }
  }, [searchParams]);

  // Sync store with URL when selection changes
  useEffect(() => {
    const sessionIdFromURL = searchParams.get('s');

    if (selectedSessionId && selectedSessionId !== sessionIdFromURL) {
      // Update URL without navigation
      const params = new URLSearchParams(searchParams.toString());
      params.set('s', selectedSessionId);
      router.replace(`/timeline-v2?${params.toString()}`, { scroll: false });
    } else if (!selectedSessionId && sessionIdFromURL) {
      // Clear URL param if session is deselected
      const params = new URLSearchParams(searchParams.toString());
      params.delete('s');
      router.replace(`/timeline-v2?${params.toString()}`, { scroll: false });
    }
  }, [selectedSessionId]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Demo Banner */}
      {demoEnabled && demoConfig && (
        <DemoBanner
          config={demoConfig}
          manifest={demoManifest}
          onConfigUpdate={handleDemoConfigUpdate}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-100">Session Timeline</h1>
              <p className="text-xs text-slate-500 mt-0.5">FI-UI-FEAT-202: 2-Panel Master-Detail</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">AURITY v0.1.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 2-Panel Grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-140px)]">
          {/* Left Panel: Session List (Master) */}
          <aside className="lg:col-span-4 h-full">
            <div className="h-full rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                <h2 className="text-sm font-semibold text-slate-300">Sessions</h2>
              </div>
              <div className="h-[calc(100%-52px)]">
                <SessionList />
              </div>
            </div>
          </aside>

          {/* Right Panel: Session Detail (Detail) */}
          <section className="lg:col-span-8 h-full">
            <div className="h-full rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
              <SessionDetail />
            </div>
          </section>
        </div>
      </main>

      {/* Footer - Metrics */}
      <footer className="sticky bottom-0 z-10 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>Keyboard: ↑↓ Navigate • Enter Select</span>
              <span>•</span>
              <span>PgUp/PgDn in Events</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedSessionId && (
                <span className="text-emerald-400">Session {selectedSessionId.substring(0, 8)}... selected</span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
