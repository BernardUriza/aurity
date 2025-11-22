// =============================================================================
// Native Keyboard Module
// =============================================================================
// Controls native keyboard behavior
// =============================================================================

import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { isPluginAvailable } from './platform';

const PLUGIN_NAME = 'Keyboard';

export type KeyboardEventCallback = (info: { keyboardHeight: number }) => void;

/**
 * Check if keyboard control is available
 */
export function isKeyboardAvailable(): boolean {
  return isPluginAvailable(PLUGIN_NAME);
}

/**
 * Show the keyboard
 */
export async function show(): Promise<void> {
  if (!isKeyboardAvailable()) return;
  await Keyboard.show();
}

/**
 * Hide the keyboard
 */
export async function hide(): Promise<void> {
  if (!isKeyboardAvailable()) return;
  await Keyboard.hide();
}

/**
 * Set keyboard resize mode
 */
export async function setResizeMode(mode: 'body' | 'ionic' | 'native' | 'none'): Promise<void> {
  if (!isKeyboardAvailable()) return;

  const modeMap: Record<string, KeyboardResize> = {
    body: KeyboardResize.Body,
    ionic: KeyboardResize.Ionic,
    native: KeyboardResize.Native,
    none: KeyboardResize.None,
  };

  await Keyboard.setResizeMode({ mode: modeMap[mode] });
}

/**
 * Set whether to scroll to focused input
 */
export async function setScroll(scroll: boolean): Promise<void> {
  if (!isKeyboardAvailable()) return;
  await Keyboard.setScroll({ isDisabled: !scroll });
}

/**
 * Add keyboard show listener
 */
export function onKeyboardShow(callback: KeyboardEventCallback): () => void {
  if (!isKeyboardAvailable()) return () => {};

  const handle = Keyboard.addListener('keyboardWillShow', callback);

  return () => {
    handle.then((h) => h.remove());
  };
}

/**
 * Add keyboard hide listener
 */
export function onKeyboardHide(callback: () => void): () => void {
  if (!isKeyboardAvailable()) return () => {};

  const handle = Keyboard.addListener('keyboardWillHide', callback);

  return () => {
    handle.then((h) => h.remove());
  };
}

/**
 * Set accessory bar visibility (iOS only)
 */
export async function setAccessoryBarVisible(visible: boolean): Promise<void> {
  if (!isKeyboardAvailable()) return;
  await Keyboard.setAccessoryBarVisible({ isVisible: visible });
}
