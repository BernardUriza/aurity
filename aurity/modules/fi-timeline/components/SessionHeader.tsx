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
      className={`session-header bg-gray-900 border-b border-gray-700 ${
        sticky ? 'sticky top-0 z-10' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Top row: Session ID + Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white font-mono">
              {metadata.session_id}
            </h1>
            {metadata.is_persisted && (
              <span
                className="text-xs px-2 py-0.5 rounded bg-green-900 text-green-300 border border-green-600"
                title="Session persisted to storage"
              >
                PERSISTED
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600 transition-colors"
                title="Refresh session data"
              >
                ↻ Refresh
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="px-3 py-1.5 text-sm bg-blue-900 hover:bg-blue-800 text-blue-200 rounded border border-blue-600 transition-colors"
                title="Export session"
              >
                ⇣ Export
              </button>
            )}
          </div>
        </div>

        {/* Middle row: Timespan + Size metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
          {/* Timespan */}
          <div className="bg-gray-800 rounded px-3 py-2 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Timespan</div>
            <div className="text-gray-200 font-medium">
              {timespan.duration_human}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {new Date(timespan.start).toLocaleString()} →{' '}
              {new Date(timespan.end).toLocaleString()}
            </div>
          </div>

          {/* Size */}
          <div className="bg-gray-800 rounded px-3 py-2 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Size</div>
            <div className="text-gray-200 font-medium">{size.size_human}</div>
            <div className="text-gray-500 text-xs mt-1">
              {size.interaction_count} interactions · {size.total_tokens.toLocaleString()} tokens
            </div>
          </div>

          {/* Averages */}
          <div className="bg-gray-800 rounded px-3 py-2 border border-gray-700">
            <div className="text-gray-400 text-xs mb-1">Averages</div>
            <div className="text-gray-200 font-medium">
              {size.avg_tokens_per_interaction.toFixed(0)} tokens/interaction
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {(size.total_prompts_chars / 1024).toFixed(1)}KB prompts ·{' '}
              {(size.total_responses_chars / 1024).toFixed(1)}KB responses
            </div>
          </div>
        </div>

        {/* Bottom row: Policy badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 mr-2">Policy Status:</span>
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
