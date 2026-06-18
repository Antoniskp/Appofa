'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import HomePage from '@/app/page';
import { useTranslations } from 'next-intl';
import { isValidCountryCode, saveUserCountry } from '@/lib/geo/countryResolver';

const normalizeCountryCode = (value) => {
  if (!value) return null;
  const upper = String(value).toUpperCase().trim();
  return isValidCountryCode(upper) ? upper : null;
};

export default function CountryLandingPage() {
  const tCommon = useTranslations('common');
  const params = useParams();
  const code = normalizeCountryCode(params?.code);

  useEffect(() => {
    if (!code) return;
    saveUserCountry(code);
    document.cookie = 'appofa_country_visited=1; path=/; max-age=86400; SameSite=Lax';
  }, [code]);

  if (!code) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="app-container rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="mb-3 text-red-600">{tCommon('not_found')}</p>
          <Link href="/" className="text-blue-700 hover:underline">{tCommon('back')}</Link>
        </div>
      </div>
    );
  }

  return <HomePage />;
}
