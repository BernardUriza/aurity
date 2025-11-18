/**
 * Select Component
 * Card: FI-INFRA-STR-014
 *
 * Fully functional select dropdown with controlled/uncontrolled state
 */

"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerId: string;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select provider');
  }
  return context;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Select({
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  defaultValue = '',
  disabled = false,
  children
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const triggerId = useRef(`select-trigger-${Math.random().toString(36).substr(2, 9)}`).current;

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const onValueChange = isControlled ? controlledOnValueChange! : setInternalValue;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`[data-select-trigger="${triggerId}"]`) &&
          !target.closest('[data-select-content]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, triggerId]);

  if (disabled) {
    return <div className="relative opacity-50 cursor-not-allowed">{children}</div>;
  }

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, triggerId }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function SelectTrigger({ id, children, className = '' }: SelectTriggerProps) {
  const { isOpen, setIsOpen, triggerId } = useSelectContext();

  return (
    <button
      id={id}
      type="button"
      data-select-trigger={triggerId}
      onClick={() => setIsOpen(!isOpen)}
      className={`flex w-full items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors ${className}`}
    >
      {children}
      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
}

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder = 'Select...' }: SelectValueProps) {
  const { value } = useSelectContext();

  // This component will be replaced by the actual selected item's content
  // when rendering, so we just show placeholder if no value
  return <span className={value ? 'text-slate-200' : 'text-slate-400'}>{value || placeholder}</span>;
}

export interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const { isOpen } = useSelectContext();

  if (!isOpen) return null;

  return (
    <div
      data-select-content
      className={`absolute z-50 mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-1 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setIsOpen } = useSelectContext();
  const isSelected = value === selectedValue;

  const handleClick = () => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-slate-700 ${
        isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300'
      } ${className}`}
    >
      {children}
    </div>
  );
}
