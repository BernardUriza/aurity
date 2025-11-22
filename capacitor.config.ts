import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // App Identity
  appId: 'io.aurity.app',
  appName: 'AURITY',

  // Web Build Output (Next.js static export)
  webDir: 'out',

  // Server Configuration
  server: {
    // For development, use live reload
    // url: 'http://192.168.1.100:9000',
    // cleartext: true,

    // For production, use local files
    androidScheme: 'https',
    iosScheme: 'https',
  },

  // ==========================================================================
  // ANDROID Configuration
  // ==========================================================================
  android: {
    // Build flavor
    flavor: 'production',

    // Allow mixed content (if needed for development)
    allowMixedContent: false,

    // Capture input (for keyboard handling)
    captureInput: true,

    // Web View settings
    webContentsDebuggingEnabled: false, // Set to true for debugging

    // Splash screen
    useLegacyBridge: false,
  },

  // ==========================================================================
  // iOS Configuration
  // ==========================================================================
  ios: {
    // Content inset behavior
    contentInset: 'automatic',

    // Allow navigation to external URLs
    allowsLinkPreview: true,

    // Scroll settings
    scrollEnabled: true,

    // Status bar
    preferredContentMode: 'mobile',
  },

  // ==========================================================================
  // Plugins Configuration
  // ==========================================================================
  plugins: {
    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    // Status Bar
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0f172a',
    },

    // Keyboard
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },

    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Local Notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#3b82f6',
      sound: 'default',
    },
  },
};

export default config;
