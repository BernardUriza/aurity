/**
 * Tabs Component - Stub
 *
 * Minimal implementation to unblock build.
 * TODO: Implement full tabs functionality
 */

import React from 'react';

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ children, className = '' }: TabsProps) {
  return <div className={className}>{children}</div>;
}

export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return <div className={`flex ${className}`}>{children}</div>;
}

export interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsTrigger({ children, className = '' }: TabsTriggerProps) {
  return (
    <button type="button" className={className}>
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({ children, className = '' }: TabsContentProps) {
  return <div className={className}>{children}</div>;
}
