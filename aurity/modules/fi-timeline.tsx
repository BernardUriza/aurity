/**
 * FI Timeline Module - Stub
 *
 * Minimal implementation to unblock build.
 * This module was referenced but never fully implemented.
 */

import React from 'react';

export interface SessionHeaderData {
  session_id: string;
  created_at: string;
  updated_at: string;
  timespan?: {
    start: string;
    end: string;
    duration_ms: number;
    duration_human: string;
  };
  size?: {
    interaction_count: number;
    total_tokens: number;
    total_chars: number;
    size_human: string;
  };
  policy_badges?: {
    hash_verified: string;
    policy_compliant: string;
    redaction_applied: string;
    audit_logged: string;
  };
}

export const SessionHeader: React.FC<{ data: SessionHeaderData }> = ({ data }) => {
  // Guard against undefined data
  if (!data) {
    return (
      <div className="bg-slate-800 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold text-white mb-2">Loading session...</h2>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-4 rounded-lg mb-4">
      <h2 className="text-xl font-bold text-white mb-2">Session: {data.session_id || 'Unknown'}</h2>
      <p className="text-slate-300 text-sm">Created: {data.created_at || 'Unknown'}</p>
      {data.timespan && (
        <p className="text-slate-300 text-sm">Duration: {data.timespan.duration_human}</p>
      )}
    </div>
  );
};

export function generateMockSessionHeader(): SessionHeaderData {
  return {
    session_id: 'session_20251115_000000',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    timespan: {
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      duration_ms: 60000,
      duration_human: '1m',
    },
    size: {
      interaction_count: 5,
      total_tokens: 1000,
      total_chars: 5000,
      size_human: '1K tokens',
    },
    policy_badges: {
      hash_verified: 'OK',
      policy_compliant: 'OK',
      redaction_applied: 'N/A',
      audit_logged: 'OK',
    },
  };
}

export function generateMockSessionHeaderWithStatus(status: string): SessionHeaderData {
  const data = generateMockSessionHeader();
  return {
    ...data,
    policy_badges: {
      hash_verified: status === 'all-ok' ? 'OK' : 'FAIL',
      policy_compliant: status === 'all-ok' ? 'OK' : 'FAIL',
      redaction_applied: status === 'all-ok' ? 'OK' : 'N/A',
      audit_logged: status === 'all-ok' ? 'OK' : 'FAIL',
    },
  };
}
