"use client";

/**
 * Callout Component
 * Card: FI-INFRA-STR-014
 *
 * Alert-style component for warnings, info, and tips
 */

import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutType = "info" | "warning" | "success" | "danger";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const CALLOUT_STYLES: Record<CalloutType, { bg: string; border: string; text: string; icon: typeof Info }> = {
  info: {
    bg: "bg-blue-950/30",
    border: "border-blue-800/50",
    text: "text-blue-400",
    icon: Info,
  },
  warning: {
    bg: "bg-yellow-950/30",
    border: "border-yellow-800/50",
    text: "text-yellow-400",
    icon: AlertTriangle,
  },
  success: {
    bg: "bg-emerald-950/30",
    border: "border-emerald-800/50",
    text: "text-emerald-400",
    icon: CheckCircle,
  },
  danger: {
    bg: "bg-red-950/30",
    border: "border-red-800/50",
    text: "text-red-400",
    icon: AlertCircle,
  },
};

export function Callout({ type = "info", title, children, className }: CalloutProps) {
  const styles = CALLOUT_STYLES[type];
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex gap-3",
        styles.bg,
        styles.border,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", styles.text)} />
      <div className="flex-1">
        {title && (
          <div className={cn("font-semibold mb-1", styles.text)}>
            {title}
          </div>
        )}
        <div className="text-sm text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}
