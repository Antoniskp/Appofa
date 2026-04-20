'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/constants/i18n';

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const match = document.cookie.split('; ').find((r) => r.startsWith('NEXT_LOCALE='));
    if (!match) return;

    const locale = match.split('=')[1];
    if (SUPPORTED_LOCALES.includes(locale)) {
      setCurrent(locale);
    }
  }, []);

  const handleSwitch = (locale) => {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      return;
    }

    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => handleSwitch('el')}
        className={`px-2 py-1 rounded ${current === 'el' ? 'font-bold' : 'opacity-50 hover:opacity-100'}`}
        aria-label="Ελληνικά"
      >
        🇬🇷 ΕΛ
      </button>
      <span className="opacity-30">|</span>
      <button
        onClick={() => handleSwitch('en')}
        className={`px-2 py-1 rounded ${current === 'en' ? 'font-bold' : 'opacity-50 hover:opacity-100'}`}
        aria-label="English"
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
