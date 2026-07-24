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
import { MAP_ISSUE_TYPE_COLORS, MAP_ISSUE_TYPE_LABELS } from '@/lib/constants/mapIssues';

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function collectLonLatPairs(node, output = []) {
  if (!Array.isArray(node)) return output;
  if (
    node.length >= 2
    && typeof node[0] === 'number'
    && Number.isFinite(node[0])
    && typeof node[1] === 'number'
    && Number.isFinite(node[1])
  ) {
    // GeoJSON coordinate order is [lng, lat].
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

function getMarkersBounds(markers) {
  if (!markers.length) return null;
  return {
    north: Math.max(...markers.map((marker) => marker.lat)),
    south: Math.min(...markers.map((marker) => marker.lat)),
    east: Math.max(...markers.map((marker) => marker.lng)),
    west: Math.min(...markers.map((marker) => marker.lng)),
  };
}

// Fallback centre for Greece, used when a boundary is present but no lat/lng are available.
const GREECE_CENTER = [38.5, 23.8];
const GREECE_ZOOM = 6;

export default function LocationMap({
  location,
  childLocations = [],
  summaryCounts,
  mapIssues = [],
  pendingIssuePin = null,
  className,
  overlays = [],
  scrollWheelZoom = false,
  interactive = true,
  onMapClick,
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

  const childMarkers = childLocations
    .filter((child) => isValidCoord(child.lat, -90, 90) && isValidCoord(child.lng, -180, 180))
    .map((child) => {
      const childName = child.name_local || child.name;
      const href = child.slug ? `/locations/${child.slug}` : null;
      const userCount = Number(child.userCount || 0);
      return {
        id: child.id ? `child-${child.id}` : undefined,
        lat: Number(child.lat),
        lng: Number(child.lng),
        label: childName,
        meta: `${userCount} users${child.moderatorPreview ? ' - moderator assigned' : ''}`,
        href,
        variant: 'explorer',
        tooltip: escapeHtml(childName),
        popup: `<div style="min-width:160px"><strong>${escapeHtml(childName)}</strong>${userCount > 0 ? `<div style="font-size:12px;color:#64748b;margin-top:3px">${userCount} users</div>` : ''}${href ? `<a href="${escapeHtml(href)}" style="display:inline-block;margin-top:8px;color:#1d4ed8;font-weight:600;text-decoration:none">Open location</a>` : ''}</div>`,
      };
    });

  const issueMarkers = mapIssues
    .filter((issue) => isValidCoord(issue.mapLat, -90, 90) && isValidCoord(issue.mapLng, -180, 180))
    .map((issue) => {
      const issueType = issue.mapIssueType || 'other';
      const issueLabel = MAP_ISSUE_TYPE_LABELS[issueType] || MAP_ISSUE_TYPE_LABELS.other;
      const href = issue.id ? `/suggestions/${issue.id}` : null;
      const title = issue.title || issueLabel;
      const status = issue.status ? String(issue.status).replace('_', ' ') : 'open';
      return {
        id: issue.id ? `issue-${issue.id}` : undefined,
        lat: Number(issue.mapLat),
        lng: Number(issue.mapLng),
        label: title,
        meta: issueLabel,
        href,
        variant: 'explorer',
        iconColor: MAP_ISSUE_TYPE_COLORS[issueType] || MAP_ISSUE_TYPE_COLORS.other,
        tooltip: escapeHtml(title),
        popup: `<div style="min-width:180px"><div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(issueLabel)}</div><strong>${escapeHtml(title)}</strong><div style="font-size:12px;color:#64748b;margin-top:4px">${escapeHtml(status)}${Number.isFinite(Number(issue.score)) ? ` - score ${Number(issue.score)}` : ''}</div>${href ? `<a href="${escapeHtml(href)}" style="display:inline-block;margin-top:8px;color:#1d4ed8;font-weight:600;text-decoration:none">Open issue</a>` : ''}</div>`,
      };
    });

  const pendingMarker = pendingIssuePin
    && isValidCoord(pendingIssuePin.lat, -90, 90)
    && isValidCoord(pendingIssuePin.lng, -180, 180)
    ? [{
        id: 'pending-map-issue',
        lat: Number(pendingIssuePin.lat),
        lng: Number(pendingIssuePin.lng),
        variant: 'selected',
        iconColor: MAP_ISSUE_TYPE_COLORS[pendingIssuePin.mapIssueType] || MAP_ISSUE_TYPE_COLORS.other,
        tooltip: 'New local issue',
        popup: '<strong>New local issue</strong>',
      }]
    : [];

  // Nothing to render if we have neither valid coords nor a boundary polygon nor child markers.
  if (!hasValidCoords && !normalizedBoundary && childMarkers.length === 0 && issueMarkers.length === 0 && pendingMarker.length === 0) return null;

  const hasDefaultCenter =
    isValidCoord(location.map_default_center_lat, -90, 90)
    && isValidCoord(location.map_default_center_lng, -180, 180);
  const center = hasDefaultCenter
    ? [Number(location.map_default_center_lat), Number(location.map_default_center_lng)]
    : (
        hasValidCoords
          ? [Number(lat), Number(lng)]
          : issueMarkers.length > 0
            ? [issueMarkers[0].lat, issueMarkers[0].lng]
            : pendingMarker.length > 0
              ? [pendingMarker[0].lat, pendingMarker[0].lng]
              : GREECE_CENTER
      );
  const zoom = Number.isFinite(Number(location.map_default_zoom))
    ? Number(location.map_default_zoom)
    : (hasValidCoords ? 12 : (issueMarkers.length > 0 || pendingMarker.length > 0 ? 14 : GREECE_ZOOM));
  const locationHref = location.slug ? `/locations/${location.slug}` : null;
  const pollsHref = locationHref ? `${locationHref}?tab=polls#location-content` : '#location-content';
  const suggestionsHref = locationHref ? `${locationHref}?tab=suggestions#location-content` : '#location-content';
  const actionLinks = [
    summaryCounts?.polls != null ? `<a href="${escapeHtml(pollsHref)}" style="color:#1d4ed8;font-weight:600;text-decoration:none">Polls (${Number(summaryCounts.polls || 0)})</a>` : null,
    summaryCounts?.suggestions != null ? `<a href="${escapeHtml(suggestionsHref)}" style="color:#1d4ed8;font-weight:600;text-decoration:none">Suggestions (${Number(summaryCounts.suggestions || 0)})</a>` : null,
  ].filter(Boolean).join('<span style="color:#cbd5e1"> · </span>');
  const markers = [
    ...(hasValidCoords
      ? [{
          lat: Number(lat),
          lng: Number(lng),
          label: displayName,
          href: locationHref,
          popup: `<div style="min-width:170px"><strong>${escapeHtml(displayName)}</strong>${actionLinks ? `<div style="font-size:12px;margin-top:8px">${actionLinks}</div>` : ''}</div>`,
        }]
      : []),
    ...childMarkers,
    ...issueMarkers,
    ...pendingMarker,
  ];
  const initialBounds = boundaryBounds || bounding_box || (markers.length > 1 ? getMarkersBounds(markers) : null);

  return (
    <BaseMap
      center={center}
      zoom={zoom}
      bounds={initialBounds}
      markers={markers}
      clusterMarkers={(childMarkers.length + issueMarkers.length) > 8}
      overlays={overlays}
      polygonLayers={polygonLayers}
      className={className || 'h-64 w-full rounded-lg overflow-hidden'}
      scrollWheelZoom={scrollWheelZoom}
      interactive={interactive}
      onMapClick={onMapClick}
      showFullscreenControl
    />
  );
}
