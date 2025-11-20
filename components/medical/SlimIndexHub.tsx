"use client";

/**
 * SlimIndexHub Component
 * Card: FI-UI-FEAT-209
 *
 * Minimal navigation hub - header + tiles + keyboard shortcuts only
 * Updated: HIPAA G-003 - Integrated UserDisplay in header
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NAV_ROUTES, getRouteByShortcut } from "@/lib/navigation";
import { AccessTile } from "./AccessTile";
import { AurityBanner } from "./AurityBanner";

export function SlimIndexHub() {
  const router = useRouter();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Check onboarding status
  useEffect(() => {
    const completed = localStorage.getItem('aurity_onboarding_completed') === 'true';
    setOnboardingCompleted(completed);
  }, []);

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
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Abstract geometric background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-emerald-400 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-cyan-400 rounded-full blur-3xl" />
      </div>

      {/* AURITY Banner */}
      <AurityBanner />

      {/* Main Content */}
      <main className="relative flex-1 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        {/* Onboarding Banner - Neo-minimalist glassmorphism */}
        {!onboardingCompleted && (
          <div className="mb-8 p-6 bg-blue-950/30 backdrop-blur-xl border border-blue-800/30 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-blue-200 tracking-tight">Welcome to Aurity Framework</h3>
                <p className="text-sm text-slate-300/80 mt-2 font-light">Complete the quick onboarding to get started with the platform</p>
              </div>
              <a
                href="/onboarding"
                className="px-6 py-3 bg-blue-600/90 hover:bg-blue-500 backdrop-blur text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]"
              >
                Start Onboarding →
              </a>
            </div>
          </div>
        )}

        {/* Medical AI Workflow - Neo-minimalist glassmorphism */}
        <div className={`mb-8 p-6 bg-emerald-950/30 backdrop-blur-xl border border-emerald-800/30 rounded-2xl shadow-lg hover:shadow-xl transition-all relative ${
          !onboardingCompleted ? 'opacity-50 pointer-events-none' : ''
        }`}>
          {!onboardingCompleted && (
            <div className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 rounded-lg text-xs text-slate-300 font-medium shadow-md">
              🔒 Complete onboarding first
            </div>
          )}
          <div className="flex items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-emerald-200 tracking-tight">Medical AI Workflow</h3>
              <p className="text-sm text-slate-300/80 mt-2 font-light">AI-powered medical consultation workflow with transcription</p>
            </div>
            <a
              href="/medical-ai"
              className="px-6 py-3 bg-emerald-600/90 hover:bg-emerald-500 backdrop-blur text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              Start Workflow →
            </a>
          </div>
        </div>

        {/* Navigation Tiles Grid - Neo-minimalist spacing */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${
          !onboardingCompleted ? 'opacity-50 pointer-events-none' : ''
        }`}>
          {NAV_ROUTES.filter(route => route.id !== 'onboarding').map((route) => (
            <AccessTile key={route.id} route={route} />
          ))}
        </div>
      </main>

      {/* Minimal Footer - Neo-minimalist glassmorphism */}
      <footer className="relative border-t border-slate-700/50 bg-slate-900/60 backdrop-blur-xl shadow-lg">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-center h-14 text-sm text-slate-400/80 font-light tracking-wide">
            <span>Shortcuts: 1-9 to navigate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
