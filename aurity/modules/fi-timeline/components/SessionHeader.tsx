'use client';

/**
 * SessionHeader Component
 *
 * FI-UI-FEAT-100: Encabezado Contextual de Sesión
 *
 * Displays session metadata in sticky header:
 * - Session ID, timespan, size
 * - Policy badges (Hash/Policy/Redaction/Audit)
 * - Refresh and export actions
 */

import React from 'react';
import type { SessionHeaderProps } from '../types/session';
import { PolicyBadge } from './PolicyBadge';

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  session,
  sticky = true,
  onRefresh,
  onExport,
}) => {
  const { metadata, timespan, size, policy_badges } = session;

  return (
    <header
      className={`session-header backdrop-blur border-b bg-slate-900/80 border-slate-800 ${
        sticky ? 'sticky top-0 z-30' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        {/* Top row: Session ID + Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-slate-100 font-mono tracking-tight">
              {metadata.session_id}
            </h1>
            {metadata.is_persisted && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900"
                title="Session persisted to storage"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                PERSISTED
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                title="Refresh session data"
              >
                <span className="text-base">↻</span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-xl border border-slate-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                title="Export session"
              >
                <span className="text-base">⇣</span>
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Middle row: Timespan + Size metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
          {/* Timespan */}
          <div className="rounded-xl bg-slate-800/60 px-3 py-2 ring-1 ring-slate-700/50">
            <div className="text-slate-400 text-xs font-medium mb-1">Timespan</div>
            <div className="text-slate-100 font-semibold text-[15px]">
              {timespan.duration_human}
            </div>
            <div className="text-slate-500 text-xs mt-1.5">
              {new Date(timespan.start).toLocaleString()} →{' '}
              {new Date(timespan.end).toLocaleString()}
            </div>
          </div>

          {/* Size */}
          <div className="rounded-xl bg-slate-800/60 px-3 py-2 ring-1 ring-slate-700/50">
            <div className="text-slate-400 text-xs font-medium mb-1">Size</div>
            <div className="text-slate-100 font-semibold text-[15px]">{size.size_human}</div>
            <div className="text-slate-500 text-xs mt-1.5">
              {size.interaction_count} interactions · {size.total_tokens.toLocaleString()} tokens
            </div>
          </div>

          {/* Averages */}
          <div className="rounded-xl bg-slate-800/60 px-3 py-2 ring-1 ring-slate-700/50">
            <div className="text-slate-400 text-xs font-medium mb-1">Averages</div>
            <div className="text-slate-100 font-semibold text-[15px]">
              {size.avg_tokens_per_interaction.toFixed(0)} tokens/interaction
            </div>
            <div className="text-slate-500 text-xs mt-1.5">
              {(size.total_prompts_chars / 1024).toFixed(1)}KB prompts ·{' '}
              {(size.total_responses_chars / 1024).toFixed(1)}KB responses
            </div>
          </div>
        </div>

        {/* Bottom row: Policy badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium mr-1">Policy Status:</span>
          <PolicyBadge
            label="Hash"
            status={policy_badges.hash_verified}
            tooltip="SHA256 hash integrity verification"
          />
          <PolicyBadge
            label="Policy"
            status={policy_badges.policy_compliant}
            tooltip="Append-only + no-mutation compliance"
          />
          <PolicyBadge
            label="Redaction"
            status={policy_badges.redaction_applied}
            tooltip="PII redaction applied"
          />
          <PolicyBadge
            label="Audit"
            status={policy_badges.audit_logged}
            tooltip="Audit trail present"
          />
        </div>
      </div>
    </header>
  );
};

SessionHeader.displayName = 'SessionHeader';
