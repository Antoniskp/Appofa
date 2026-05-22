'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import regionsMetaData from '@/config/map-data/regions.metadata.json';
import districtsMetaData from '@/config/map-data/electoral-districts.metadata.json';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

const GREECE_CENTER = [38.5, 23.8];
const GREECE_ZOOM = 6;

const REGION_STYLE = {
  color: '#1d4ed8',
  weight: 1.4,
  opacity: 0.8,
  fillColor: '#60a5fa',
  fillOpacity: 0.18,
};

const REGION_HOVER_STYLE = {
  color: '#1e3a8a',
  weight: 2.2,
  opacity: 1,
  fillColor: '#3b82f6',
  fillOpacity: 0.3,
};

const DISTRICT_STYLE = {
  color: '#047857',
  weight: 1,
  opacity: 0.65,
  fillColor: '#34d399',
  fillOpacity: 0.14,
};

const DISTRICT_HOVER_STYLE = {
  color: '#065f46',
  weight: 1.6,
  opacity: 0.9,
  fillColor: '#10b981',
  fillOpacity: 0.24,
};

const regionById = new Map(regionsMetaData.regions.map((region) => [region.id, region]));
const districtById = new Map(districtsMetaData.electoralDistricts.map((district) => [district.id, district]));

function getLocationHref(unit) {
  if (!unit?.locationSearch) return null;
  const query = new URLSearchParams({ search: unit.locationSearch });
  if (unit.locationType) {
    query.set('type', unit.locationType);
  }
  return `/locations?${query.toString()}`;
}

function UnitLink({ unit, fallbackText, className }) {
  const href = getLocationHref(unit);
  if (!href) {
    return <span className={className}>{fallbackText}</span>;
  }
  return (
    <Link href={href} className={className}>
      {fallbackText}
    </Link>
  );
}

export default function AnalyticalMappingExplorer({
  regionsGeoJson = { type: 'FeatureCollection', features: [] },
  districtsGeoJson = { type: 'FeatureCollection', features: [] },
}) {
  const [selectedRegionId, setSelectedRegionId] = useState(regionsMetaData.regions[0]?.id ?? null);

  const selectedRegion = useMemo(
    () => (selectedRegionId ? regionById.get(selectedRegionId) : null),
    [selectedRegionId]
  );

  const selectedDistricts = useMemo(() => {
    if (!selectedRegion) return [];
    return selectedRegion.districtIds
      .map((districtId) => districtById.get(districtId))
      .filter(Boolean);
  }, [selectedRegion]);

  const selectedDistrictGeo = useMemo(() => ({
    type: 'FeatureCollection',
    properties: {
      joinKey: 'id',
      regionJoinKey: 'regionId',
    },
    features: (districtsGeoJson?.features || []).filter(
      (feature) => feature?.properties?.regionId === selectedRegionId
    ),
  }), [selectedRegionId, districtsGeoJson]);

  const polygonLayers = useMemo(() => [
    {
      id: 'political-regions',
      geojson: regionsGeoJson,
      style: REGION_STYLE,
      hoverStyle: REGION_HOVER_STYLE,
      fitBoundsOnClick: true,
      onFeatureClick: (feature) => setSelectedRegionId(feature?.properties?.id || null),
      getTooltip: (props) => `<strong>${props.name || ''}</strong>`,
      getPopup: (props) => `<strong>${props.name || ''}</strong><br/>Πρωτεύουσα: ${props.capital || '-'}`,
    },
    {
      id: 'electoral-districts',
      geojson: selectedDistrictGeo,
      style: DISTRICT_STYLE,
      hoverStyle: DISTRICT_HOVER_STYLE,
      fitBoundsOnClick: false,
      getTooltip: (props) => `${props.name || ''} · ${props.seats || 0} έδρες`,
    },
  ], [selectedDistrictGeo, regionsGeoJson]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div className="relative h-[460px] w-full overflow-hidden rounded-xl border border-gray-200">
        <BaseMap
          center={GREECE_CENTER}
          zoom={GREECE_ZOOM}
          polygonLayers={polygonLayers}
          className="h-full w-full"
          scrollWheelZoom={false}
          interactive={true}
        />
        <div className="pointer-events-none absolute left-2 bottom-2 z-[1000] rounded bg-white/90 px-2 py-1 text-[11px] text-gray-500">
          Γεωμετρία επίδειξης (GeoJSON) — έτοιμη για μελλοντική αντικατάσταση με ακριβέστερα όρια.
        </div>
      </div>

      <aside className="rounded-xl border border-gray-200 bg-white p-4">
        {selectedRegion ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900">
              <UnitLink
                unit={selectedRegion}
                fallbackText={selectedRegion.name}
                className="text-blue-700 hover:text-blue-800 hover:underline"
              />
            </h3>
            <p className="mt-1 text-sm text-gray-600">Πρωτεύουσα: {selectedRegion.capital}</p>
            <p className="mt-1 text-sm font-medium text-gray-800">Σύνολο εδρών: {selectedRegion.totalSeats}</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm" aria-label={`Εκλογικές περιφέρειες ${selectedRegion.name}`}>
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="py-2 pr-3 font-medium">Εκλογική Περιφέρεια</th>
                    <th className="py-2 text-right font-medium">Έδρες</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedDistricts.map((district) => (
                    <tr key={district.id}>
                      <td className="py-2 pr-3 text-gray-700">
                        <UnitLink
                          unit={district}
                          fallbackText={district.name}
                          className="text-blue-700 hover:text-blue-800 hover:underline"
                        />
                      </td>
                      <td className="py-2 text-right font-semibold text-gray-900">{district.seats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600">Επίλεξε μια περιφέρεια από τον χάρτη.</p>
        )}
      </aside>
    </div>
  );
}
