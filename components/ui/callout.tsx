/**
 * Callout Component - Stub
 *
 * Minimal implementation to unblock build.
 */

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export type CalloutType = 'info' | 'warning' | 'error' | 'success';

export interface CalloutProps {
  type?: CalloutType;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

const calloutStyles: Record<CalloutType, { bg: string; border: string; text: string; icon: typeof Info }> = {
  info: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-300',
    icon: Info
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    icon: AlertTriangle
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-300',
    icon: AlertCircle
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    icon: CheckCircle2
  }
};

export function Callout({ type = 'info', title, className = '', children }: CalloutProps) {
  const styles = calloutStyles[type];
  const Icon = styles.icon;

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-4 ${className}`}>
      <div className="flex gap-3">
        <Icon className={`h-5 w-5 ${styles.text} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          {title && <p className={`font-semibold ${styles.text} mb-1`}>{title}</p>}
          <div className="text-sm text-slate-300">{children}</div>
        </div>
      </div>
    </div>
  );
}
