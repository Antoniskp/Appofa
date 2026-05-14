/**
 * Appofa Service Worker — PWA Push Notifications & Badge
 *
 * iOS PWA (Web Push) requirements:
 *   - iOS 16.4+ required.
 *   - App MUST be installed to Home Screen (Add to Home Screen), NOT running in a Safari tab.
 *   - Notification.requestPermission() must be triggered by a direct user gesture (button click).
 *     This is handled in components/notifications/PushNotificationEnable.js.
 *
 * Push payload JSON format expected from backend:
 *   { title: string, body: string, unreadCount: number, url: string }
 *
 * Backend push delivery:
 *   1. Generate VAPID key pair: npx web-push generate-vapid-keys
 *   2. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY (frontend) and VAPID_PRIVATE_KEY (backend) to .env
 *   3. POST /api/push/subscribe persists PushSubscription objects (pushRoutes.js)
 *   4. notificationService.createNotification() fires pushService.sendPushToUser() automatically
 */

self.addEventListener('install', () => {
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all open clients immediately
  event.waitUntil(self.clients.claim());
});

/**
 * Handle incoming push messages sent by the backend via web-push.
 * Shows a system notification and updates the Home Screen badge count.
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    // Payload was not valid JSON — try to read as plain text for debugging,
    // then fall back to defaults so the notification still shows.
    const raw = event.data?.text() ?? '';
    console.warn('[SW] Push payload is not valid JSON:', raw);
  }

  const title = data.title || 'Νέα ειδοποίηση';
  const body = data.body || '';
  // Accept numeric or numeric-string values; treat anything else as 0.
  const unreadCount = Number.isFinite(Number(data.unreadCount)) ? Number(data.unreadCount) : 0;
  const url = data.url || '/notifications';

  event.waitUntil(
    (async () => {
      // Show the system notification
      await self.registration.showNotification(title, {
        body,
        icon: '/images/branding/appofasi-high-resolution-logo-transparent.png',
        badge: '/images/branding/appofasi-high-resolution-logo-transparent.png',
        data: { url },
      });

      // Update the Home Screen icon badge count (iOS 16.4+ / Android Chrome)
      if ('setAppBadge' in self.registration && Number.isFinite(unreadCount)) {
        if (unreadCount > 0) {
          await self.registration.setAppBadge(unreadCount);
        } else if ('clearAppBadge' in self.registration) {
          await self.registration.clearAppBadge();
        }
      }
    })()
  );
});

/**
 * Handle notification click — focus the existing app window or open a new one.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/notifications';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to focus an existing open window
        for (const client of clients) {
          if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Fall back to opening a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
