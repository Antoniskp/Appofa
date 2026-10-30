'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import RateLimitBanner from './RateLimitBanner';

export default function BrowsingLimitNotice() {
  const { user } = useAuth();
  const pathname = usePathname();
  const t = useTranslations('common');
  const [notice, setNotice] = useState(null);
  const identity = user?.id ?? null;

  useEffect(() => {
    const onLimit = event => setNotice({ ...event.detail, identity });
    window.addEventListener('api:browsing-limited', onLimit);
    return () => window.removeEventListener('api:browsing-limited', onLimit);
  }, [identity]);

  if (!notice || notice.identity !== identity || ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname)) return null;

  return (
    <aside className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl shadow-lg md:bottom-6" aria-label={t('rate_limit.title')}>
      <div className="relative">
        <RateLimitBanner {...notice} isAuthenticated={Boolean(user)} browsing />
        <button type="button" onClick={() => setNotice(null)} aria-label={t('rate_limit.dismiss')} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-amber-900 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-700">×</button>
      </div>
    </aside>
  );
}
