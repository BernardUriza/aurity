'use client';

// =============================================================================
// PWA Update Prompt Component
// =============================================================================
// Shows when a new version of the app is available
// =============================================================================

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
  const { updateAvailable, skipWaiting } = useServiceWorker();

  if (!updateAvailable) {
    return null;
  }

  const handleUpdate = () => {
    skipWaiting();
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
      <div className="bg-blue-600 text-white rounded-xl p-4 shadow-xl flex items-center gap-3">
        <RefreshCw className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Nueva version disponible</p>
          <p className="text-blue-100 text-sm">Actualiza para obtener las ultimas mejoras</p>
        </div>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
