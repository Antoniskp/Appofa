'use client';

import { useEffect, useState } from 'react';

const LOCALE_COOKIE_MAX_AGE_SECONDS = 31536000;

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState('el');

  useEffect(() => {
    const localeCookie = document.cookie
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('NEXT_LOCALE='));

    if (!localeCookie) return;

    const cookieValue = localeCookie.substring('NEXT_LOCALE='.length);
    if (cookieValue) {
      setCurrent(decodeURIComponent(cookieValue));
    }
  }, []);

  const handleSwitch = (locale) => {
    document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
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
