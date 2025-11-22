// =============================================================================
// Native Module - Public API
// =============================================================================
// Unified access to native Capacitor features
// =============================================================================

// Platform detection
export {
  isNative,
  getPlatform,
  isPluginAvailable,
  isIOS,
  isAndroid,
  isWeb,
  convertFileSrc,
} from './platform';

export type { Platform } from './platform';

// Haptics
export * as haptics from './haptics';

// Status Bar
export * as statusBar from './status-bar';

// Keyboard
export * as keyboard from './keyboard';

// Push Notifications
export * as pushNotifications from './push-notifications';

// Network
export * as network from './network';

// App Lifecycle
export * as app from './app';
