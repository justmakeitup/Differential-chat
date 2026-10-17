import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Universal Notification Service for Differential
 * Bridges Capacitor Native Android Notifications and HTML5 Web Notifications
 */

let isCapacitorNative = false;
if (typeof window !== 'undefined') {
  isCapacitorNative = !!(window as any).Capacitor?.isNativePlatform?.();
}

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (isCapacitorNative) {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    }
  } catch (err) {
    console.warn('[Notifications] Permission request error:', err);
  }
  return false;
};

export interface PushNotificationOptions {
  id?: number;
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export const sendSystemNotification = async ({
  id,
  title,
  body,
  url,
  icon = '/favicon.svg'
}: PushNotificationOptions) => {
  try {
    const notifId = id || Math.floor(Math.random() * 100000);

    if (isCapacitorNative) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: notifId,
            schedule: { at: new Date(Date.now() + 100) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: { url }
          }
        ]
      });
      return;
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: `differential-${notifId}`
      });

      if (url) {
        notif.onclick = () => {
          window.focus();
          window.location.hash = url;
          notif.close();
        };
      }
    }
  } catch (err) {
    console.warn('[Notifications] Failed to display notification:', err);
  }
};
