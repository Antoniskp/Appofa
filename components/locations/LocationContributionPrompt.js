'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LocationContributionPrompt({ location }) {
  const t = useTranslations('locationImprovements');
  const href = `/locations/${location.slug || location.id}/improve`;
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4" aria-label={t('together')}>
      <h3 className="font-semibold text-gray-900">{t('together')}</h3>
      <p className="mt-2 text-sm text-gray-600">{t(location.description ? 'invitation' : 'emptyDescription')}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-blue-700">
        <Link className="py-2 hover:underline" href={`${href}?field=description`}>{t(location.description ? 'correct' : 'firstDescription')}</Link>
        <Link className="py-2 hover:underline" href={`${href}?kind=source${location.description ? '' : '&field=wikipedia_url'}`}>{t('sourceAction')}</Link>
        {location.population_override == null && location.population == null && <Link className="py-2 hover:underline" href={`${href}?field=population_override`}>{t('addPopulation')}</Link>}
        <Link className="py-2 hover:underline" href={`${href}?view=history`}>{t('history')}</Link>
      </div>
    </section>
  );
}
