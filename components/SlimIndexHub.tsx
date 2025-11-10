"use client";

/**
 * SlimIndexHub Component
 * Card: FI-UI-FEAT-209
 *
 * Minimal navigation hub - header + tiles + keyboard shortcuts only
 * Removed: KPIs, search, help modal, badges, online status
 * Target: ~100 lines (63% reduction from full IndexHub)
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NAV_ROUTES, getRouteByShortcut } from "@/lib/navigation";
import { AccessTile } from "./AccessTile";

export function SlimIndexHub() {
  const router = useRouter();

  // Keyboard shortcuts (1-9)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Number shortcuts 1-9
      if (e.key >= "1" && e.key <= "9") {
        const route = getRouteByShortcut(e.key);
        if (route) {
          e.preventDefault();
          router.push(route.href);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Minimal Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-50">Aurity Framework</h1>
              <span className="text-sm text-slate-400">v0.1.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* AURITY Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-b border-slate-600">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            {/* SVG Medical Symbol */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-emerald-400 flex-shrink-0">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {/* AURITY Acronym - Horizontal Layout */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-3 text-center">
                AURITY
              </h2>
              {/* Single Row Acronym */}
              <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
                <span className="text-slate-300">
                  <span className="font-bold text-emerald-400 text-xl">A</span>dvanced
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">
                  <span className="font-bold text-emerald-400 text-xl">U</span>niversal
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">
                  <span className="font-bold text-emerald-400 text-xl">R</span>eliable
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">
                  <span className="font-bold text-emerald-400 text-xl">I</span>ntelligence
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">for <span className="font-bold text-emerald-400 text-xl">T</span>elemedicine
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">
                  <span className="font-bold text-emerald-400 text-xl">Y</span>ield
                </span>
              </div>
            </div>

            {/* SVG Shield Symbol */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-cyan-400 flex-shrink-0">
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Component Showcase Link */}
        <div className="mb-8 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-300">Component Showcase</h3>
              <p className="text-sm text-slate-400 mt-1">Explore all UI components with live examples</p>
            </div>
            <a
              href="/showcase"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
            >
              View Showcase →
            </a>
          </div>
        </div>

        {/* Navigation Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {NAV_ROUTES.map((route) => (
            <AccessTile key={route.id} route={route} />
          ))}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-12 text-sm text-slate-400">
            <span>Shortcuts: 1-9 to navigate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
