'use client';

/**
 * ExploreLocationsMap — a discovery map for the homepage "Εξερεύνησε Περιοχές" section.
 *
 * Renders the `GreeceBoundaryMap` (using per-location `boundary_geojson` polygons when
 * available, with a static-file fallback) and a row of clickable prefecture pills below
 * the map for quick navigation.
 *
 * Props:
 *   prefectures  {Array<Location>}  – prefecture location objects (may include boundary_geojson).
 *                                     Used both for polygon layers and for the pills row.
 *   className    {string}           – override map container height/styling
 *   loading      {boolean}          – when true shows a skeleton placeholder instead of the map
 */

import Link from 'next/link';
import dynamic from 'next/dynamic';

const GreeceBoundaryMap = dynamic(() => import('@/components/map/GreeceBoundaryMap'), { ssr: false });

/**
 * A single prefecture pill that links to the location page.
 */
function PrefecturePill({ prefecture }) {
  const displayName = prefecture.name_local || prefecture.name;
  const href = prefecture.slug ? `/locations/${prefecture.slug}` : '/locations';
  return (
    <Link
      href={href}
      className="inline-flex items-center px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors whitespace-nowrap"
    >
      {displayName}
    </Link>
  );
}

export default function ExploreLocationsMap({ prefectures = [], className, loading = false }) {
  return (
    <div>
      <GreeceBoundaryMap
        prefectures={prefectures}
        loading={loading}
        className={className}
      />
      {!loading && prefectures.length > 0 && (
        <div
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Περιφέρειες"
        >
          {prefectures.map((pref) => (
            <PrefecturePill key={pref.id} prefecture={pref} />
          ))}
        </div>
      )}
    </div>
  );
}

