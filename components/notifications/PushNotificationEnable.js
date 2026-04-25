'use client';

import { useState, useEffect } from 'react';

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
 * Backend setup needed to send push messages:
 *   1. Generate VAPID keys: npx web-push generate-vapid-keys
 *   2. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY (frontend) + VAPID_PRIVATE_KEY (backend) in .env
 *   3. Implement POST /api/push/subscribe to store the PushSubscription
 *   4. Use the `web-push` npm package on the backend to deliver notifications
 */

/** Convert a VAPID base64url public key to a Uint8Array for pushManager.subscribe(). */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushNotificationEnable() {
  // 'default' | 'granted' | 'denied' | 'unsupported'
  const [permission, setPermission] = useState('default');
  const [statusText, setStatusText] = useState('');
  const [loading, setLoading] = useState(false);

  // Read the current permission state on mount — does NOT trigger any prompt.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

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
    return (
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
        <span className="text-green-600 text-base" aria-hidden="true">✓</span>
        <p className="text-sm text-green-700">Οι ειδοποιήσεις push είναι ενεργοποιημένες.</p>
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
      if (!('Notification' in window)) {
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
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        // Permission is granted and SW is ready; push subscription cannot proceed
        // without a VAPID key. Notify the user and log for maintainers.
        // TODO: Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env and implement the backend endpoint.
        setStatusText(
          'Ειδοποιήσεις ενεργοποιήθηκαν (push εκκρεμεί ρύθμιση — επικοινωνήστε με τον διαχειριστή).'
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
      // TODO: Implement POST /api/push/subscribe on the backend to persist
      //       the PushSubscription and associate it with the logged-in user.
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(subscription),
      });
      if (!res.ok) throw new Error(`Backend responded with ${res.status}`);

      setStatusText('Οι ειδοποιήσεις ενεργοποιήθηκαν επιτυχώς!');
    } catch (err) {
      console.error('[PushNotificationEnable]', err);
      setStatusText(`Σφάλμα: ${err.message}`);
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
