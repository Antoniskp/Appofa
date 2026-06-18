'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { articleAPI, geoAPI, locationAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import CountryFundingBanner from '@/components/locations/CountryFundingBanner';
import { useTranslations } from 'next-intl';
import { saveUserCountry, isValidCountryCode } from '@/lib/geo/countryResolver';

const ISO2_RE = /^[A-Z]{2}$/;
const INVALID_FLAG_CODES = new Set(['XX', 'T1']);

const countryCodeToFlag = (code) => {
  if (!code) return '🌍';
  const upper = String(code).toUpperCase();
  if (!ISO2_RE.test(upper) || INVALID_FLAG_CODES.has(upper)) return '🌍';
  return [...upper].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
};

const extractBrowserLocaleCountryCode = () => {
  if (typeof navigator === 'undefined') return null;
  const browserLocale = navigator.language
    || (navigator.languages?.length > 0 ? navigator.languages[0] : null)
    || null;
  if (!browserLocale || !browserLocale.includes('-')) return null;
  const maybeCountry = browserLocale.split('-')[1]?.toUpperCase() || null;
  return ISO2_RE.test(maybeCountry || '') && !INVALID_FLAG_CODES.has(maybeCountry) ? maybeCountry : null;
};

const renderArticleLink = (article) => (
  <li key={article.id}>
    <Link
      href={article.type === 'news' ? `/news/${article.id}` : `/articles/${article.id}`}
      className="text-blue-700 hover:text-blue-900 hover:underline"
    >
      {article.title}
    </Link>
  </li>
);

export default function CountryLandingPage() {
  const tCountry = useTranslations('country_page');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const code = String(params.code || '').toUpperCase();
  const [geoPanelState, setGeoPanelState] = useState({
    detectedCountryCode: null,
    detectedCountryName: null,
    detectionSource: 'none',
    trustedForCountryRedirect: false,
    browserLocaleCountryCode: null,
    appliedCountryCode: code,
  });

  useEffect(() => {
    const browserLocaleCountryCode = extractBrowserLocaleCountryCode();

    geoAPI.detect()
      .then((res) => {
        const data = res?.data || {};
        const detectedCountryCode = data.countryCode ? String(data.countryCode).toUpperCase() : null;
        setGeoPanelState({
          detectedCountryCode,
          detectedCountryName: data.countryName || null,
          detectionSource: data.detectionSource || 'none',
          trustedForCountryRedirect: Boolean(data.trustedForCountryRedirect),
          browserLocaleCountryCode,
          appliedCountryCode: code,
        });
      })
      .catch(() => {
        setGeoPanelState((prev) => ({
          ...prev,
          browserLocaleCountryCode,
          appliedCountryCode: code,
          detectionSource: prev.detectionSource || 'none',
        }));
      });
  }, [code]);

  const { data, loading, error } = useAsyncData(
    async () => {
      const locationResponse = await locationAPI.getAll({ code, type: 'country', limit: 1 });
      const location = Array.isArray(locationResponse?.locations) ? locationResponse.locations[0] : null;

      if (!location) {
        return {
          location: null,
          funding: null,
          news: [],
          articles: [],
        };
      }

      const [fundingResponse, articlesResponse] = await Promise.all([
        geoAPI.getCountryFunding(location.id).catch(() => null),
        articleAPI.getAll({ status: 'published', limit: 6, orderBy: 'publishedAt', order: 'desc' }).catch(() => null),
      ]);

      const feed = Array.isArray(articlesResponse?.data?.articles) ? articlesResponse.data.articles : [];

      return {
        location,
        funding: fundingResponse?.success ? fundingResponse.data : null,
        news: feed.filter((item) => item.type === 'news').slice(0, 3),
        articles: feed.filter((item) => item.type !== 'news').slice(0, 3),
      };
    },
    [code],
    {
      initialData: {
        location: null,
        funding: null,
        news: [],
        articles: [],
      },
    }
  );

  const handleContinue = (targetCode = code) => {
    // Save explicit choice for 1 year so the proxy never overrides it again
    saveUserCountry(targetCode);
    document.cookie = 'appofa_country_visited=1; path=/; max-age=86400; SameSite=Lax';
    if (targetCode !== code) {
      router.push(`/country/${targetCode}`);
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="app-container text-center text-gray-600">{tCommon('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="app-container bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-red-600 mb-3">{tCommon('error')}</p>
          <Link href="/" className="text-blue-700 hover:underline">{tCommon('back')}</Link>
        </div>
      </div>
    );
  }

  if (!data.location) {
    let fallbackName = code;
    try {
      fallbackName = new Intl.DisplayNames(['el', 'en', 'ro'], { type: 'region' }).of(code) || code;
    } catch {
      // keep raw code if Intl.DisplayNames is unavailable
    }
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="app-container space-y-6">
          <CountryFundingBanner
            funding={null}
            locationName={fallbackName}
            countryCode={code}
            hasContent={false}
            geoPanelState={geoPanelState}
          />
        </div>
      </div>
    );
  }

  const countryName = data.location.name_local || data.location.name || code;

  // Mismatch: browser locale suggests a different country than the one in the URL.
  // Validate using the shared isValidCountryCode helper for consistent rules.
  const rawBrowserCountry = geoPanelState.browserLocaleCountryCode;
  const browserCountry = isValidCountryCode(rawBrowserCountry) ? rawBrowserCountry : null;
  const showMismatch = browserCountry && browserCountry !== code;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="app-container space-y-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {countryCodeToFlag(code)} {tCountry('welcome', { country: countryName })}
          </h1>
          <p className="text-gray-700">
            {tCountry('subtitle')}
          </p>
        </section>

        {showMismatch && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-900 mb-3">
              {tCountry('mismatch_notice', { browserCountry })}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleContinue(browserCountry)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors"
              >
                <span aria-hidden="true">{countryCodeToFlag(browserCountry)}</span>{' '}
                {tCountry('mismatch_switch', { browserCountry })}
              </button>
              <button
                type="button"
                onClick={() => handleContinue(code)}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-amber-800 font-medium text-sm border border-amber-300 hover:bg-amber-50 transition-colors"
              >
                {tCountry('mismatch_stay', { country: countryName })}
              </button>
            </div>
          </div>
        )}

        <CountryFundingBanner
          funding={data.funding}
          locationName={countryName}
          countryCode={code}
          hasContent={data.news.length > 0 || data.articles.length > 0}
          geoPanelState={geoPanelState}
        />

        <section className="bg-white border border-gray-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{tCountry('latest_news')}</h2>
            {data.news.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {data.news.map(renderArticleLink)}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">{tCommon('not_found')}</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{tCountry('latest_articles')}</h2>
            {data.articles.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {data.articles.map(renderArticleLink)}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">{tCommon('not_found')}</p>
            )}
          </div>
        </section>

        {!showMismatch && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => handleContinue(code)}
              className="inline-flex items-center px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              {tCountry('continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
