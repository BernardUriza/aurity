"use client";

/**
 * Onboarding Reset Utility Page
 *
 * Development/testing utility to reset onboarding state
 * Access: /onboarding/reset
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AurityBanner } from '@/components/layout/AurityBanner';

export default function OnboardingResetPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'resetting' | 'done'>('idle');

  /**
   * Reset all onboarding LocalStorage data
   */
  const handleReset = () => {
    setStatus('resetting');

    try {
      // Remove all onboarding-related LocalStorage keys
      localStorage.removeItem('fi_onboarding_progress');
      localStorage.removeItem('fi_onboarding_conversation');
      localStorage.removeItem('aurity_onboarding_completed');
      localStorage.removeItem('fi_onboarding_survey');

      console.log('✅ Onboarding data cleared from LocalStorage');

      setStatus('done');

      // Auto-redirect to onboarding page after 2 seconds
      setTimeout(() => {
        router.push('/onboarding');
      }, 2000);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      alert('Error al reiniciar onboarding. Ver consola para detalles.');
      setStatus('idle');
    }
  };

  /**
   * Check current onboarding state
   */
  const checkState = () => {
    const progress = localStorage.getItem('fi_onboarding_progress');
    const conversation = localStorage.getItem('fi_onboarding_conversation');
    const completed = localStorage.getItem('aurity_onboarding_completed');
    const survey = localStorage.getItem('fi_onboarding_survey');

    console.log('📊 Current Onboarding State:');
    console.log('- Progress:', progress ? JSON.parse(progress) : 'None');
    console.log('- Conversation:', conversation ? JSON.parse(conversation) : 'None');
    console.log('- Completed:', completed || 'false');
    console.log('- Survey:', survey ? JSON.parse(survey) : 'None');

    alert('Ver consola (F12) para detalles del estado actual');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Abstract geometric background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-red-400 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-orange-400 rounded-full blur-3xl" />
      </div>

      {/* AURITY Banner */}
      <AurityBanner />

      {/* Main Content */}
      <main className="relative flex-1 max-w-3xl mx-auto px-6 sm:px-8 py-16 flex items-center justify-center">
        <div className="bg-slate-900/50 p-12 rounded-xl border border-slate-800 text-center space-y-8 w-full">
          {/* Header */}
          <div>
            <div className="text-6xl mb-4">🔄</div>
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Reiniciar Onboarding
            </h1>
            <p className="text-slate-400">
              Utility para desarrolladores - Reinicia el flujo de onboarding
            </p>
          </div>

          {/* Status Display */}
          {status === 'idle' && (
            <div className="space-y-6">
              <div className="p-4 bg-yellow-950/30 border border-yellow-700/50 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  ⚠️ Esto eliminará todo el progreso de onboarding guardado en LocalStorage
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleReset}
                  className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg hover:scale-105"
                >
                  🗑️ Reiniciar Onboarding
                </button>

                <button
                  onClick={checkState}
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all font-medium"
                >
                  📊 Ver Estado Actual (Consola)
                </button>

                <button
                  onClick={() => router.push('/onboarding')}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                >
                  ← Volver al Onboarding
                </button>
              </div>
            </div>
          )}

          {status === 'resetting' && (
            <div className="space-y-4">
              <div className="text-4xl animate-spin">🔄</div>
              <p className="text-slate-300 font-medium">
                Limpiando datos de LocalStorage...
              </p>
            </div>
          )}

          {status === 'done' && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="text-6xl">✅</div>
              <p className="text-emerald-300 font-semibold text-xl">
                ¡Onboarding reiniciado!
              </p>
              <p className="text-slate-400">
                Redirigiendo al onboarding en 2 segundos...
              </p>
              <div className="flex justify-center">
                <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 bg-slate-800/50 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">
              🗂️ LocalStorage Keys Afectados:
            </h3>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li>• fi_onboarding_progress</li>
              <li>• fi_onboarding_conversation</li>
              <li>• aurity_onboarding_completed</li>
              <li>• fi_onboarding_survey</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
