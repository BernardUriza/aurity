/**
 * AURITY Banner Component
 *
 * Reusable banner showing AURITY acronym with medical symbols + UserDisplay
 * Used in: SlimIndexHub, Onboarding
 */

import { UserDisplay } from "./UserDisplay";

export function AurityBanner() {
  return (
    <div className="relative overflow-x-hidden bg-slate-900/60 backdrop-blur-xl border-b border-slate-700/50 shadow-lg z-10">
      {/* Abstract geometric background - subtle */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="flex items-center justify-between gap-6">
          {/* Minimalist medical icon with subtle shadow */}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-emerald-300/80 flex-shrink-0 drop-shadow-md">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* AURITY - Neo-minimalist typography */}
          <div className="flex-1">
            <div className="flex items-baseline justify-center gap-3 mb-4">
              <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-emerald-400 to-cyan-400 drop-shadow-sm">
                AURITY
              </h2>
              <span className="text-xs text-slate-400/60 font-light tracking-wide">v0.1.0</span>
            </div>
            {/* Refined acronym - better spacing */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="text-slate-200/90 text-sm font-light tracking-wide">
                <span className="font-semibold text-emerald-300 text-base">A</span>dvanced
              </span>
              <span className="text-slate-600/50 text-xs">•</span>
              <span className="text-slate-200/90 text-sm font-light tracking-wide">
                <span className="font-semibold text-emerald-300 text-base">U</span>niversal
              </span>
              <span className="text-slate-600/50 text-xs">•</span>
              <span className="text-slate-200/90 text-sm font-light tracking-wide">
                <span className="font-semibold text-emerald-300 text-base">R</span>eliable
              </span>
              <span className="text-slate-600/50 text-xs">•</span>
              <span className="text-slate-200/90 text-sm font-light tracking-wide">
                <span className="font-semibold text-emerald-300 text-base">I</span>ntelligence
              </span>
              <span className="text-slate-600/50 text-xs">•</span>
              <span className="text-slate-200/90 text-sm font-light tracking-wide">
                for <span className="font-semibold text-emerald-300 text-base">T</span>elemedicine
              </span>
              <span className="text-slate-600/50 text-xs">•</span>
              <span className="text-slate-200/90 text-sm font-light tracking-wide">
                <span className="font-semibold text-emerald-300 text-base">Y</span>ield
              </span>
            </div>
          </div>

          {/* User Authentication Display */}
          <div className="flex-shrink-0">
            <UserDisplay />
          </div>
        </div>
      </div>
    </div>
  );
}
