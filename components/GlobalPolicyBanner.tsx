"use client";

/**
 * Global Policy Banner Component
 * Card: FI-UI-FEAT-204 (Updated with Service Health)
 *
 * Displays security status banner with service health monitoring
 * Polls /api/system/health every 10 seconds
 */

import { useEffect, useState } from "react";
import { ShieldCheck, X, AlertTriangle } from "lucide-react";
import { ServiceStatus } from "./ServiceStatus";

interface ServiceHealth {
  ok: boolean;
  message?: string;
  latency_ms?: number;
}

interface SystemHealthResponse {
  ok: boolean;
  services: {
    backend?: ServiceHealth;
    diarization?: ServiceHealth;
    llm?: ServiceHealth;
    policy?: ServiceHealth;
  };
  version: string;
  time: string;
}

interface PolicyData {
  sovereignty?: {
    egress?: {
      default?: string;
      allowlist?: string[];
    };
  };
  privacy?: {
    phi?: {
      enabled?: boolean;
    };
  };
}

export function GlobalPolicyBanner() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch initial policy and health
    const fetchInitialData = async () => {
      try {
        // Fetch policy
        const policyRes = await fetch('/api/policy');
        if (policyRes.ok) {
          const policyData = await policyRes.json();
          setPolicy(policyData.policy);
        }

        // Fetch health from backend
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:7001';
        const healthRes = await fetch(`${baseUrl}/api/system/health`);
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHealth(healthData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchInitialData();

    // Poll health endpoint every 10 seconds
    const healthInterval = setInterval(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:7001';
        const res = await fetch(`${baseUrl}/api/system/health`);
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch (err) {
        console.error('Health poll failed:', err);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(healthInterval);
  }, []);

  if (loading || dismissed) {
    return null;
  }

  // Determine banner type
  const egressBlocked = policy?.sovereignty?.egress?.default === 'deny';
  const phiDisabled = !policy?.privacy?.phi?.enabled;
  const isSecureMode = egressBlocked && phiDisabled;
  const hasUnhealthyServices = health && !health.ok;

  // Show banner if either secure mode OR unhealthy services
  const showBanner = isSecureMode || hasUnhealthyServices;

  if (!showBanner && !error) {
    return null;
  }

  return (
    <div
      className={`border-b backdrop-blur-sm ${
        hasUnhealthyServices
          ? "bg-yellow-900/20 border-yellow-800/50"
          : isSecureMode
          ? "bg-green-900/20 border-green-800/50"
          : "bg-blue-900/20 border-blue-800/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Left: Security Status */}
            <div className="flex items-center space-x-2">
              {hasUnhealthyServices ? (
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-green-400" />
              )}
              <span
                className={`text-sm font-medium ${
                  hasUnhealthyServices
                    ? "text-yellow-200"
                    : "text-green-200"
                }`}
              >
                {hasUnhealthyServices
                  ? "⚠️ Degraded Services"
                  : isSecureMode
                  ? "🔒 Modo Seguro"
                  : "✓ System Healthy"}
              </span>
              {isSecureMode && (
                <span className="text-sm text-green-300/70">
                  Egreso bloqueado, sin redacción PHI
                </span>
              )}
            </div>

            {/* Right: Service Status Chips */}
            {health && <ServiceStatus services={health.services} />}
          </div>

          <button
            onClick={() => setDismissed(true)}
            className={`p-1 rounded transition ${
              hasUnhealthyServices
                ? "hover:bg-yellow-800/30"
                : "hover:bg-green-800/30"
            }`}
            title="Cerrar"
          >
            <X
              className={`h-5 w-5 ${
                hasUnhealthyServices
                  ? "text-yellow-300"
                  : "text-green-300"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
