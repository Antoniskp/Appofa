'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const ISO2_RE = /^[A-Z]{2}$/;
const INVALID_FLAG_CODES = new Set(['XX', 'T1']);

const countryCodeToFlag = (code) => {
  if (!code) return '🌍';
  const upper = String(code).toUpperCase();
  if (!ISO2_RE.test(upper) || INVALID_FLAG_CODES.has(upper)) return '🌍';
  return [...upper].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
};

export default function CountryFundingBanner({
  funding,
  locationName,
  countryCode,
  hasContent,
}) {
  const tCountry = useTranslations('country_page');

  if (hasContent) return null;

  const showDonationCampaign = funding && (funding.status === 'locked' || funding.status === 'funding');
  const flag = countryCodeToFlag(countryCode);
  const goal = Number(funding?.goalAmount) || 500;
  const current = Number(funding?.currentAmount) || 0;
  const pct = Math.min(100, goal > 0 ? (current / goal) * 100 : 0);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white text-blue-900 border border-blue-200 text-sm font-semibold">
          {flag} {locationName}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
          📡 {tCountry('detection_source')}
        </span>
      </div>

      <h3 className="text-lg font-bold text-blue-900 mb-2">
        {tCountry('no_content_title', { country: locationName })}
      </h3>
      <p className="text-blue-700 mb-4 text-sm">
        {tCountry('no_content_body', { country: locationName })}
      </p>

      {showDonationCampaign && (
        <div className="mb-4">
          <div className="flex flex-wrap justify-between gap-2 text-sm text-blue-700 mb-1">
            <span>{tCountry('raised_label')}: €{current.toFixed(2)}</span>
            <span>{tCountry('goal_label')}: €{goal.toFixed(2)}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {funding.donorCount || 0} {tCountry('donors_label')}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {showDonationCampaign && funding.donationUrl && (
          <a
            href={funding.donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            🎁 {tCountry('donate_cta')}
          </a>
        )}
        <Link
          href="/contribute"
          className="inline-flex items-center px-4 py-2 bg-white hover:bg-blue-100 text-blue-800 font-medium rounded-lg border border-blue-300 transition-colors text-sm"
        >
          {tCountry('support_cta')}
        </Link>
      </div>

      <div className="mt-5 p-4 rounded-lg border border-indigo-200 bg-white/80">
        <p className="text-sm font-semibold text-indigo-900 mb-1">{tCountry('diaspora_title')}</p>
        <p className="text-sm text-indigo-700 mb-3">{tCountry('diaspora_body')}</p>
        <Link
          href="/country/GR"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {tCountry('diaspora_cta')}
        </Link>
      </div>
    </div>
  );
}
