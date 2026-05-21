'use client';

/**
 * LocationMap — a location-detail-page adapter that wraps BaseMap.
 *
 * Reads `lat`, `lng`, and `bounding_box` from a location object and renders a
 * read-only interactive map with a popup marker showing the location name.
 *
 * Fails gracefully — renders nothing when coordinates are missing or invalid.
 *
 * Props:
 *   location  {object}  – a location record with at least: name, name_local, lat, lng, bounding_box
 *   className {string}  – override the map container height/styling
 *   overlays  {Array}   – forwarded to BaseMap for GeoJSON overlays (e.g. prefecture boundaries)
 *
 * Designed to be:
 *   - dropped into any location detail or preview card
 *   - easily extended with `overlays` for prefecture boundary JSON files later
 *   - adapted into an interactive coordinate-picker for edit forms by wrapping BaseMap directly
 *     with onMarkerMove / onClick callbacks (not wired here — read-only MVP only)
 */

import dynamic from 'next/dynamic';

// Dynamic import keeps Leaflet (which needs `window`) out of the SSR bundle.
// ssr:false is required — Leaflet uses browser APIs at import time.
const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

/**
 * Returns true when a value is a finite number (or a string representing one) within
 * the valid coordinate range.
 */
function isValidCoord(value, min, max) {
  if (value == null || value === '') return false;
  const n = Number(value);
  return isFinite(n) && n >= min && n <= max;
}

export default function LocationMap({ location, className, overlays = [] }) {
  if (!location) return null;

  const { lat, lng, bounding_box, name, name_local } = location;

  // Validate coordinates before rendering
  if (!isValidCoord(lat, -90, 90) || !isValidCoord(lng, -180, 180)) {
    return null;
  }

  const center = [Number(lat), Number(lng)];
  const displayName = name_local || name;

  return (
    <BaseMap
      center={center}
      zoom={12}
      bounds={bounding_box}
      markers={[{ lat: Number(lat), lng: Number(lng), popup: displayName }]}
      overlays={overlays}
      className={className || 'h-64 w-full rounded-lg overflow-hidden'}
      scrollWheelZoom={false}
      interactive
    />
  );
}
