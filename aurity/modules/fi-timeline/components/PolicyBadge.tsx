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
  OK: 'bg-green-900 border-green-600 text-green-200',
  FAIL: 'bg-red-900 border-red-600 text-red-200',
  PENDING: 'bg-yellow-900 border-yellow-600 text-yellow-200',
  'N/A': 'bg-gray-800 border-gray-600 text-gray-400',
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
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium ${STATUS_STYLES[status]}`}
      title={tooltip || `${label}: ${status}`}
    >
      <span className="font-bold">{STATUS_ICONS[status]}</span>
      <span>{label}</span>
    </div>
  );
};

PolicyBadge.displayName = 'PolicyBadge';
