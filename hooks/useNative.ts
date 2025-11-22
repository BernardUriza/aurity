// =============================================================================
// Native Features Hook
// =============================================================================
// React hook for accessing native Capacitor features
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { isNative, getPlatform, Platform } from '@/lib/native';
import * as appModule from '@/lib/native/app';
import * as networkModule from '@/lib/native/network';

interface UseNativeReturn {
  /** Whether running in native app */
  isNative: boolean;
  /** Current platform */
  platform: Platform;
  /** Whether app is in foreground */
  isActive: boolean;
  /** Network connection status */
  isConnected: boolean;
  /** Network connection type */
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  /** App info (native only) */
  appInfo: {
    name: string;
    id: string;
    build: string;
    version: string;
  } | null;
}

export function useNative(): UseNativeReturn {
  const [isActive, setIsActive] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState<UseNativeReturn['connectionType']>('unknown');
  const [appInfo, setAppInfo] = useState<UseNativeReturn['appInfo']>(null);

  useEffect(() => {
    // Get initial states
    const init = async () => {
      // App state
      const state = await appModule.getState();
      setIsActive(state.isActive);

      // Network status
      const networkStatus = await networkModule.getStatus();
      setIsConnected(networkStatus.connected);
      setConnectionType(networkStatus.connectionType);

      // App info (native only)
      const info = await appModule.getInfo();
      setAppInfo(info);
    };

    init();

    // Set up listeners
    const cleanupAppState = appModule.onAppStateChange((state) => {
      setIsActive(state.isActive);
    });

    const cleanupNetwork = networkModule.onNetworkChange((status) => {
      setIsConnected(status.connected);
      setConnectionType(status.connectionType);
    });

    return () => {
      cleanupAppState();
      cleanupNetwork();
    };
  }, []);

  return {
    isNative: isNative(),
    platform: getPlatform(),
    isActive,
    isConnected,
    connectionType,
    appInfo,
  };
}

/**
 * Hook for handling back button (Android)
 */
export function useBackButton(handler: () => boolean | void): void {
  useEffect(() => {
    const cleanup = appModule.onBackButton(() => {
      const handled = handler();
      // If handler returns false, exit the app
      if (handled === false) {
        appModule.exitApp();
      }
    });

    return cleanup;
  }, [handler]);
}

/**
 * Hook for handling deep links
 */
export function useDeepLink(handler: (url: string) => void): void {
  useEffect(() => {
    // Check for launch URL first
    appModule.getLaunchUrl().then((url) => {
      if (url) handler(url);
    });

    // Listen for new deep links
    const cleanup = appModule.onDeepLink(handler);

    return cleanup;
  }, [handler]);
}
