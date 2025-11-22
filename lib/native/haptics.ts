// =============================================================================
// Native Haptics Module
// =============================================================================
// Provides haptic feedback for native apps
// =============================================================================

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isPluginAvailable } from './platform';

const PLUGIN_NAME = 'Haptics';

/**
 * Check if haptics is available
 */
export function isHapticsAvailable(): boolean {
  return isPluginAvailable(PLUGIN_NAME);
}

/**
 * Light impact feedback (for selections)
 */
export async function impactLight(): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}

/**
 * Medium impact feedback (for actions)
 */
export async function impactMedium(): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.impact({ style: ImpactStyle.Medium });
}

/**
 * Heavy impact feedback (for significant actions)
 */
export async function impactHeavy(): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.impact({ style: ImpactStyle.Heavy });
}

/**
 * Selection changed feedback
 */
export async function selectionChanged(): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.selectionChanged();
}

/**
 * Selection start feedback
 */
export async function selectionStart(): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.selectionStart();
}

/**
 * Selection end feedback
 */
export async function selectionEnd(): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.selectionEnd();
}

/**
 * Success notification feedback
 */
export async function notifySuccess(): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.notification({ type: NotificationType.Success });
}

/**
 * Warning notification feedback
 */
export async function notifyWarning(): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.notification({ type: NotificationType.Warning });
}

/**
 * Error notification feedback
 */
export async function notifyError(): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.notification({ type: NotificationType.Error });
}

/**
 * Custom vibration pattern
 */
export async function vibrate(duration: number = 300): Promise<void> {
  if (!isHapticsAvailable()) return;
  await Haptics.vibrate({ duration });
}
