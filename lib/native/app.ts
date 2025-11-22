// =============================================================================
// Native App Module
// =============================================================================
// Handles app lifecycle and deep links
// =============================================================================

import { App, URLOpenListenerEvent, AppState } from '@capacitor/app';
import { isPluginAvailable, isNative } from './platform';

const PLUGIN_NAME = 'App';

export type AppStateCallback = (state: { isActive: boolean }) => void;
export type DeepLinkCallback = (url: string) => void;
export type BackButtonCallback = () => void;

/**
 * Check if app plugin is available
 */
export function isAppPluginAvailable(): boolean {
  return isPluginAvailable(PLUGIN_NAME);
}

/**
 * Get app info
 */
export async function getInfo(): Promise<{
  name: string;
  id: string;
  build: string;
  version: string;
} | null> {
  if (!isAppPluginAvailable() || !isNative()) return null;

  const info = await App.getInfo();
  return {
    name: info.name,
    id: info.id,
    build: info.build,
    version: info.version,
  };
}

/**
 * Get app state (foreground/background)
 */
export async function getState(): Promise<{ isActive: boolean }> {
  if (!isAppPluginAvailable()) {
    return { isActive: typeof document !== 'undefined' ? !document.hidden : true };
  }

  const state = await App.getState();
  return { isActive: state.isActive };
}

/**
 * Listen for app state changes
 */
export function onAppStateChange(callback: AppStateCallback): () => void {
  if (!isAppPluginAvailable()) {
    // Fallback to web visibility API
    if (typeof document === 'undefined') return () => {};

    const handleVisibilityChange = () => {
      callback({ isActive: !document.hidden });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  const handle = App.addListener('appStateChange', (state: AppState) => {
    callback({ isActive: state.isActive });
  });

  return () => {
    handle.then((h) => h.remove());
  };
}

/**
 * Listen for deep links / app URLs
 */
export function onDeepLink(callback: DeepLinkCallback): () => void {
  if (!isAppPluginAvailable()) return () => {};

  const handle = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    callback(event.url);
  });

  return () => {
    handle.then((h) => h.remove());
  };
}

/**
 * Listen for back button (Android)
 */
export function onBackButton(callback: BackButtonCallback): () => void {
  if (!isAppPluginAvailable()) return () => {};

  const handle = App.addListener('backButton', () => {
    callback();
  });

  return () => {
    handle.then((h) => h.remove());
  };
}

/**
 * Exit the app (Android only)
 */
export async function exitApp(): Promise<void> {
  if (!isAppPluginAvailable()) return;
  await App.exitApp();
}

/**
 * Minimize the app (Android only)
 */
export async function minimizeApp(): Promise<void> {
  if (!isAppPluginAvailable()) return;
  await App.minimizeApp();
}

/**
 * Get launch URL (deep link that opened the app)
 */
export async function getLaunchUrl(): Promise<string | null> {
  if (!isAppPluginAvailable()) return null;

  const result = await App.getLaunchUrl();
  return result?.url ?? null;
}
