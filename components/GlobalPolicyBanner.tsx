"use client";

/**
 * Global Policy Banner Component
 * Card: FI-UI-FEAT-204
 *
 * Shows green banner when egress.allow=false AND phi.redact=false
 * "🔒 Modo seguro: Egreso bloqueado, sin redacción PHI"
 */

import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

interface PolicyData {
  sovereignty?: {
    egress?: {
      default?: string;
    };
  };
  privacy?: {
    phi?: {
      enabled?: boolean;
    };
  };
}

export function GlobalPolicyBanner() {
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch policy from API
    fetch('/api/policy')
      .then(res => res.json())
      .then(data => {
        setPolicy(data.policy);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load policy for banner:', err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading || error || dismissed) {
    return null;
  }

  // Check if banner should be shown:
  // egress.default = "deny" AND phi.enabled = false
  const egressBlocked = policy?.sovereignty?.egress?.default === 'deny';
  const phiDisabled = !policy?.privacy?.phi?.enabled;

  const showBanner = egressBlocked && phiDisabled;

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-green-900/20 border-b border-green-800/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-green-200">
              🔒 Modo Seguro
            </span>
            <span className="text-sm text-green-300/70">
              Egreso bloqueado, sin redacción PHI
            </span>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-green-800/30 rounded transition"
            title="Cerrar"
          >
            <X className="h-5 w-5 text-green-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
