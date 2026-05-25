'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/constants/i18n';

const LOCALE_OPTIONS = [
  { value: 'el', label: 'ΕΛ', flag: '🇬🇷', ariaLabel: 'Ελληνικά' },
  { value: 'en', label: 'EN', flag: '🇬🇧', ariaLabel: 'English' },
  { value: 'ro', label: 'RO', flag: '🇷🇴', ariaLabel: 'Română' },
];

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
      {LOCALE_OPTIONS.map((option, index) => (
        <div key={option.value} className="contents">
          <button
            onClick={() => handleSwitch(option.value)}
            className={`px-2 py-1 rounded ${current === option.value ? 'font-bold' : 'opacity-50 hover:opacity-100'}`}
            aria-label={option.ariaLabel}
          >
            {option.flag} {option.label}
          </button>
          {index < LOCALE_OPTIONS.length - 1 && <span className="opacity-30">|</span>}
        </div>
      ))}
    </div>
  );
}
