'use client';

import { pushAPI } from '@/lib/api';

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function getReadyServiceWorkerRegistration() {
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  registration.update?.().catch(() => {});
  return navigator.serviceWorker.ready;
}

export async function ensurePushSubscription() {
  if (!isPushSupported()) {
    const err = new Error('Push notifications are not supported in this browser.');
    err.code = 'push_unsupported';
    throw err;
  }

  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    const err = new Error('VAPID public key is not configured.');
    err.code = 'missing_vapid_key';
    throw err;
  }

  const registration = await getReadyServiceWorkerRegistration();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  await pushAPI.subscribe(subscription.toJSON ? subscription.toJSON() : subscription);
  return subscription;
}
