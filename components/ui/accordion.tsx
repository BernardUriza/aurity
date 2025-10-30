"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

interface AccordionContextValue {
  value: string | undefined
  onValueChange: (value: string) => void
  type: "single" | "multiple"
  collapsible?: boolean
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)

export function Accordion({
  type,
  collapsible = false,
  className,
  children,
}: {
  type: "single" | "multiple"
  collapsible?: boolean
  className?: string
  children: React.ReactNode
}) {
  const [value, setValue] = React.useState<string | undefined>(undefined)

  const onValueChange = (newValue: string) => {
    if (type === "single") {
      setValue(value === newValue && collapsible ? undefined : newValue)
    }
  }

  return (
    <AccordionContext.Provider value={{ value, onValueChange, type, collapsible }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

// Context for AccordionItem value
const AccordionItemContext = React.createContext<{ value: string } | undefined>(undefined)

export function AccordionItem({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={`border-b ${className || ""}`} data-value={value}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

export function AccordionTrigger({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionTrigger must be used within Accordion")

  const item = React.useContext(AccordionItemContext)
  if (!item) throw new Error("AccordionTrigger must be used within AccordionItem")

  const isOpen = context.value === item.value

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(item.value)}
      className={`flex w-full items-center justify-between py-4 font-medium transition-all hover:underline ${className || ""}`}
    >
      {children}
      <ChevronDown
        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  )
}

export function AccordionContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionContent must be used within Accordion")

  const item = React.useContext(AccordionItemContext)
  if (!item) throw new Error("AccordionContent must be used within AccordionItem")

  const isOpen = context.value === item.value

  if (!isOpen) return null

  return (
    <div className={`overflow-hidden pb-4 pt-0 ${className || ""}`}>
      {children}
    </div>
  )
}

