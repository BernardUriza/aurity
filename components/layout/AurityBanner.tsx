/**
 * AURITY Banner Component - Compact 2025 Redesign
 *
 * Minimal, efficient header following healthcare UX best practices:
 * - Reduced cognitive load (no blur backgrounds)
 * - Compact vertical spacing (py-3)
 * - Clear visual hierarchy
 * - Acronym always visible for constant reinforcement
 * - NO sticky (prevents banner blindness)
 *
 * Used in: SlimIndexHub, Onboarding, ChatPublic
 */

'use client';

import Image from 'next/image';
import { UserDisplay } from '@/components/auth/UserDisplay';

export function AurityBanner() {
  return (
    <div className="bg-slate-900/95 border-b border-slate-800/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Compact icon + brand */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Aurity Logo */}
            <Image
              src="/logos/aurity-logo-light.png"
              alt="AURITY"
              width={120}
              height={32}
              className="h-8 w-auto flex-shrink-0"
            />

            {/* Brand name with inline acronym */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-shrink-0">
                <span className="text-[10px] text-slate-500 font-medium">
                  v0.1.0
                </span>
              </div>

              {/* Acronym - always visible, compact inline */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 min-w-0 overflow-hidden">
                <span className="whitespace-nowrap">
                  <span className="font-semibold text-emerald-400">A</span>dvanced
                </span>
                <span className="text-slate-600">•</span>
                <span className="whitespace-nowrap">
                  <span className="font-semibold text-emerald-400">U</span>niversal
                </span>
                <span className="text-slate-600">•</span>
                <span className="whitespace-nowrap">
                  <span className="font-semibold text-emerald-400">R</span>eliable
                </span>
                <span className="text-slate-600">•</span>
                <span className="whitespace-nowrap">
                  <span className="font-semibold text-emerald-400">I</span>ntelligence
                </span>
                <span className="text-slate-600">•</span>
                <span className="whitespace-nowrap">
                  for <span className="font-semibold text-emerald-400">T</span>elemedicine
                </span>
                <span className="text-slate-600">•</span>
                <span className="whitespace-nowrap">
                  <span className="font-semibold text-emerald-400">Y</span>ield
                </span>
              </div>
            </div>
          </div>

          {/* User display - compact */}
          <div className="flex-shrink-0">
            <UserDisplay />
          </div>
        </div>
      </div>
    </div>
  );
}
