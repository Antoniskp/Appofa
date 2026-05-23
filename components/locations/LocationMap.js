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

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

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

    function collectLonLatPairs(node, output = []) {
      if (!Array.isArray(node)) return output;
      if (
        node.length >= 2
        && typeof node[0] === 'number'
        && Number.isFinite(node[0])
        && typeof node[1] === 'number'
        && Number.isFinite(node[1])
      ) {
        output.push([node[0], node[1]]);
        return output;
      }
      node.forEach((child) => collectLonLatPairs(child, output));
      return output;
    }

    function getBoundaryBounds(geojson) {
      if (!geojson) return null;
      const geometries = [];
      if (geojson.type === 'FeatureCollection') {
        geojson.features?.forEach((feature) => {
          if (feature?.geometry) geometries.push(feature.geometry);
        });
      } else if (geojson.type === 'Feature') {
        if (geojson.geometry) geometries.push(geojson.geometry);
      } else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
        geometries.push(geojson);
      }

      const pairs = geometries.flatMap((geometry) => collectLonLatPairs(geometry.coordinates, []));
      if (pairs.length === 0) return null;

      const lons = pairs.map(([lon]) => lon);
      const lats = pairs.map(([, lat]) => lat);
      return {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lons),
        west: Math.min(...lons),
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
  const normalizedBoundaryColor =
    HEX_COLOR_RE.test(String(location.boundary_color || '').trim())
      ? String(location.boundary_color).trim().toLowerCase()
      : null;

  const hasValidCoords =
    isValidCoord(lat, -90, 90) && isValidCoord(lng, -180, 180);

  // Build polygon layer from boundary_geojson when present and valid.
  const normalizedBoundary = boundary_geojson
    ? normalizeBoundaryGeoJSON(boundary_geojson, displayName)
    : null;
  const boundaryBounds = normalizedBoundary ? getBoundaryBounds(normalizedBoundary) : null;

  const boundaryStyle = normalizedBoundaryColor
    ? {
        ...BOUNDARY_STYLE,
        color: normalizedBoundaryColor,
        fillColor: normalizedBoundaryColor,
      }
    : BOUNDARY_STYLE;

  const boundaryHoverStyle = normalizedBoundaryColor
    ? {
        ...BOUNDARY_HOVER_STYLE,
        color: normalizedBoundaryColor,
        fillColor: normalizedBoundaryColor,
      }
    : BOUNDARY_HOVER_STYLE;

  const polygonLayers = normalizedBoundary
    ? [
        {
          id: 'location-boundary',
          geojson: normalizedBoundary,
          style: boundaryStyle,
          hoverStyle: boundaryHoverStyle,
          // Don't auto-fit on click — the page already fits on load via bounding_box/center.
          fitBoundsOnClick: false,
          getTooltip: () => displayName,
        },
      ]
    : [];

  // Nothing to render if we have neither valid coords nor a boundary polygon.
  if (!hasValidCoords && !normalizedBoundary) return null;

  const hasDefaultCenter =
    isValidCoord(location.map_default_center_lat, -90, 90)
    && isValidCoord(location.map_default_center_lng, -180, 180);
  const center = hasDefaultCenter
    ? [Number(location.map_default_center_lat), Number(location.map_default_center_lng)]
    : (hasValidCoords ? [Number(lat), Number(lng)] : GREECE_CENTER);
  const zoom = Number.isFinite(Number(location.map_default_zoom))
    ? Number(location.map_default_zoom)
    : (hasValidCoords ? 12 : GREECE_ZOOM);
  const initialBounds = boundaryBounds || bounding_box || null;

  const markers = hasValidCoords
    ? [{ lat: Number(lat), lng: Number(lng), popup: displayName }]
    : [];

  return (
    <BaseMap
      center={center}
      zoom={zoom}
      bounds={initialBounds}
      markers={markers}
      overlays={overlays}
      polygonLayers={polygonLayers}
      className={className || 'h-64 w-full rounded-lg overflow-hidden'}
      scrollWheelZoom={scrollWheelZoom}
      interactive={interactive}
    />
  );
}
