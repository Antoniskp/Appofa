'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import ExploreLocationsMap from '@/components/locations/ExploreLocationsMap';
import { mapLayerHref } from '@/lib/map-layers';

export default function MapPageClient({ layer, districtId }) {
  const t = useTranslations('homeMap');
  const router = useRouter();
  const { user } = useAuth();
  return <div className="app-container py-6 sm:py-10">
    <header className="mb-6 max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-copper">{t('pageEyebrow')}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">{t('pageTitle')}</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">{t('pageDescription')}</p>
    </header>
    <section aria-label={t('pageTitle')}>
      <ExploreLocationsMap activeLayer={layer} initialDistrictId={districtId} homeLocationId={user?.homeLocationId}
        onLayerChange={value => router.replace(mapLayerHref(value), { scroll: false })} />
    </section>
  </div>;
}
