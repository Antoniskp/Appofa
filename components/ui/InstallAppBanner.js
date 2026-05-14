'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const DISMISSED_KEY = 'appofa_install_banner_dismissed';

export default function InstallAppBanner() {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
  }, []);

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl px-5 py-4 flex items-center justify-between gap-4 text-white">
      <div className="flex items-center gap-3 min-w-0">
        <DevicePhoneMobileIcon className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-bold text-sm leading-snug">📱 Χρησιμοποίησέ μας σαν εφαρμογή!</p>
          <p className="text-sm opacity-90 mt-0.5">
            Πρόσθεσε το Appofa στην αρχική οθόνη σου — χωρίς λήψη.
          </p>
        </div>
      </div>
      <div className="flex items-center flex-shrink-0">
        <Link
          href="/platform/install-app"
          className="bg-white text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
        >
          Μάθε πώς
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Κλείσιμο"
          className="text-white/70 hover:text-white ml-2 text-xl leading-none flex-shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  );
}
