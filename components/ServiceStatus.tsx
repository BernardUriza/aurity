"use client";

/**
 * Service Status Component
 * Card: FI-UI-FEAT-204 (Service Health + Diarization Progress)
 *
 * Displays service health status with color-coded chips
 */

import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface ServiceHealth {
  ok: boolean;
  message?: string;
  latency_ms?: number;
}

interface ServiceStatusProps {
  services: {
    backend?: ServiceHealth;
    diarization?: ServiceHealth;
    llm?: ServiceHealth;
    policy?: ServiceHealth;
  };
}

export function ServiceStatus({ services }: ServiceStatusProps) {
  const getStatusColor = (ok: boolean) => {
    return ok ? "green" : "red";
  };

  const getStatusIcon = (ok: boolean) => {
    if (ok) {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <XCircle className="h-4 w-4" />;
  };

  const serviceEntries = Object.entries(services);

  return (
    <div className="flex items-center space-x-3">
      {serviceEntries.map(([name, health]) => {
        if (!health) return null;

        const color = getStatusColor(health.ok);
        const icon = getStatusIcon(health.ok);

        return (
          <div
            key={name}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              color === "green"
                ? "bg-green-900/30 text-green-300 border border-green-800/50"
                : color === "red"
                ? "bg-red-900/30 text-red-300 border border-red-800/50"
                : "bg-yellow-900/30 text-yellow-300 border border-yellow-800/50"
            }`}
            title={health.message || ""}
          >
            {icon}
            <span className="capitalize">{name}</span>
            {health.latency_ms !== undefined && health.latency_ms !== null && (
              <span className="text-slate-400">
                ({Math.round(health.latency_ms)}ms)
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
