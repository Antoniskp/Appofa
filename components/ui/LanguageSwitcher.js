'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_LOCALE } from '@/lib/constants/i18n';

const LOCALE_COOKIE_MAX_AGE_SECONDS = 31536000;
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

const getLocaleCookie = () => {
  const localeCookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE_NAME}=`));

  if (!localeCookie) return null;

  const cookieValue = localeCookie.substring(`${LOCALE_COOKIE_NAME}=`.length);
  return cookieValue ? decodeURIComponent(cookieValue) : null;
};

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const locale = getLocaleCookie();
    if (locale) setCurrent(locale);
  }, []);

  const handleSwitch = (locale) => {
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => handleSwitch('el')}
        className={`px-2 py-1 rounded ${current === 'el' ? 'font-bold' : 'opacity-50 hover:opacity-100'}`}
      >
        🇬🇷 ΕΛ
      </button>
      <span className="opacity-30">|</span>
      <button
        type="button"
        onClick={() => handleSwitch('en')}
        className={`px-2 py-1 rounded ${current === 'en' ? 'font-bold' : 'opacity-50 hover:opacity-100'}`}
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
