'use client';

/**
 * ExploreLocationsMap — a discovery map for the homepage "Εξερεύνησε Περιοχές" section.
 *
 * Shows a map of Greece (or wherever the supplied locations are) with clickable markers.
 * Clicking a marker opens a popup with a link to the location's detail page.
 *
 * Props:
 *   locations  {Array<{id, name, name_local, lat, lng, slug}>}  – list of locations to show
 *   className  {string}  – override map container height/styling
 *   loading    {boolean} – when true shows a skeleton placeholder instead of the map
 *
 * Architecture:
 *   Wraps BaseMap (via dynamic import) and passes location markers with HTML popup links.
 *   Leaflet's bindPopup renders HTML, so a regular <a href> tag works for navigation.
 *
 * Extension points:
 *   - Pass prefecture GeoJSON files as `overlays` to BaseMap to show political boundaries.
 *   - Filter by location type for a more focused view (e.g. municipalities only).
 */

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

// Default view: Greece
const GREECE_CENTER = [38.5, 23.8];
const GREECE_ZOOM = 6;

function isValidCoord(value, min, max) {
  if (value == null || value === '') return false;
  const n = Number(value);
  return isFinite(n) && n >= min && n <= max;
}

function Skeleton() {
  return (
    <div className="h-72 w-full rounded-xl overflow-hidden bg-gray-100 animate-pulse" />
  );
}

export default function ExploreLocationsMap({ locations = [], className, loading = false }) {
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
          // Leaflet renders popup content as HTML; include a link for navigation
          popup: loc.slug
            ? `<a href="/locations/${loc.slug}" class="font-medium text-blue-600 hover:underline">${loc.name_local || loc.name}</a>`
            : (loc.name_local || loc.name),
          key: loc.id,
        })),
    [locations]
  );

  if (loading) return <Skeleton />;

  // If none of the fetched locations have coordinates, there is nothing to plot
  if (markers.length === 0) return null;

  return (
    <BaseMap
      center={GREECE_CENTER}
      zoom={GREECE_ZOOM}
      markers={markers}
      className={className || 'h-72 w-full rounded-xl overflow-hidden'}
      scrollWheelZoom={false}
      interactive={true}
    />
  );
}
