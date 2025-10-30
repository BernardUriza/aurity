"use client";

/**
 * LAN-Only Banner Component
 *
 * Card: FI-SEC-FEAT-002
 * Displays persistent banner indicating LAN-only mode
 */

import { useState } from "react";
import { XMarkIcon, ShieldCheckIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export function LANOnlyBanner() {
  const [showHelp, setShowHelp] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if banner should be shown (from env or config)
  const showBanner = process.env.NEXT_PUBLIC_LAN_BANNER === "1" || true; // Default: always show

  if (!showBanner || dismissed) {
    return null;
  }

  return (
    <>
      {/* Banner */}
      <div className="bg-blue-900/20 border-b border-blue-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-200">
                LAN-only Mode
              </span>
              <span className="text-sm text-blue-300/70">
                Esta instancia está restringida a red local
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHelp(true)}
                className="p-1 hover:bg-blue-800/30 rounded transition"
                title="Más información"
              >
                <InformationCircleIcon className="h-5 w-5 text-blue-300" />
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-blue-800/30 rounded transition"
                title="Cerrar"
              >
                <XMarkIcon className="h-5 w-5 text-blue-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-50 flex items-center space-x-2">
                <ShieldCheckIcon className="h-6 w-6 text-blue-400" />
                <span>LAN-Only Mode</span>
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-slate-700 rounded transition"
              >
                <XMarkIcon className="h-5 w-5 text-slate-300" />
              </button>
            </div>

            <div className="space-y-4 text-slate-300">
              <p>
                <strong className="text-slate-50">Free Intelligence</strong> es <strong>local-first</strong> por diseño.
                Esta instancia solo acepta conexiones desde dispositivos en tu red local.
              </p>

              <div>
                <h3 className="text-sm font-semibold text-slate-50 mb-2">Rangos de red permitidos:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm font-mono bg-slate-900 p-3 rounded">
                  <li>127.0.0.0/8 - localhost (loopback)</li>
                  <li>::1/128 - IPv6 localhost</li>
                  <li>10.0.0.0/8 - Clase A privada</li>
                  <li>172.16.0.0/12 - Clase B privada</li>
                  <li>192.168.0.0/16 - Clase C privada</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-50 mb-2">¿Cómo acceder desde fuera de casa?</h3>
                <p className="text-sm">
                  Si necesitas acceder remotamente, usa una <strong className="text-blue-400">VPN corporativa</strong> o{" "}
                  <strong className="text-blue-400">Tailscale/WireGuard</strong> para conectarte a tu red local.
                </p>
                <p className="text-sm text-yellow-400 mt-2">
                  ⚠️ <strong>Nunca</strong> expongas Free Intelligence directamente a internet.
                </p>
              </div>

              <div className="bg-blue-900/20 p-3 rounded border border-blue-800/50">
                <p className="text-sm">
                  <strong>Filosofía AURITY:</strong> Confianza ≠ opinión; es topología (CIDR).
                  Default-deny, excepciones explícitas.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
