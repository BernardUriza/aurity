'use client';

/**
 * PolicyBadge Component
 *
 * Displays policy compliance status badge
 * States: OK (green), FAIL (red), PENDING (yellow), N/A (gray)
 */

import React from 'react';
import type { PolicyBadgeStatus } from '../types/session';

interface PolicyBadgeProps {
  label: string;
  status: PolicyBadgeStatus;
  tooltip?: string;
}

const STATUS_STYLES = {
  OK: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900',
  FAIL: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900',
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900',
  'N/A': 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
};

const STATUS_ICONS = {
  OK: '✓',
  FAIL: '✗',
  PENDING: '⋯',
  'N/A': '—',
};

export const PolicyBadge: React.FC<PolicyBadgeProps> = ({
  label,
  status,
  tooltip,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[status]}`}
      title={tooltip || `${label}: ${status}`}
    >
      <span className="font-semibold">{STATUS_ICONS[status]}</span>
      <span>{label}</span>
    </span>
  );
};

PolicyBadge.displayName = 'PolicyBadge';
