// =============================================================================
// Native Network Module
// =============================================================================
// Provides native network status detection
// =============================================================================

import { Network, ConnectionStatus } from '@capacitor/network';
import { isPluginAvailable } from './platform';

const PLUGIN_NAME = 'Network';

export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export type NetworkStatusCallback = (status: NetworkStatus) => void;

/**
 * Check if native network plugin is available
 */
export function isNetworkAvailable(): boolean {
  return isPluginAvailable(PLUGIN_NAME);
}

/**
 * Get current network status
 */
export async function getStatus(): Promise<NetworkStatus> {
  if (!isNetworkAvailable()) {
    // Fallback to navigator.onLine for web
    return {
      connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectionType: 'unknown',
    };
  }

  const status = await Network.getStatus();
  return {
    connected: status.connected,
    connectionType: status.connectionType as NetworkStatus['connectionType'],
  };
}

/**
 * Listen for network status changes
 */
export function onNetworkChange(callback: NetworkStatusCallback): () => void {
  if (!isNetworkAvailable()) {
    // Fallback to web events
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => callback({ connected: true, connectionType: 'unknown' });
    const handleOffline = () => callback({ connected: false, connectionType: 'none' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  const handle = Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
    callback({
      connected: status.connected,
      connectionType: status.connectionType as NetworkStatus['connectionType'],
    });
  });

  return () => {
    handle.then((h) => h.remove());
  };
}
