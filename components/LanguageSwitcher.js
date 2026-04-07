'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const locales = ['el', 'en'];

const LOCALE_LABELS = {
  el: '🇬🇷 EL',
  en: '🇬🇧 EN',
};

export default function LanguageSwitcher() {
  const pathname = usePathname();

  // pathname is like /el/articles or /en/articles
  // We need to swap the locale segment
  const segments = pathname.split('/');
  const currentLocale = locales.includes(segments[1]) ? segments[1] : 'el';

  const getLocalePath = (locale) => {
    const newSegments = [...segments];
    if (locales.includes(newSegments[1])) {
      newSegments[1] = locale;
    } else {
      newSegments.splice(1, 0, locale);
    }
    return newSegments.join('/') || '/';
  };

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={getLocalePath(locale)}
          className={`text-xs px-2 py-1 rounded transition ${
            locale === currentLocale
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-blue-900 hover:bg-seafoam/40'
          }`}
          aria-label={`Switch to ${locale.toUpperCase()}`}
        >
          {LOCALE_LABELS[locale]}
        </Link>
      ))}
    </div>
  );
}
