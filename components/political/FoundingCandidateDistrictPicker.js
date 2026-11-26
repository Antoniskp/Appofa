'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { foundingCandidateDistricts, foundingCandidateRegistrationPath } from '@/lib/founding-candidate-districts';
import { mapGeometryBounds, normalizeMapBoundary } from '@/lib/map-utils';
import FoundingDistrictSelect from './FoundingDistrictSelect';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });
const greeceCenter = [38.5, 23.8];
const districtsById = new Map(foundingCandidateDistricts.map(district => [district.id, district]));

export default function FoundingCandidateDistrictPicker() {
  const t = useTranslations('foundingInitiative.candidates');
  const [districtSlug, setDistrictSlug] = useState('');
  const [boundaries, setBoundaries] = useState(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const district = foundingCandidateDistricts.find(option => option.slug === districtSlug);
  const overviewBounds = useMemo(() => mapGeometryBounds(boundaries), [boundaries]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/electoral-districts', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Map unavailable');
        const geometry = normalizeMapBoundary(await response.json());
        if (!geometry) throw new Error('Map unavailable');
        setBoundaries(geometry);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMapUnavailable(true);
      });
    return () => controller.abort();
  }, []);

  const polygonLayers = useMemo(() => boundaries ? [{
    id: 'electoral-districts',
    geojson: boundaries,
    style: { color: '#b5a598', weight: 1.25, fillColor: '#e9cbb9', fillOpacity: 0.4 },
    hoverStyle: { color: '#80462f', weight: 2.5, fillOpacity: 0.65 },
    styleFeature: (feature, style) => feature.properties?.id === district?.id
      ? { ...style, color: '#80462f', weight: 3, fillColor: '#bc8868', fillOpacity: 0.65 }
      : style,
    getTooltip: properties => districtsById.get(properties.id)?.name,
    fitBoundsOnClick: false,
    onFeatureClick: feature => {
      const selection = districtsById.get(feature.properties?.id);
      if (selection) setDistrictSlug(selection.slug);
    },
  }] : [], [boundaries, district]);
  const focusTarget = useMemo(() => {
    const feature = boundaries?.features.find(item => item.properties?.id === district?.id);
    const bounds = mapGeometryBounds(feature);
    return bounds ? { bounds, zoom: 10 } : null;
  }, [boundaries, district]);

  return (
    <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
      <div className="flex h-72 overflow-hidden rounded-xl border border-brand-border bg-sand sm:h-96">
        {boundaries ? (
          <BaseMap
            center={greeceCenter}
            bounds={overviewBounds}
            boundsPadding={14}
            zoomSnap={0.25}
            focusTarget={focusTarget}
            viewResetKey={districtSlug ? 1 : 0}
            polygonLayers={polygonLayers}
            showResetControl={Boolean(district)}
            controlLabels={{ reset: t('mapReset') }}
            ariaLabel={t('mapLabel')}
            className="isolate h-full w-full"
          />
        ) : (
          <p role="status" className="m-auto px-5 text-center text-sm text-slate-600">
            {t(mapUnavailable ? 'mapUnavailable' : 'mapLoading')}
          </p>
        )}
      </div>
      <div className="flex flex-col justify-center rounded-xl border border-brand-border bg-ivory p-5 sm:p-6">
        <FoundingDistrictSelect id="founding-map-district" value={districtSlug} onChange={setDistrictSlug} />
        <p className="mt-3 text-sm leading-6 text-slate-600">{t('mapHelp')}</p>
        <Link href={foundingCandidateRegistrationPath(districtSlug)}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-[var(--brand)] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
          {t('applyAction')} <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
