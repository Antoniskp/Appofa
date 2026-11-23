'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import ExploreLocationsMap from '@/components/locations/ExploreLocationsMap';
import { mapLayerHref, resolveMapLayer } from '@/lib/map-layers';

export default function MapPageClient({ layer, districtId }) {
  const t = useTranslations('homeMap');
  const tCameras = useTranslations('cameras');
  const tLive = useTranslations('liveMap');
  const searchParams = useSearchParams();
  const activeLayer = searchParams ? resolveMapLayer(searchParams.get('layer')) : layer;
  const { user } = useAuth();
  return <div className="app-container py-6 sm:py-10">
    <header className="mb-6 max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-copper">{t('pageEyebrow')}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">{t('pageTitle')}</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">{t('pageDescription')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/cameras" className="inline-flex min-h-11 items-center rounded-lg border border-brand-border px-3 text-sm font-semibold text-copper hover:bg-ivory">
          {tCameras('title')}
        </Link>
        <Link href="/live" className="inline-flex min-h-11 items-center rounded-lg border border-brand-border px-3 text-sm font-semibold text-copper hover:bg-ivory">
          {tLive('title')}
        </Link>
      </div>
    </header>
    <section aria-label={t('pageTitle')}>
      <ExploreLocationsMap activeLayer={activeLayer} initialDistrictId={districtId} homeLocationId={user?.homeLocationId}
        onLayerChange={(value, selectedDistrictId) => window.history.replaceState(null, '', mapLayerHref(value, selectedDistrictId))} />
    </section>
  </div>;
}
