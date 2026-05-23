'use client';

/**
 * LocationMap — a location-detail-page adapter that wraps BaseMap.
 *
 * Reads `lat`, `lng`, `bounding_box`, and `boundary_geojson` from a location object and renders a
 * read-only interactive map.  When `boundary_geojson` is present and valid, the polygon boundary
 * is rendered as a highlighted layer with a visible perimeter/outline on top of the basemap.
 * The centre-point marker is shown when coordinates are valid.
 *
 * Rendering priority:
 *   1. If `boundary_geojson` is present and valid → render polygon boundary layer (with outline)
 *      + marker (when lat/lng are valid).
 *   2. If `boundary_geojson` is absent → render marker only (existing behaviour).
 *
 * Fails gracefully — renders nothing when both coordinates are missing/invalid AND
 * `boundary_geojson` is absent or invalid.
 *
 * Props:
 *   location        {object}  – a location record with at least: name, name_local, lat, lng,
 *                               bounding_box, boundary_geojson
 *   className       {string}  – override the map container height/styling
 *   overlays        {Array}   – forwarded to BaseMap for GeoJSON overlays (legacy)
 *   scrollWheelZoom {boolean} – forwarded to BaseMap; defaults to false (safe for page embeds)
 *   interactive     {boolean} – forwarded to BaseMap; defaults to true (allows pan/zoom)
 */

import dynamic from 'next/dynamic';

// Dynamic import keeps Leaflet (which needs `window`) out of the SSR bundle.
// ssr:false is required — Leaflet uses browser APIs at import time.
const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

// Boundary polygon styles — slightly bolder than the default so the outline is clearly
// visible on location detail pages.
const BOUNDARY_STYLE = {
  color: '#2563eb',
  weight: 2,
  opacity: 0.85,
  fillColor: '#3b82f6',
  fillOpacity: 0.12,
};

const BOUNDARY_HOVER_STYLE = {
  color: '#1d4ed8',
  weight: 2.5,
  opacity: 1,
  fillColor: '#3b82f6',
  fillOpacity: 0.25,
};

/**
 * Returns true when a value is a finite number (or a string representing one) within
 * the valid coordinate range.
 */
function isValidCoord(value, min, max) {
  if (value == null || value === '') return false;
  const n = Number(value);
  return isFinite(n) && n >= min && n <= max;
}

/**
 * Normalises a boundary_geojson value (string or object) into a form that
 * Leaflet's L.geoJSON() can consume (FeatureCollection or Feature).
 * Returns null when the input is absent, unparseable, or has an unsupported type.
 */
function normalizeBoundaryGeoJSON(raw, displayName) {
  try {
    const geom = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!geom || !geom.type) return null;

    const { type } = geom;

    // FeatureCollection or Feature — pass through unchanged
    if (type === 'FeatureCollection' || type === 'Feature') return geom;

    // Bare Polygon / MultiPolygon geometry — wrap in a Feature so L.geoJSON is happy
    if (type === 'Polygon' || type === 'MultiPolygon') {
      return {
        type: 'Feature',
        geometry: geom,
        properties: { name: displayName },
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Fallback centre for Greece, used when a boundary is present but no lat/lng are available.
const GREECE_CENTER = [38.5, 23.8];
const GREECE_ZOOM = 6;

export default function LocationMap({
  location,
  className,
  overlays = [],
  scrollWheelZoom = false,
  interactive = true,
}) {
  if (!location) return null;

  const { lat, lng, bounding_box, name, name_local, boundary_geojson } = location;
  const displayName = name_local || name;

  const hasValidCoords =
    isValidCoord(lat, -90, 90) && isValidCoord(lng, -180, 180);

  // Build polygon layer from boundary_geojson when present and valid.
  const normalizedBoundary = boundary_geojson
    ? normalizeBoundaryGeoJSON(boundary_geojson, displayName)
    : null;

  const polygonLayers = normalizedBoundary
    ? [
        {
          id: 'location-boundary',
          geojson: normalizedBoundary,
          style: BOUNDARY_STYLE,
          hoverStyle: BOUNDARY_HOVER_STYLE,
          // Don't auto-fit on click — the page already fits on load via bounding_box/center.
          fitBoundsOnClick: false,
          getTooltip: () => displayName,
        },
      ]
    : [];

  // Nothing to render if we have neither valid coords nor a boundary polygon.
  if (!hasValidCoords && !normalizedBoundary) return null;

  // When coords are absent but a boundary is present, fall back to a Greece-wide view
  // so the boundary is still visible without crashing.
  const center = hasValidCoords ? [Number(lat), Number(lng)] : GREECE_CENTER;
  const zoom = hasValidCoords ? 12 : GREECE_ZOOM;

  const markers = hasValidCoords
    ? [{ lat: Number(lat), lng: Number(lng), popup: displayName }]
    : [];

  return (
    <BaseMap
      center={center}
      zoom={zoom}
      bounds={bounding_box}
      markers={markers}
      overlays={overlays}
      polygonLayers={polygonLayers}
      className={className || 'h-64 w-full rounded-lg overflow-hidden'}
      scrollWheelZoom={scrollWheelZoom}
      interactive={interactive}
    />
  );
}
