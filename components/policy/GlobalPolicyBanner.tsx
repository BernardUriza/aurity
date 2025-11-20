"use client";

/**
 * Data Sovereignty Banner
 * Inspired by Aurity Philosophy: Data Sovereignty, HIPAA, Local-first
 *
 * Communicates core principles: 100% Local, HIPAA Ready, Immutable Storage
 */

import { useState } from "react";
import { Shield, Lock, Database, X } from "lucide-react";

export function GlobalPolicyBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="border-b backdrop-blur-sm bg-emerald-900/20 border-emerald-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between">
          {/* Data Sovereignty Principles */}
          <div className="flex items-center gap-6">
            {/* Local-First */}
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-200">
                100% Local
              </span>
              <span className="text-xs text-emerald-300/60">
                No cloud dependencies
              </span>
            </div>

            {/* HIPAA Ready */}
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-200">
                HIPAA Ready
              </span>
              <span className="text-xs text-emerald-300/60">
                AES-GCM-256
              </span>
            </div>

            {/* Immutable Storage */}
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-200">
                Append-Only
              </span>
              <span className="text-xs text-emerald-300/60">
                HDF5 immutable
              </span>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-emerald-800/30 transition"
            title="Dismiss"
          >
            <X className="h-4 w-4 text-emerald-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
