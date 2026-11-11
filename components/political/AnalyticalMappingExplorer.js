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

const SELECTED_REGION_STYLE = {
  ...REGION_STYLE,
  color: '#b45309',
  weight: 2.5,
  fillColor: '#fbbf24',
  fillOpacity: 0.36,
};

const regionById = new Map(regionsMetaData.regions.map((region) => [region.id, region]));
const districtById = new Map(districtsMetaData.electoralDistricts.map((district) => [district.id, district]));
const sortedRegionsForSelect = [...regionsMetaData.regions].sort((a, b) => a.name.localeCompare(b.name, 'el'));

function getLocationHref(unit) {
  if (!unit?.locationSearch) return null;
  const query = new URLSearchParams({ search: unit.locationSearch });
  if (unit.locationType) {
    query.set('type', unit.locationType);
  }
  return `/locations?${query.toString()}`;
}

function getGeoJsonBounds(feature) {
  const bounds = { north: -90, south: 90, east: -180, west: 180 };
  let foundCoordinate = false;

  function visit(value) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      const [longitude, latitude] = value;
      bounds.north = Math.max(bounds.north, latitude);
      bounds.south = Math.min(bounds.south, latitude);
      bounds.east = Math.max(bounds.east, longitude);
      bounds.west = Math.min(bounds.west, longitude);
      foundCoordinate = true;
      return;
    }
    value.forEach(visit);
  }

  visit(feature?.geometry?.coordinates);
  return foundCoordinate ? bounds : null;
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
  const [selectedRegionId, setSelectedRegionId] = useState(null);

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

  const selectedRegionBounds = useMemo(() => {
    if (!selectedRegionId) return null;
    const feature = (regionsGeoJson?.features || []).find(
      (item) => item?.properties?.id === selectedRegionId
    );
    return getGeoJsonBounds(feature);
  }, [selectedRegionId, regionsGeoJson]);

  const polygonLayers = useMemo(() => [
    {
      id: 'political-regions',
      geojson: regionsGeoJson,
      style: REGION_STYLE,
      styleFeature: (feature, defaultStyle) => (
        feature?.properties?.id === selectedRegionId ? SELECTED_REGION_STYLE : defaultStyle
      ),
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
  ], [selectedDistrictGeo, regionsGeoJson, selectedRegionId]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div className="relative h-[460px] w-full overflow-hidden rounded-xl border border-gray-200">
        <div className="absolute left-3 right-3 top-3 z-[1000] flex gap-2 rounded-lg bg-white/95 p-2 shadow-sm sm:right-auto sm:min-w-[320px]">
          <label htmlFor="map-region-select" className="sr-only">Επιλογή Περιφέρειας</label>
          <select
            id="map-region-select"
            value={selectedRegionId || ''}
            onChange={(event) => setSelectedRegionId(event.target.value || null)}
            className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Όλη η Ελλάδα — επίλεξε Περιφέρεια</option>
            {sortedRegionsForSelect.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
          {selectedRegionId && (
            <button
              type="button"
              onClick={() => setSelectedRegionId(null)}
              className="shrink-0 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Όλη η Ελλάδα
            </button>
          )}
        </div>
        <BaseMap
          center={GREECE_CENTER}
          zoom={GREECE_ZOOM}
          bounds={selectedRegionBounds}
          polygonLayers={polygonLayers}
          className="h-full w-full"
          scrollWheelZoom={true}
          interactive={true}
        />
        <div className="absolute left-2 bottom-2 z-[1000] rounded bg-white/90 px-2 py-1 text-[11px] text-gray-500">
          Όρια: © EuroGeographics για τα διοικητικά όρια (Click That Hood / Eurostat). Διαχωρισμός Αττικής και Θεσσαλονίκης: <a href="https://www.geoboundaries.org/api/current/gbOpen/GRC/ADM3/" target="_blank" rel="noreferrer" className="underline">geoBoundaries ADM3</a> με βάση το <a href="https://www.ypes.gr/statistika/ethnikes-ekloges/vouleutikes-ekloges/endiaferoyn-toys-syndyasmoys" target="_blank" rel="noreferrer" className="underline">Υπουργείο Εσωτερικών</a>.
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
