'use client';

/**
 * ExploreLocationsMap — a discovery map for the homepage "Εξερεύνησε Περιοχές" section.
 *
 * Shows a map of Greece with:
 *   1. Interactive polygon boundaries for the 13 Greek peripheries (GreeceBoundaryMap).
 *   2. Point markers for locations that have coordinates (layered on top).
 *
 * Hovering a region polygon shows a tooltip; clicking it zooms to that region and shows
 * a React info card overlay with the region name, capital, and a navigation link.
 *
 * Props:
 *   locations  {Array<{id, name, name_local, lat, lng, slug}>}  – list of locations to show
 *   className  {string}  – override map container height/styling
 *   loading    {boolean} – when true shows a skeleton placeholder instead of the map
 *
 * Architecture:
 *   Delegates to GreeceBoundaryMap which handles GeoJSON loading and polygon interactivity.
 *   GreeceBoundaryMap wraps BaseMap (via dynamic import) and passes polygonLayers.
 *
 * Extension points:
 *   - To add electoral districts: extend GreeceBoundaryMap with a second polygonLayer entry.
 *   - To enable choropleth: supply a styleFeature function via the layer def that maps
 *     region codes to fill colors based on vote or participation data.
 *   - For municipality drill-down: swap layers based on zoom level in GreeceBoundaryMap.
 */

import dynamic from 'next/dynamic';

const GreeceBoundaryMap = dynamic(() => import('@/components/map/GreeceBoundaryMap'), { ssr: false });

export default function ExploreLocationsMap({ locations = [], className, loading = false }) {
  return (
    <GreeceBoundaryMap
      locations={locations}
      loading={loading}
      className={className}
    />
  );
}

