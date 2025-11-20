/**
 * Demo Configuration Modal
 *
 * Modal for configuring demo dataset parameters.
 *
 * File: components/demo-config-modal.tsx
 * Card: FI-UI-FEAT-207
 * Created: 2025-10-30
 *
 * Philosophy AURITY:
 * - Control visible: usuario decide seed, tamaño, perfil, latencia, error%
 */

'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { DemoConfig } from '@/lib/demo/types';

interface DemoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: DemoConfig;
  onApply: (config: DemoConfig) => void;
}

export function DemoConfigModal({
  isOpen,
  onClose,
  currentConfig,
  onApply,
}: DemoConfigModalProps) {
  const [seed, setSeed] = useState(currentConfig.seed);
  const [sessions, setSessions] = useState(currentConfig.sessions);
  const [eventsProfile, setEventsProfile] = useState(currentConfig.eventsProfile);
  const [latencyMin, setLatencyMin] = useState(currentConfig.latencyMs.min);
  const [latencyMax, setLatencyMax] = useState(currentConfig.latencyMs.max);
  const [errorRate, setErrorRate] = useState(currentConfig.errorRatePct);

  // Reset form when config changes
  useEffect(() => {
    setSeed(currentConfig.seed);
    setSessions(currentConfig.sessions);
    setEventsProfile(currentConfig.eventsProfile);
    setLatencyMin(currentConfig.latencyMs.min);
    setLatencyMax(currentConfig.latencyMs.max);
    setErrorRate(currentConfig.errorRatePct);
  }, [currentConfig]);

  const handleApply = () => {
    const newConfig: DemoConfig = {
      ...currentConfig,
      seed,
      sessions,
      eventsProfile,
      latencyMs: { min: latencyMin, max: latencyMax },
      errorRatePct: errorRate,
    };
    onApply(newConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full p-6 border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-50 flex items-center space-x-2">
            <Cog6ToothIcon className="h-6 w-6 text-blue-400" />
            <span>Demo Dataset Configuration</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded transition"
          >
            <XMarkIcon className="h-5 w-5 text-slate-300" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Seed */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Seed (deterministic)
            </label>
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="fi-2025"
            />
            <p className="text-xs text-slate-500 mt-1">
              Mismo seed → mismo dataset. Cambia para generar datos diferentes.
            </p>
          </div>

          {/* Sessions Count */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sessions Count
            </label>
            <div className="flex space-x-2">
              {[12, 24, 60].map((count) => (
                <button
                  key={count}
                  onClick={() => setSessions(count)}
                  className={`flex-1 px-4 py-2 rounded transition ${
                    sessions === count
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Events Profile */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Events Profile
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'large', 'mix'] as const).map((profile) => (
                <button
                  key={profile}
                  onClick={() => setEventsProfile(profile)}
                  className={`px-4 py-2 rounded transition ${
                    eventsProfile === profile
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {profile === 'small' && 'Small (30-80)'}
                  {profile === 'large' && 'Large (400-2k)'}
                  {profile === 'mix' && 'Mix (80/20)'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mix: 80% small sessions + 20% large (≥1 session &gt;200 events)
            </p>
          </div>

          {/* Latency Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Latency Range (ms): {latencyMin} - {latencyMax}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min</label>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={latencyMin}
                  onChange={(e) => setLatencyMin(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max</label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="10"
                  value={latencyMax}
                  onChange={(e) => setLatencyMax(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Simula latencia de red para pruebas de UX bajo carga.
            </p>
          </div>

          {/* Error Rate */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Error Rate: {errorRate}%
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={errorRate}
              onChange={(e) => setErrorRate(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              Probabilidad de 5xx error simulado (0-5%). Prueba fallback/retry.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Apply & Reload Dataset
          </button>
        </div>
      </div>
    </div>
  );
}
