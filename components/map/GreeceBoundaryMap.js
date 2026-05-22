'use client';

/**
 * GreeceBoundaryMap — homepage discovery map with interactive polygon boundaries.
 *
 * Extends ExploreLocationsMap by adding a polygon boundary layer for the 13 Greek
 * peripheries (administrative regions / περιφέρειες) on top of the point-marker layer.
 *
 * Behaviour:
 *   - Shows simplified polygon boundaries for all 13 Greek peripheries at the default
 *     Greece-wide view (zoom 6).
 *   - Hovering a polygon highlights it and shows a tooltip with the region name.
 *   - Clicking a polygon zooms the map to fit that region's bounds and opens a popup
 *     with the region name, capital, and a link to explore locations in that region.
 *   - Point markers for known locations are layered on top.
 *   - Shows a small info card overlay when a region is selected (React layer, outside Leaflet).
 *
 * Props:
 *   locations  {Array<{id, name, name_local, lat, lng, slug}>}  – locations for point markers
 *   className  {string}  – override the map container height/styling
 *   loading    {boolean} – when true shows a skeleton placeholder
 *
 * Architecture for future extensions:
 *   - To add choropleth coloring: replace the static `style` in `boundaryLayer` with a
 *     `styleFeature(feature)` function that maps feature.properties.code → fill color.
 *   - To add electoral districts: create a second entry in `polygonLayers` pointing at
 *     `/data/greece-electoral-districts.geojson` (same schema, same interaction pattern).
 *   - To add municipality drill-down: listen for zoom events and swap the boundary layer
 *     from peripheries to municipalities when zoom > 8.
 *
 * Data source:
 *   /public/data/greece-regions.geojson — simplified starter dataset.
 *   See doc/POLYGON_DATA.md for authoritative sources and how to replace this file.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

// Default view: Greece
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

function isValidCoord(value, min, max) {
  if (value == null || value === '') return false;
  const n = Number(value);
  return isFinite(n) && n >= min && n <= max;
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
  if (!region) return null;
  return (
    <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-3 min-w-[180px] max-w-[220px] pointer-events-auto">
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
        <p className="text-xs text-gray-500 mb-2">Πρωτεύουσα: {region.capital}</p>
      )}
      <Link
        href={`/locations?type=periphery&region=${region.code}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
      >
        Εξερεύνησε περιοχές
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </Link>
    </div>
  );
}

export default function GreeceBoundaryMap({ locations = [], className, loading = false }) {
  const [geoData, setGeoData] = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Load the boundary GeoJSON from the public folder.
  // Fetching at runtime (not bundled) keeps the JS bundle lean and lets the file be
  // replaced without a redeploy.
  useEffect(() => {
    let cancelled = false;
    fetch('/data/greece-regions.geojson')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setGeoData(data);
      })
      .catch(() => {
        if (!cancelled) setGeoError(true);
      });
    return () => { cancelled = true; };
  }, []);

  // Build point markers for locations that have valid coordinates
  const markers = useMemo(
    () =>
      locations
        .filter(
          (loc) =>
            isValidCoord(loc.lat, -90, 90) &&
            isValidCoord(loc.lng, -180, 180)
        )
        .map((loc) => ({
          lat: Number(loc.lat),
          lng: Number(loc.lng),
          popup: loc.slug
            ? `<a href="/locations/${loc.slug}" class="font-medium text-blue-600 hover:underline">${loc.name_local || loc.name}</a>`
            : (loc.name_local || loc.name),
          key: loc.id,
        })),
    [locations]
  );

  // Handler: a region polygon was clicked — update React info card
  const handleFeatureClick = useCallback((feature) => {
    const p = feature.properties || {};
    setSelectedRegion({
      name: p.name || p.name_en || '',
      capital: p.capital || '',
      code: p.code || '',
    });
  }, []);

  // Build the polygonLayers config (memoized so it doesn't trigger map re-init)
  const polygonLayers = useMemo(() => {
    if (!geoData) return [];
    return [
      {
        id: 'greece-peripheries',
        geojson: geoData,
        style: POLY_DEFAULT_STYLE,
        hoverStyle: POLY_HOVER_STYLE,
        fitBoundsOnClick: true,
        onFeatureClick: handleFeatureClick,
        // Tooltip: shown on hover — region name + capital
        getTooltip: (props) =>
          `<div style="font-weight:600;font-size:13px;line-height:1.3">${props.name || ''}</div>${props.capital ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">📍 ${props.capital}</div>` : ''}`,
        // Popup: shown after click — richer info with navigation link
        getPopup: (props) =>
          `<div style="min-width:160px">` +
          `<p style="font-weight:700;font-size:14px;margin:0 0 4px">${props.name || ''}</p>` +
          (props.name_en ? `<p style="font-size:11px;color:#6b7280;margin:0 0 6px">${props.name_en}</p>` : '') +
          (props.capital ? `<p style="font-size:12px;margin:0 0 8px">🏛️ ${props.capital}</p>` : '') +
          `<a href="/locations?type=periphery&region=${props.code}" style="font-size:12px;color:#2563eb;font-weight:600;text-decoration:none">Εξερεύνησε &rarr;</a>` +
          `</div>`,
      },
    ];
  }, [geoData, handleFeatureClick]);

  if (loading) return <Skeleton />;

  // Fallback: if GeoJSON failed to load and there are no markers, nothing to show
  if (geoError && markers.length === 0) return null;

  return (
    <div className={`relative ${className || 'h-[420px] w-full rounded-xl overflow-hidden'}`}>
      <BaseMap
        center={GREECE_CENTER}
        zoom={GREECE_ZOOM}
        markers={markers}
        polygonLayers={polygonLayers}
        className="h-full w-full"
        scrollWheelZoom={false}
        interactive={true}
      />
      {/* React info card overlay — positioned inside the relative container, above Leaflet */}
      <RegionInfoCard
        region={selectedRegion}
        onClose={() => setSelectedRegion(null)}
      />
      {/* Legend / attribution note for the simplified boundaries */}
      <div className="absolute bottom-1 left-1 z-[1000] bg-white/80 rounded px-1.5 py-0.5 text-[10px] text-gray-400 pointer-events-none select-none">
        Περιφέρειες Ελλάδας · απλοποιημένα όρια
      </div>
    </div>
  );
}
