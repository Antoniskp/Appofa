'use client';

import { useEffect, useState } from 'react';

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState('el');

  useEffect(() => {
    const match = document.cookie.split('; ').find((cookie) => cookie.startsWith('NEXT_LOCALE='));
    if (match) setCurrent(match.split('=')[1]);
  }, []);

  const handleSwitch = (locale) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
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
