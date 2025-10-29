"use client";

/**
 * IndexHub Component
 * Card: FI-UI-FEAT-208
 *
 * Main hub component with navigation tiles, KPIs, and shortcuts
 */

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, HelpCircle, Wifi, WifiOff } from "lucide-react";
import { NAV_ROUTES, getRouteByShortcut } from "@/lib/navigation";
import { AccessTile } from "./AccessTile";

interface KPIs {
  sessionsToday: string;
  p95Ingest: string;
  p95Read: string;
}

export function IndexHub() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [kpis, setKPIs] = useState<KPIs>({
    sessionsToday: "—",
    p95Ingest: "—",
    p95Read: "—",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Fetch KPIs with timeout
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 300);

        const res = await fetch("/api/kpis", { signal: controller.signal });
        const data = await res.json();

        clearTimeout(timeout);
        setKPIs({
          sessionsToday: data.sessionsToday ?? "—",
          p95Ingest: `${data.p95Ingest ?? "—"}ms`,
          p95Read: `${data.p95Read ?? "—"}ms`,
        });
        setIsOnline(true);
      } catch (err) {
        // Fallback to mock data
        setKPIs({
          sessionsToday: "—",
          p95Ingest: "—",
          p95Read: "—",
        });
        setIsOnline(false);
      }
    };

    fetchKPIs();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Shortcuts 1-8
      if (e.key >= "1" && e.key <= "8") {
        const route = getRouteByShortcut(e.key);
        if (route) {
          e.preventDefault();
          router.push(route.href);
        }
      }
      // Search shortcut
      else if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Help shortcut
      else if (e.key === "?") {
        e.preventDefault();
        setShowHelp(!showHelp);
      }
      // Escape to close help
      else if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router, showHelp]);

  // Filter routes by search query
  const filteredRoutes = NAV_ROUTES.filter(
    (route) =>
      route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-50">Aurity Framework</h1>
              <span className="text-sm text-slate-400">v0.1.0</span>
              <span className="px-2 py-1 text-xs font-medium text-orange-300 bg-orange-500/10 rounded">
                Sprint 44
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Badges */}
              <span className="px-2 py-1 text-xs font-medium text-green-300 bg-green-500/10 rounded">
                Egreso=deny
              </span>
              <span className="px-2 py-1 text-xs font-medium text-green-300 bg-green-500/10 rounded">
                PHI=off
              </span>

              {/* Online status */}
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" aria-label="Online" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" aria-label="Offline" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-sm text-slate-400">Sesiones hoy</p>
            <p className="text-2xl font-bold text-slate-50 mt-1">{kpis.sessionsToday}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-sm text-slate-400">p95 Ingest</p>
            <p className="text-2xl font-bold text-slate-50 mt-1">{kpis.p95Ingest}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-sm text-slate-400">p95 Read</p>
            <p className="text-2xl font-bold text-slate-50 mt-1">{kpis.p95Read}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search routes... (press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 text-slate-50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRoutes.map((route) => (
            <AccessTile key={route.id} route={route} />
          ))}
        </div>

        {/* Empty state */}
        {filteredRoutes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No routes found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300"
            >
              Clear search
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/95 backdrop-blur mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 text-sm text-slate-400">
            <div className="flex items-center gap-4">
              <span>Shortcuts: 1-8 (navigate), / (search), ? (help)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>v0.1.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-slate-300"
                aria-label="Close help"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Navigation</h3>
                <div className="space-y-1 text-sm">
                  {NAV_ROUTES.map((route) => (
                    <div key={route.id} className="flex items-center justify-between">
                      <span className="text-slate-400">{route.title}</span>
                      <kbd className="px-2 py-1 text-xs bg-slate-700 rounded">{route.shortcut}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Other</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Search</span>
                    <kbd className="px-2 py-1 text-xs bg-slate-700 rounded">/</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Help</span>
                    <kbd className="px-2 py-1 text-xs bg-slate-700 rounded">?</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Close modal</span>
                    <kbd className="px-2 py-1 text-xs bg-slate-700 rounded">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
