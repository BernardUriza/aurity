"use client";

/**
 * Service Status Component
 * Card: FI-UI-FEAT-204 (Service Health + Diarization Progress)
 *
 * Displays service health status with color-coded chips
 */

import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface ServiceHealth {
  ok?: boolean;
  message?: string;
  latency_ms?: number;
  [key: string]: any;
}

interface ServiceStatusProps {
  services: {
    backend?: ServiceHealth | boolean;
    diarization?: ServiceHealth | boolean | { whisper?: boolean; ffmpeg?: boolean };
    llm?: ServiceHealth | boolean | { ollama?: boolean; models?: string[] };
    policy?: ServiceHealth | boolean;
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

  const getHealthStatus = (health: any): { ok: boolean; message?: string } => {
    // Handle boolean values directly
    if (typeof health === "boolean") {
      return { ok: health };
    }
    // Handle ServiceHealth objects
    if (health && typeof health === "object") {
      // Check for explicit 'ok' property
      if (health.ok !== undefined) {
        return { ok: health.ok, message: health.message };
      }
      // For diarization: check whisper availability
      if (health.whisper !== undefined) {
        return { ok: health.whisper === true, message: health.message };
      }
      // For llm: check ollama availability
      if (health.ollama !== undefined) {
        return { ok: health.ollama === true, message: health.message };
      }
      // Fallback: assume it's healthy if it's an object
      return { ok: true };
    }
    return { ok: false };
  };

  const serviceEntries = Object.entries(services);

  return (
    <div className="flex items-center space-x-3">
      {serviceEntries.map(([name, health]) => {
        if (!health && health !== false) return null;

        const { ok, message } = getHealthStatus(health);
        const color = getStatusColor(ok);
        const icon = getStatusIcon(ok);

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
            title={message || ""}
          >
            {icon}
            <span className="capitalize">{name}</span>
            {typeof health === "object" && health.latency_ms !== undefined && health.latency_ms !== null && (
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
