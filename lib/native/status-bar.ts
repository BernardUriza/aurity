// =============================================================================
// Native Status Bar Module
// =============================================================================
// Controls the device status bar appearance
// =============================================================================

import { StatusBar, Style } from '@capacitor/status-bar';
import { isPluginAvailable, isAndroid } from './platform';

const PLUGIN_NAME = 'StatusBar';

/**
 * Check if status bar control is available
 */
export function isStatusBarAvailable(): boolean {
  return isPluginAvailable(PLUGIN_NAME);
}

/**
 * Set status bar style to light (dark text/icons)
 */
export async function setLight(): Promise<void> {
  if (!isStatusBarAvailable()) return;
  await StatusBar.setStyle({ style: Style.Light });
}

/**
 * Set status bar style to dark (light text/icons)
 */
export async function setDark(): Promise<void> {
  if (!isStatusBarAvailable()) return;
  await StatusBar.setStyle({ style: Style.Dark });
}

/**
 * Set status bar background color (Android only)
 */
export async function setBackgroundColor(color: string): Promise<void> {
  if (!isStatusBarAvailable() || !isAndroid()) return;
  await StatusBar.setBackgroundColor({ color });
}

/**
 * Show status bar
 */
export async function show(): Promise<void> {
  if (!isStatusBarAvailable()) return;
  await StatusBar.show();
}

/**
 * Hide status bar
 */
export async function hide(): Promise<void> {
  if (!isStatusBarAvailable()) return;
  await StatusBar.hide();
}

/**
 * Set overlay mode (content under status bar)
 */
export async function setOverlaysWebView(overlay: boolean): Promise<void> {
  if (!isStatusBarAvailable()) return;
  await StatusBar.setOverlaysWebView({ overlay });
}

/**
 * Configure status bar for dark theme
 */
export async function configureForDarkTheme(): Promise<void> {
  if (!isStatusBarAvailable()) return;
  await setDark();
  if (isAndroid()) {
    await setBackgroundColor('#0f172a');
  }
}

/**
 * Configure status bar for light theme
 */
export async function configureForLightTheme(): Promise<void> {
  if (!isStatusBarAvailable()) return;
  await setLight();
  if (isAndroid()) {
    await setBackgroundColor('#ffffff');
  }
}
