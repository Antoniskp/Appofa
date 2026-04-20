'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { articleAPI, geoAPI, locationAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import CountryFundingBanner from '@/components/locations/CountryFundingBanner';
import { useTranslations } from 'next-intl';

const countryCodeToFlag = (code) => (
  code
    ? [...code.toUpperCase()].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('')
    : '🌍'
);

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

  const handleContinue = () => {
    document.cookie = 'appofa_country_visited=1; path=/; max-age=86400; SameSite=Lax';
    router.push('/');
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
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="app-container bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-gray-700 mb-3">{tCountry('not_found')}</p>
          <Link href="/" className="text-blue-700 hover:underline">{tCommon('back')}</Link>
        </div>
      </div>
    );
  }

  const countryName = data.location.name_local || data.location.name || code;

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

        {data.funding && (
          <CountryFundingBanner
            funding={data.funding}
            locationName={countryName}
            hasContent={false}
          />
        )}

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

        <div className="text-center">
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {tCountry('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
