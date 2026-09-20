'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/constants/i18n';

const LOCALE_OPTIONS = [
  { value: 'el', label: 'ΕΛ', flag: '🇬🇷', ariaLabel: 'Ελληνικά' },
  { value: 'en', label: 'EN', flag: '🇬🇧', ariaLabel: 'English' },
  { value: 'ro', label: 'RO', flag: '🇷🇴', ariaLabel: 'Română' },
];

export default function LanguageSwitcher() {
  const t = useTranslations('redesign');
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
    <select
      aria-label={t('language')}
      value={current}
      onChange={event => handleSwitch(event.target.value)}
      className="min-h-11 shrink-0 cursor-pointer rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-brand-border hover:border-white/50"
    >
      {LOCALE_OPTIONS.map(option => <option key={option.value} value={option.value} lang={option.value} className="bg-charcoal text-white">{option.ariaLabel}</option>)}
    </select>
  );
}
