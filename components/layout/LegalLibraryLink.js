'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { buildAuthPath } from '@/lib/auth-redirect';

const STATUS_INTERVAL_MS = 30000;

export default function LegalLibraryLink({ user, loading }) {
  const t = useTranslations('footer');
  const [online, setOnline] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let checking = false;

    async function refreshStatus() {
      if (document.hidden || checking) return;
      checking = true;
      try {
        const response = await fetch('/api/laws/availability', {
          cache: 'no-store',
          credentials: 'omit',
          signal: controller.signal,
        });
        const status = response.ok ? await response.json() : null;
        if (!controller.signal.aborted) setOnline(status?.online === true);
      } catch {
        if (!controller.signal.aborted) setOnline(false);
      } finally {
        checking = false;
      }
    }

    refreshStatus();
    const timer = window.setInterval(refreshStatus, STATUS_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshStatus);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshStatus);
    };
  }, []);

  const canOpen = !loading && online && user?.emailVerified === true;
  const statusLabel = online === null ? 'legal_library_checking' : online ? 'legal_library_online' : 'legal_library_offline';
  const dotColor = online === null ? 'bg-gray-400' : online ? 'bg-green-400' : 'bg-red-400';
  const label = t('legal_library');

  return (
    <div className="text-sm text-brand-border">
      <div className="inline-flex flex-wrap items-center gap-x-2">
        {canOpen ? (
          <a className="transition-colors hover:text-white hover:underline" href="/laws">{label}</a>
        ) : <span>{label}</span>}
        <span className="inline-flex items-center gap-1.5 text-xs" role="status">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotColor}`} />
          {t(statusLabel)}
        </span>
      </div>
      {!loading && online && !canOpen && (
        <Link
          href={user ? '#email-verification' : buildAuthPath('/login', '/laws')}
          className="block w-fit underline transition-colors hover:text-white"
        >
          {t(user ? 'legal_library_verify' : 'legal_library_sign_in')}
        </Link>
      )}
    </div>
  );
}
