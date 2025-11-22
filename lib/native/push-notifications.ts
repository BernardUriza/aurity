// =============================================================================
// Native Push Notifications Module
// =============================================================================
// Handles native push notifications for iOS and Android
// =============================================================================

import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { isPluginAvailable, isNative } from './platform';

const PLUGIN_NAME = 'PushNotifications';

export interface PushNotificationToken {
  value: string;
}

export interface PushNotification {
  id: string;
  title?: string;
  body?: string;
  data: Record<string, unknown>;
}

export type TokenCallback = (token: PushNotificationToken) => void;
export type NotificationCallback = (notification: PushNotification) => void;
export type ActionCallback = (action: { actionId: string; notification: PushNotification }) => void;

/**
 * Check if push notifications are available
 */
export function isPushAvailable(): boolean {
  return isNative() && isPluginAvailable(PLUGIN_NAME);
}

/**
 * Request permission for push notifications
 */
export async function requestPermission(): Promise<boolean> {
  if (!isPushAvailable()) return false;

  const result = await PushNotifications.requestPermissions();
  return result.receive === 'granted';
}

/**
 * Check current permission status
 */
export async function checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!isPushAvailable()) return 'denied';

  const result = await PushNotifications.checkPermissions();
  return result.receive;
}

/**
 * Register for push notifications (call after permission granted)
 */
export async function register(): Promise<void> {
  if (!isPushAvailable()) return;
  await PushNotifications.register();
}

/**
 * Listen for registration token
 */
export function onRegistration(callback: TokenCallback): () => void {
  if (!isPushAvailable()) return () => {};

  const handle = PushNotifications.addListener('registration', (token: Token) => {
    callback({ value: token.value });
  });

  return () => {
    handle.then((h) => h.remove());
  };
}

/**
 * Listen for registration errors
 */
export function onRegistrationError(callback: (error: Error) => void): () => void {
  if (!isPushAvailable()) return () => {};

  const handle = PushNotifications.addListener('registrationError', (error) => {
    callback(new Error(error.error));
  });

  return () => {
    handle.then((h) => h.remove());
  };
}

/**
 * Listen for push notifications received
 */
export function onNotificationReceived(callback: NotificationCallback): () => void {
  if (!isPushAvailable()) return () => {};

  const handle = PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      callback({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
    }
  );

  return () => {
    handle.then((h) => h.remove());
  };
}

/**
 * Listen for notification action performed (user tapped notification)
 */
export function onNotificationAction(callback: ActionCallback): () => void {
  if (!isPushAvailable()) return () => {};

  const handle = PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: ActionPerformed) => {
      callback({
        actionId: action.actionId,
        notification: {
          id: action.notification.id,
          title: action.notification.title,
          body: action.notification.body,
          data: action.notification.data,
        },
      });
    }
  );

  return () => {
    handle.then((h) => h.remove());
  };
}

/**
 * Get list of delivered notifications
 */
export async function getDeliveredNotifications(): Promise<PushNotification[]> {
  if (!isPushAvailable()) return [];

  const result = await PushNotifications.getDeliveredNotifications();
  return result.notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    data: n.data,
  }));
}

/**
 * Remove all delivered notifications
 */
export async function removeAllDeliveredNotifications(): Promise<void> {
  if (!isPushAvailable()) return;
  await PushNotifications.removeAllDeliveredNotifications();
}

/**
 * Remove specific delivered notifications
 */
export async function removeDeliveredNotifications(ids: string[]): Promise<void> {
  if (!isPushAvailable()) return;
  await PushNotifications.removeDeliveredNotifications({ notifications: ids.map((id) => ({ id })) });
}

/**
 * Initialize push notifications with all listeners
 */
export function initPushNotifications(options: {
  onToken: TokenCallback;
  onNotification: NotificationCallback;
  onAction: ActionCallback;
  onError?: (error: Error) => void;
}): () => void {
  const cleanups: Array<() => void> = [];

  cleanups.push(onRegistration(options.onToken));
  cleanups.push(onNotificationReceived(options.onNotification));
  cleanups.push(onNotificationAction(options.onAction));

  if (options.onError) {
    cleanups.push(onRegistrationError(options.onError));
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
