'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ensurePushSubscription, isPushSupported } from '@/lib/pushNotifications';

/**
 * Keeps an already-approved Web Push subscription fresh.
 * This never asks for permission; the explicit enable button still owns that
 * user gesture. It only repairs/resends the server subscription when permission
 * is already granted.
 */
export default function PushSubscriptionSync() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user || !isPushSupported() || Notification.permission !== 'granted') {
      return undefined;
    }

    let cancelled = false;
    const sync = async () => {
      try {
        await ensurePushSubscription();
      } catch (err) {
        if (!cancelled && err?.code !== 'missing_vapid_key') {
          console.warn('[PushSubscriptionSync] Failed to refresh push subscription:', err);
        }
      }
    };

    sync();
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [loading, user]);

  return null;
}
