/**
 * Select Component - Stub
 *
 * Minimal implementation to unblock build.
 * TODO: Implement full select functionality with dropdown
 */

import React from 'react';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Select({ children }: SelectProps) {
  return <div className="relative">{children}</div>;
}

export interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm ${className}`}
    >
      {children}
    </button>
  );
}

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <span className="text-slate-400">{placeholder || 'Select...'}</span>;
}

export interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  return (
    <div className={`rounded-md border border-slate-700 bg-slate-800 p-1 ${className}`}>
      {children}
    </div>
  );
}

export interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function SelectItem({ children, className = '' }: SelectItemProps) {
  return (
    <div className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-slate-700 ${className}`}>
      {children}
    </div>
  );
}
