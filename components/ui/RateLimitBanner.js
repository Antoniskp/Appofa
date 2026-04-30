'use client';

import { useState, useEffect, useRef } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

/**
 * RateLimitBanner — shown when a rating/vote action hits the server rate limit.
 *
 * Props:
 *   retryAfter  {number|null}  Seconds until the rate-limit window resets.
 *                              Pass null / undefined to omit the countdown.
 *   onExpired   {Function}     Optional callback fired when the countdown reaches 0.
 */
export default function RateLimitBanner({ retryAfter, onExpired }) {
  const tCommon = useTranslations('common');
  const [secondsLeft, setSecondsLeft] = useState(
    typeof retryAfter === 'number' && retryAfter > 0 ? retryAfter : 0
  );
  // Keep a stable ref to the latest onExpired so the effect never goes stale.
  const onExpiredRef = useRef(onExpired);
  useEffect(() => { onExpiredRef.current = onExpired; }, [onExpired]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpiredRef.current?.();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          onExpiredRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (s) => {
    if (s <= 0) return null;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const timeLabel = formatTime(secondsLeft);

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
    >
      <ClockIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" aria-hidden="true" />
      <div>
        <p className="font-semibold text-amber-800">{tCommon('rate_limit_title')}</p>
        <p className="mt-0.5 text-amber-700">{tCommon('rate_limit_reason')}</p>
        {timeLabel ? (
          <p className="mt-1 font-medium text-amber-800">
            {tCommon('rate_limit_retry_in', { time: timeLabel })}
          </p>
        ) : (
          <p className="mt-1 font-medium text-green-700">{tCommon('rate_limit_retry_now')}</p>
        )}
      </div>
    </div>
  );
}
