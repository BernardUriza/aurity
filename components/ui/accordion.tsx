/**
 * Accordion Component - Stub
 *
 * Minimal implementation to unblock build.
 * TODO: Implement full accordion functionality
 */

import React from 'react';

export interface AccordionProps {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Accordion({ children, className = '' }: AccordionProps) {
  return <div className={className}>{children}</div>;
}

export interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function AccordionItem({ children, className = '' }: AccordionItemProps) {
  return <div className={className}>{children}</div>;
}

export interface AccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export function AccordionTrigger({ children, className = '' }: AccordionTriggerProps) {
  return (
    <button type="button" className={className}>
      {children}
    </button>
  );
}

export interface AccordionContentProps {
  className?: string;
  children: React.ReactNode;
}

export function AccordionContent({ children, className = '' }: AccordionContentProps) {
  return <div className={className}>{children}</div>;
}
