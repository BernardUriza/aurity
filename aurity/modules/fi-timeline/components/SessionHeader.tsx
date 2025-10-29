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
 * - Copy-to-clipboard for session ID and owner hash
 * - Responsive collapse for mobile
 */

import React, { useState } from 'react';
import type { SessionHeaderProps } from '../types/session';
import { PolicyBadge } from './PolicyBadge';
import { copyToClipboard } from '@/lib/utils/clipboard';

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  session,
  sticky = true,
  onRefresh,
  onExport,
}) => {
  const { metadata, timespan, size, policy_badges } = session;
  const [copied, setCopied] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text, label);
    if (success) {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <header
      className={`session-header backdrop-blur border-b bg-slate-900/80 border-slate-800 ${
        sticky ? 'sticky top-0 z-30' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        {/* Top row: Session ID + Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-100 font-mono tracking-tight">
                {metadata.session_id}
              </h1>
              <button
                onClick={() => handleCopy(metadata.session_id, 'session-id')}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy session ID"
              >
                {copied === 'session-id' ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span>📋</span>
                )}
              </button>
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
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Manifest: {metadata.owner_hash?.substring(0, 12) || 'N/A'}...</span>
              <button
                onClick={() => metadata.owner_hash && handleCopy(metadata.owner_hash, 'owner-hash')}
                className="p-0.5 hover:text-slate-300 transition-colors"
                title="Copy owner hash"
                disabled={!metadata.owner_hash}
              >
                {copied === 'owner-hash' ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span>📋</span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title={isExpanded ? 'Collapse metrics' : 'Expand metrics'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
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
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm ${
          isExpanded ? 'grid' : 'hidden md:grid'
        }`}>
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
