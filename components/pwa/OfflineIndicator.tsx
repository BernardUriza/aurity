'use client';

// =============================================================================
// Offline Status Indicator Component
// =============================================================================
// Shows a banner when the device is offline
// =============================================================================

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  /** Position of the indicator */
  position?: 'top' | 'bottom';
}

export function OfflineIndicator({ position = 'top' }: OfflineIndicatorProps) {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Show syncing indicator briefly when coming back online
  if (wasOffline && isOnline) {
    return (
      <div
        className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}
      >
        <div className="bg-green-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Conexion restaurada. Sincronizando...</span>
        </div>
      </div>
    );
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div
        className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}
      >
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>Sin conexion. Los cambios se guardaran localmente.</span>
        </div>
      </div>
    );
  }

  return null;
}
