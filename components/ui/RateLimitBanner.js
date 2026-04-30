'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

/**
 * Displays a rate-limit notice with a live countdown and, for guests,
 * a prompt to register / sign-in to receive higher limits.
 *
 * @param {number|null}  retryAfter      - Seconds until window resets (from 429 response body)
 * @param {number|null}  resetTime       - Epoch-ms timestamp when window resets (from 429 body)
 * @param {boolean}      isAuthenticated - Whether the current user is signed in
 */
export default function RateLimitBanner({ retryAfter, resetTime, isAuthenticated }) {
  const t = useTranslations('common');

  const computeSeconds = () => {
    if (resetTime) return Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
    if (retryAfter) return Math.max(0, retryAfter);
    return 0;
  };

  const [secondsLeft, setSecondsLeft] = useState(computeSeconds);

  useEffect(() => {
    const getSecondsLeft = () => {
      if (resetTime) return Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
      if (retryAfter) return Math.max(0, retryAfter);
      return 0;
    };
    const current = getSecondsLeft();
    if (current <= 0) return;
    const timer = setInterval(() => setSecondsLeft(getSecondsLeft()), 1000);
    return () => clearInterval(timer);
  }, [resetTime, retryAfter]);

  const formatTime = (secs) => {
    if (secs <= 0) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div
      role="alert"
      className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm"
    >
      <p className="font-semibold text-amber-900">{t('rate_limit.title')}</p>
      <p className="text-amber-700 mt-0.5">
        {secondsLeft > 0
          ? t('rate_limit.try_again_in', { time: formatTime(secondsLeft) })
          : t('rate_limit.try_again_now')}
      </p>
      {!isAuthenticated && (
        <div className="mt-2">
          <p className="text-amber-700 mb-1">{t('rate_limit.guest_cta')}</p>
          <div className="flex gap-2">
            <Link
              href="/register"
              className="text-xs font-semibold bg-amber-700 text-white px-2.5 py-1 rounded hover:bg-amber-800 transition"
            >
              {t('rate_limit.sign_up')}
            </Link>
            <Link
              href="/login"
              className="text-xs font-semibold text-amber-800 underline hover:text-amber-900"
            >
              {t('rate_limit.sign_in')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
