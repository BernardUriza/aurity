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

  // Keyboard shortcuts (1-8 only)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Number shortcuts 1-8
      if (e.key >= "1" && e.key <= "8") {
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <span>Shortcuts: 1-8 to navigate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
