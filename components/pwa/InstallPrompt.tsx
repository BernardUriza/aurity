'use client';

// =============================================================================
// PWA Install Prompt Component
// =============================================================================
// Shows install prompt for Android/Chrome and instructions for iOS
// =============================================================================

import { useState, useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { X, Download, Share, Plus } from 'lucide-react';

interface InstallPromptProps {
  /** Delay before showing the prompt (ms) */
  delay?: number;
  /** Whether to show on iOS with manual instructions */
  showOnIOS?: boolean;
}

export function InstallPrompt({ delay = 3000, showOnIOS = true }: InstallPromptProps) {
  const { isInstallable, isInstalled, isIOS, isStandalone, promptInstall, dismissPrompt } =
    useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }

    // Show prompt after delay
    const timer = setTimeout(() => {
      if (!isInstalled && !isStandalone && (isInstallable || (isIOS && showOnIOS))) {
        setIsVisible(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS, isStandalone, delay, showOnIOS]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    dismissPrompt();
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  if (!isVisible || isDismissed || isInstalled || isStandalone) {
    return null;
  }

  // iOS Instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-base">Instalar AURITY</h3>
              <p className="text-slate-400 text-sm mt-1">
                Agrega esta app a tu pantalla de inicio para acceso rapido
              </p>
              <div className="mt-3 flex items-center gap-2 text-slate-300 text-sm">
                <span>Toca</span>
                <Share className="w-4 h-4 text-blue-400" />
                <span>y luego</span>
                <span className="inline-flex items-center gap-1 bg-slate-700 px-2 py-0.5 rounded">
                  <Plus className="w-3 h-3" />
                  <span>Agregar</span>
                </span>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome Install Prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base">Instalar AURITY</h3>
            <p className="text-slate-400 text-sm mt-1">
              Instala la app para acceso rapido y uso sin conexion
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
