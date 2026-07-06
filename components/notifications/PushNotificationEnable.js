'use client';

import { useState, useEffect, useCallback } from 'react';
import { ensurePushSubscription, getVapidPublicKey, isPushSupported } from '@/lib/pushNotifications';
import { pushAPI } from '@/lib/api';

/** Convert a VAPID base64url public key to a Uint8Array for pushManager.subscribe(). */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * PushNotificationEnable — "Enable notifications" button for iOS PWA users.
 *
 * iOS PWA (Web Push) requirements:
 *   - App must be installed to Home Screen ("Add to Home Screen"), NOT run from a Safari tab.
 *   - Notification.requestPermission() MUST be triggered by a user gesture (button click).
 *     Do NOT call requestPermission() on page load — it will silently fail on iOS.
 *   - Requires iOS 16.4+.
 *
 * After granting permission and completing push subscription, iOS will show the app in
 * Settings → Notifications, and the Home Screen icon will display badge counts.
 *
 * Backend push delivery (implemented — see src/routes/pushRoutes.js + src/services/pushService.js):
 *   1. Generate VAPID keys: npx web-push generate-vapid-keys
 *   2. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY (frontend) + VAPID_PRIVATE_KEY (backend) in .env
 *   3. POST /api/push/subscribe stores the PushSubscription (pushController.js)
 *   4. notificationService.createNotification() calls pushService.sendPushToUser() automatically
 */

export default function PushNotificationEnable() {
  // 'default' | 'granted' | 'denied' | 'unsupported'
  const [permission, setPermission] = useState('default');
  const [statusText, setStatusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [repairLoading, setRepairLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await pushAPI.status();
      setPushStatus(res.data || null);
    } catch (err) {
      console.warn('[PushNotificationEnable] Failed to load push status:', err);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const handleTestPush = useCallback(async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await pushAPI.test();
      setTestResult(res.data || null);
      await loadStatus();
    } catch (err) {
      console.error('[PushNotificationEnable] Failed to send test push:', err);
      setTestResult({ sent: 0, failed: 1, staleRemoved: 0, skipped: true });
    } finally {
      setTestLoading(false);
    }
  }, [loadStatus]);

  const handleSyncDevice = useCallback(async () => {
    setRepairLoading(true);
    setStatusText('');
    try {
      await ensurePushSubscription();
      await loadStatus();
      setStatusText('This device subscription was synced with the server.');
    } catch (err) {
      console.error('[PushNotificationEnable] Failed to sync push subscription:', err);
      setStatusText('Could not sync this device subscription. Please try again.');
    } finally {
      setRepairLoading(false);
    }
  }, [loadStatus]);

  // Read the current permission state on mount — does NOT trigger any prompt.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPushSupported()) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (permission === 'granted') {
      loadStatus();
    }
  }, [permission, loadStatus]);

  if (permission === 'unsupported') {
    return (
      <p className="mt-3 text-sm text-gray-400">
        Οι ειδοποιήσεις push δεν υποστηρίζονται από αυτό τον browser.
      </p>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
        <p className="text-sm text-red-700">
          Οι ειδοποιήσεις push έχουν αποκλειστεί. Για να τις ενεργοποιήσετε, μεταβείτε στις{' '}
          <strong>Ρυθμίσεις iOS → Ειδοποιήσεις</strong> και ενεργοποιήστε τις για αυτή την
          εφαρμογή.
        </p>
      </div>
    );
  }

  if (permission === 'granted') {
    const subscriptionCount = pushStatus?.subscriptionCount ?? 0;
    const providerHosts = pushStatus?.providerHosts?.join(', ') || 'none';
    const vapidOk = pushStatus?.vapid?.configured;

    return (
      <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-base" aria-hidden="true">OK</span>
          <p className="text-sm text-green-700">Push permission is enabled on this device.</p>
        </div>
        <div className="mt-3 rounded-md bg-white/70 border border-green-100 p-2 text-xs text-gray-600">
          {statusLoading ? (
            <p>Checking server push status...</p>
          ) : (
            <>
              <p>Server subscriptions: {subscriptionCount}</p>
              <p>Push provider: {providerHosts}</p>
              <p>VAPID configured: {vapidOk ? 'yes' : 'no'}</p>
              {pushStatus?.latestSubscriptionAt && (
                <p>Last synced: {new Date(pushStatus.latestSubscriptionAt).toLocaleString()}</p>
              )}
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadStatus}
            disabled={statusLoading}
            className="px-3 py-1.5 rounded-md border border-green-200 bg-white text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            Refresh status
          </button>
          <button
            type="button"
            onClick={handleTestPush}
            disabled={testLoading}
            className="px-3 py-1.5 rounded-md bg-green-700 text-xs font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            {testLoading ? 'Sending...' : 'Send test push'}
          </button>
          <button
            type="button"
            onClick={handleSyncDevice}
            disabled={repairLoading}
            className="px-3 py-1.5 rounded-md border border-green-200 bg-white text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            {repairLoading ? 'Syncing...' : 'Sync this device'}
          </button>
        </div>
        {testResult && (
          <p className="mt-2 text-xs text-gray-600">
            Test result: sent {testResult.sent ?? 0}, failed {testResult.failed ?? 0}, stale removed {testResult.staleRemoved ?? 0}{testResult.skipped ? ', skipped' : ''}
          </p>
        )}
        {statusText && (
          <p className="mt-2 text-xs text-gray-600">{statusText}</p>
        )}
      </div>
    );
  }

  /**
   * handleEnable — runs entirely inside the click handler so that
   * Notification.requestPermission() is executed within a user gesture,
   * satisfying the iOS 16.4+ PWA requirement.
   */
  const handleEnable = async () => {
    setLoading(true);
    setStatusText('');

    try {
      // ── Step 1: Request notification permission ────────────────────────────
      // This MUST be called from a direct user gesture on iOS.
      if (!isPushSupported()) {
        setStatusText('Οι ειδοποιήσεις δεν υποστηρίζονται από αυτό τον browser.');
        setPermission('unsupported');
        return;
      }

      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'denied') {
        setStatusText('Η άδεια ειδοποιήσεων απορρίφθηκε. Αλλάξτε τη στις Ρυθμίσεις iOS.');
        return;
      }
      if (result !== 'granted') {
        setStatusText('Δεν δόθηκε άδεια για ειδοποιήσεις.');
        return;
      }

      // ── Step 2: Ensure Service Worker is available and active ──────────────
      if (!('serviceWorker' in navigator)) {
        setStatusText('Το Service Worker δεν υποστηρίζεται σε αυτό τον browser.');
        return;
      }

      // Register /sw.js if it is not already registered
      await navigator.serviceWorker.register('/sw.js');
      // Wait until the service worker is fully active before subscribing
      const registration = await navigator.serviceWorker.ready;

      // ── Step 3: Subscribe to push ──────────────────────────────────────────
      // NEXT_PUBLIC_VAPID_PUBLIC_KEY must be set in the environment.
      // Generate a VAPID key pair with: npx web-push generate-vapid-keys
      const vapidKey = getVapidPublicKey();
      if (!vapidKey) {
        // Permission is granted and SW is ready; push subscription cannot proceed
        // without a VAPID key. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env (see README).
        setStatusText(
          'Η άδεια δόθηκε, αλλά οι push ειδοποιήσεις δεν είναι ακόμα ρυθμισμένες. Επικοινωνήστε με τον διαχειριστή για να ολοκληρωθεί η ρύθμιση.'
        );
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      // ── Step 4: Send subscription to backend ──────────────────────────────
      await ensurePushSubscription();
      await loadStatus();

      setStatusText('Οι ειδοποιήσεις ενεργοποιήθηκαν επιτυχώς!');
    } catch (err) {
      console.error('[PushNotificationEnable]', err);
      setStatusText('Σφάλμα κατά την ενεργοποίηση ειδοποιήσεων. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {/*
       * iOS PWA note: this button satisfies the "user gesture" requirement.
       * Do NOT move Notification.requestPermission() outside this click handler.
       */}
      <button
        type="button"
        onClick={handleEnable}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <span aria-hidden="true">🔔</span>
        {loading ? 'Ενεργοποίηση...' : 'Ενεργοποίηση ειδοποιήσεων'}
      </button>

      {statusText && (
        <p className="mt-2 text-sm text-gray-600">{statusText}</p>
      )}

      <p className="mt-2 text-xs text-gray-400">
        Απαιτείται iOS 16.4+ και εγκατάσταση στην Αρχική Οθόνη (Add to Home Screen) για push
        ειδοποιήσεις.
      </p>
    </div>
  );
}
