'use client';

/**
 * GreeceBoundaryMap — homepage discovery map with interactive polygon boundaries.
 *
 * Renders interactive polygon boundaries for Greek peripheries on a Leaflet map.
 *
 * Boundary source priority:
 *   1. When `prefectures` prop is supplied and at least one location has `boundary_geojson`,
 *      the map is built entirely from the per-location boundaries.  Each feature inherits the
 *      location's name, code, and slug so popups can navigate directly to the location page.
 *   2. When no location boundaries are available, the component falls back to the static
 *      `/public/data/greece-regions.geojson` file (same behaviour as before this change).
 *
 * Behaviour:
 *   - Shows polygon boundaries for all Greek peripheries at the default Greece-wide view (zoom 6).
 *   - Hovering a polygon highlights it and shows a tooltip with the region name.
 *   - Clicking a polygon zooms the map to fit that region's bounds and updates the React info card.
 *   - Shows a small info card overlay when a region is selected (React layer, outside Leaflet).
 *
 * Props:
 *   prefectures  {Array<Location>}  – prefecture location objects (may include boundary_geojson)
 *   className    {string}           – override the map container height/styling
 *   loading      {boolean}          – when true shows a skeleton placeholder
 *
 * Architecture for future extensions:
 *   - To add choropleth coloring: replace the static `style` with a `styleFeature(feature)`
 *     function that maps feature.properties.code → fill color.
 *   - To add electoral districts: create a second entry in `polygonLayers`.
 *   - To add municipality drill-down: swap layers based on zoom level.
 */

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

// Module-level cache for the fallback static GeoJSON — avoids redundant fetches.
let GEO_CACHE = null;
let GEO_CACHE_PROMISE = null;

function loadFallbackGeoData() {
  if (GEO_CACHE) return Promise.resolve(GEO_CACHE);
  if (GEO_CACHE_PROMISE) return GEO_CACHE_PROMISE;
  GEO_CACHE_PROMISE = fetch('/data/greece-regions.geojson')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      GEO_CACHE = data;
      GEO_CACHE_PROMISE = null;
      return data;
    })
    .catch((err) => {
      GEO_CACHE_PROMISE = null;
      throw err;
    });
  return GEO_CACHE_PROMISE;
}

/**
 * Normalises a `boundary_geojson` value (string or object) into a form that
 * Leaflet's L.geoJSON() can consume (FeatureCollection or Feature).
 * Returns null when the input is absent, unparseable, or has an unsupported type.
 */
function normalizeBoundaryGeoJSON(raw, displayName) {
  try {
    const geom = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!geom || !geom.type) return null;
    const { type } = geom;
    if (type === 'FeatureCollection' || type === 'Feature') return geom;
    if (type === 'Polygon' || type === 'MultiPolygon') {
      return { type: 'Feature', geometry: geom, properties: { name: displayName } };
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeLookupValue(value) {
  if (value == null) return null;
  const str = String(value).trim();
  if (!str) return null;
  return str.toLowerCase();
}

function getLocationLookupKeys(locationLike = {}) {
  const keys = [];
  const slug = normalizeLookupValue(locationLike.slug);
  const code = normalizeLookupValue(locationLike.code);
  const nameLocal = normalizeLookupValue(locationLike.name_local);
  const name = normalizeLookupValue(locationLike.name);
  const nameEn = normalizeLookupValue(locationLike.name_en);

  if (code) keys.push(`code:${code}`);
  if (slug) keys.push(`slug:${slug}`);
  if (nameLocal) keys.push(`name:${nameLocal}`);
  if (name) keys.push(`name:${name}`);
  if (nameEn) keys.push(`name:${nameEn}`);
  return Array.from(new Set(keys));
}

function buildLocationLookupByFeatureProps(locations = []) {
  const lookup = new Map();
  locations.forEach((loc) => {
    getLocationLookupKeys(loc).forEach((key) => lookup.set(key, loc));
  });
  return lookup;
}

function resolveLocationFromFeatureProps(props, lookup) {
  if (!props || !lookup) return null;
  const keys = getLocationLookupKeys(props);
  for (const key of keys) {
    if (lookup.has(key)) return lookup.get(key);
  }
  return null;
}

function getLocationFeatureKey(locationLike = {}) {
  const keys = getLocationLookupKeys(locationLike);
  return keys[0] || null;
}

/**
 * Converts a Location object into one or more GeoJSON features with location metadata
 * merged into the feature properties so tooltips, popups, and the info card have access.
 */
function locationToFeatures(loc) {
  if (!loc.boundary_geojson) return [];

  const displayName = loc.name_local || loc.name;
  const normalized = normalizeBoundaryGeoJSON(loc.boundary_geojson, displayName);
  if (!normalized) return [];

  const locProps = {
    name: displayName,
    name_en: loc.name,
    slug: loc.slug || null,
    code: loc.code || null,
    boundary_color: loc.boundary_color || null,
    userCount: typeof loc.userCount === 'number' ? loc.userCount : null,
    moderatorPreview: loc.moderatorPreview || null,
  };

  if (normalized.type === 'FeatureCollection') {
    return normalized.features.map((f) => ({
      ...f,
      properties: { ...f.properties, ...locProps },
    }));
  }
  // Single Feature
  return [{ ...normalized, properties: { ...normalized.properties, ...locProps } }];
}

/**
 * Builds a FeatureCollection from an array of location objects that have boundary_geojson.
 * Returns null when no locations produce valid features.
 */
function buildFeatureCollectionFromLocations(locations) {
  const features = locations.flatMap((loc) =>
    loc.boundary_geojson ? locationToFeatures(loc) : []
  );
  if (features.length === 0) return null;
  return { type: 'FeatureCollection', features };
}

// Tooltip HTML builder — shown on hover (region name)
function buildTooltip(props) {
  const name = props.name || '';
  const lines = [`<div style="font-weight:600;font-size:13px;line-height:1.3">${name}</div>`];
  if (typeof props.userCount === 'number' && props.userCount > 0) {
    lines.push(
      `<div style="font-size:11px;color:#6b7280;margin-top:2px">👥 ${props.userCount} χρήστ${props.userCount === 1 ? 'ης' : 'ες'}</div>`
    );
  }
  const mod = props.moderatorPreview;
  if (mod) {
    const modName = [mod.firstNameNative, mod.lastNameNative].filter(Boolean).join(' ') || mod.username || '';
    if (modName) {
      lines.push(`<div style="font-size:11px;color:#6b7280;margin-top:2px">🏛 ${modName}</div>`);
    }
  }
  return lines.join('');
}

const GREECE_CENTER = [38.5, 23.8];
const GREECE_ZOOM = 6;

// Polygon styles — kept here so they can be overridden with choropleth colors later
const POLY_DEFAULT_STYLE = {
  color: '#2563eb',
  weight: 1.5,
  opacity: 0.65,
  fillColor: '#3b82f6',
  fillOpacity: 0.10,
};

const POLY_HOVER_STYLE = {
  color: '#1e40af',
  weight: 2.5,
  opacity: 0.9,
  fillColor: '#3b82f6',
  fillOpacity: 0.28,
};

const POLY_SELECTED_STYLE = {
  color: '#1d4ed8',
  weight: 2.5,
  opacity: 1,
  fillColor: '#1d4ed8',
  fillOpacity: 0.35,
};

function styleFeature(feature, baseStyle) {
  const color = feature?.properties?.boundary_color;
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) return baseStyle;
  return {
    ...baseStyle,
    color,
    fillColor: color,
  };
}

function getActivityStyle(feature, baseStyle, maxUserCount) {
  const count = Number(feature?.properties?.userCount || 0);
  if (!Number.isFinite(count) || count <= 0 || maxUserCount <= 0) {
    return {
      ...baseStyle,
      color: '#94a3b8',
      fillColor: '#cbd5e1',
      fillOpacity: 0.10,
    };
  }
  const ratio = Math.min(1, count / maxUserCount);
  const fillOpacity = 0.16 + (ratio * 0.34);
  const color = ratio > 0.66 ? '#166534' : ratio > 0.33 ? '#0f766e' : '#2563eb';
  return {
    ...baseStyle,
    color,
    fillColor: color,
    fillOpacity,
  };
}

function Skeleton() {
  return (
    <div className="h-[420px] w-full rounded-xl overflow-hidden bg-gray-100 animate-pulse" />
  );
}

/**
 * Small info card shown in the top-right corner when a region polygon is selected.
 * It sits in the React layer (outside Leaflet) so it can use Tailwind and Next.js <Link>.
 */
function RegionInfoCard({ region, onClose }) {
  const t = useTranslations('common');
  if (!region) return null;
  const href = region.slug
    ? `/locations/${region.slug}`
    : `/locations?type=periphery&region=${region.code}`;
  const moderatorName = region.moderatorPreview
    ? [region.moderatorPreview.firstNameNative, region.moderatorPreview.lastNameNative].filter(Boolean).join(' ') || region.moderatorPreview.username
    : '';
  return (
    <div className="absolute top-14 right-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-3 min-w-[180px] max-w-[220px] pointer-events-auto">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{region.name}</p>
        <button
          onClick={onClose}
          aria-label="Close info"
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      {region.capital && (
        <p className="text-xs text-gray-500 mb-2">{t('capital_label')}: {region.capital}</p>
      )}
      <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-blue-50 px-2 py-1 text-blue-800">
          <span className="block font-semibold">{region.userCount ?? 0}</span>
          <span>{t('users_label')}</span>
        </div>
        <div className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">
          <span className="block font-semibold">{moderatorName ? t('yes') : t('no')}</span>
          <span>{t('moderator_label')}</span>
        </div>
      </div>
      {moderatorName && (
        <p className="mb-2 truncate text-xs text-gray-500">{t('moderator_label')}: {moderatorName}</p>
      )}
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
      >
        {t('explore_locations')}
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </Link>
    </div>
  );
}

export default memo(function GreeceBoundaryMap({
  prefectures = [],
  className,
  loading = false,
  selectedLocationId = null,
  hoveredLocationId = null,
  onLocationSelect,
  onLocationHover,
  onLayerInit,
  onMarkerHover,
  onMarkersReady,
  showSelectionCard = true,
}) {
  const [fallbackGeoData, setFallbackGeoData] = useState(null);
  const [fallbackGeoError, setFallbackGeoError] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [layerMode, setLayerMode] = useState('activity');

  // Build a feature collection from location boundary_geojson values when available.
  const locationFeatureCollection = useMemo(
    () => buildFeatureCollectionFromLocations(prefectures),
    [prefectures]
  );
  const locationLookup = useMemo(
    () => buildLocationLookupByFeatureProps(prefectures),
    [prefectures]
  );

  const useFallback = !locationFeatureCollection;
  const maxUserCount = useMemo(() => {
    return Math.max(
      0,
      ...prefectures
        .map((item) => Number(item.userCount || 0))
        .filter((value) => Number.isFinite(value))
    );
  }, [prefectures]);

  // Only load the static fallback file when no location boundaries are available.
  useEffect(() => {
    if (!useFallback) return;
    let cancelled = false;
    loadFallbackGeoData()
      .then((data) => { if (!cancelled) setFallbackGeoData(data); })
      .catch(() => { if (!cancelled) setFallbackGeoError(true); });
    return () => { cancelled = true; };
  }, [useFallback]);

  // Handler: a region polygon was clicked — update React info card
  const handleFeatureClick = useCallback((feature) => {
    const p = feature.properties || {};
    const linkedLocation = resolveLocationFromFeatureProps(p, locationLookup);
    if (linkedLocation?.id != null && onLocationSelect) {
      onLocationSelect(linkedLocation.id);
    }
    setSelectedRegion({
      name: p.name || p.name_en || '',
      capital: p.capital || '',
      code: p.code || '',
      slug: p.slug || null,
      userCount: linkedLocation?.userCount || p.userCount || 0,
      moderatorPreview: linkedLocation?.moderatorPreview || p.moderatorPreview || null,
    });
  }, [locationLookup, onLocationSelect]);

  const handleFeatureHover = useCallback((featureOrNull) => {
    if (!onLocationHover) return;
    if (!featureOrNull) {
      onLocationHover(null);
      return;
    }
    const linkedLocation = resolveLocationFromFeatureProps(featureOrNull.properties || {}, locationLookup);
    onLocationHover(linkedLocation?.id ?? null);
  }, [locationLookup, onLocationHover]);

  const markers = useMemo(
    () => prefectures
      .filter((p) => p.lat && p.lng)
      .map((p) => ({
        id: String(p.id),
        lat: Number(p.lat),
        lng: Number(p.lng),
        label: p.name_local || p.name,
        meta: `${Number(p.userCount || 0)} users${p.moderatorPreview ? ' - moderator assigned' : ''}`,
        href: p.slug ? `/locations/${p.slug}` : null,
        tooltip: buildTooltip({
          name: p.name_local || p.name,
          userCount: typeof p.userCount === 'number' ? p.userCount : null,
          moderatorPreview: p.moderatorPreview || null,
        }),
        popup: buildTooltip({
          name: p.name_local || p.name,
          userCount: typeof p.userCount === 'number' ? p.userCount : null,
          moderatorPreview: p.moderatorPreview || null,
        }),
        variant: Number(selectedLocationId) === Number(p.id) ? 'selected' : 'explorer',
      })),
    [prefectures, selectedLocationId]
  );

  // Build the polygonLayers config (memoized so it doesn't trigger map re-init)
  const polygonLayers = useMemo(() => {
    const geoData = useFallback ? fallbackGeoData : locationFeatureCollection;
    if (!geoData) return [];
    return [
      {
        id: 'greece-peripheries',
        geojson: geoData,
        style: POLY_DEFAULT_STYLE,
        styleFeature: (feature, baseStyle) => {
          const linkedLocation = resolveLocationFromFeatureProps(feature.properties || {}, locationLookup);
          if (linkedLocation && Number(linkedLocation.id) === Number(selectedLocationId)) {
            return styleFeature(feature, POLY_SELECTED_STYLE);
          }
          if (linkedLocation && Number(linkedLocation.id) === Number(hoveredLocationId)) {
            return styleFeature(feature, POLY_HOVER_STYLE);
          }
          if (layerMode === 'activity') {
            return getActivityStyle(feature, baseStyle, maxUserCount);
          }
          return styleFeature(feature, baseStyle);
        },
        hoverStyle: POLY_HOVER_STYLE,
        fitBoundsOnClick: true,
        onFeatureClick: handleFeatureClick,
        onFeatureHover: handleFeatureHover,
        getTooltip: buildTooltip,
        getFeatureId: (feature) => getLocationFeatureKey(feature.properties || {}),
        onLayerInit,
      },
    ];
  }, [
    useFallback,
    fallbackGeoData,
    locationFeatureCollection,
    handleFeatureClick,
    handleFeatureHover,
    locationLookup,
    selectedLocationId,
    hoveredLocationId,
    layerMode,
    maxUserCount,
    onLayerInit,
  ]);

  if (loading) return <Skeleton />;

  // Fallback: if static GeoJSON failed and no location boundaries, nothing to show
  if (useFallback && fallbackGeoError) return null;

  // While waiting for the fallback to load, show skeleton
  if (useFallback && !fallbackGeoData) return <Skeleton />;

  return (
    <div className={`relative ${className || 'h-[420px] w-full rounded-xl overflow-hidden'}`}>
      <div className="absolute left-3 top-3 z-[1000] flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white/95 p-1 shadow-sm">
        {[
          { id: 'activity', label: 'Activity' },
          { id: 'light', label: 'Simple' },
          { id: 'political', label: 'Political' },
          { id: 'satellite', label: 'Satellite' },
        ].map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setLayerMode(mode.id)}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition ${layerMode === mode.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <BaseMap
        center={GREECE_CENTER}
        zoom={GREECE_ZOOM}
        markers={markers}
        polygonLayers={polygonLayers}
        className="h-full w-full"
        scrollWheelZoom={false}
        interactive={true}
        tileMode={layerMode === 'satellite' ? 'satellite' : layerMode === 'political' ? 'political' : 'light'}
        showFullscreenControl
        onMarkerHover={onMarkerHover}
        onMarkersReady={onMarkersReady}
      />
      {/* React info card overlay — positioned inside the relative container, above Leaflet */}
      {showSelectionCard && (
        <RegionInfoCard
          region={selectedRegion}
          onClose={() => setSelectedRegion(null)}
        />
      )}
      {/* Source label */}
      <div className="absolute bottom-1 left-1 z-[1000] bg-white/80 rounded px-1.5 py-0.5 text-[10px] text-gray-400 pointer-events-none select-none">
        Περιφέρειες Ελλάδας
      </div>
    </div>
  );
});

// Named exports for unit tests
export {
  normalizeBoundaryGeoJSON,
  buildFeatureCollectionFromLocations,
  locationToFeatures,
  buildLocationLookupByFeatureProps,
  resolveLocationFromFeatureProps,
  getLocationFeatureKey,
};
