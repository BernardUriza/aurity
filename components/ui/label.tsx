/**
 * Label Component - Stub
 *
 * Minimal implementation to unblock build.
 */

import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Label({ htmlFor, className = '', children, ...props }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium text-slate-200 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
