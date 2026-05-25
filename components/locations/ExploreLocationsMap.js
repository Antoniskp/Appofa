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
import { useState, useRef } from 'react';
import { getLocationFeatureKey } from '@/components/map/GreeceBoundaryMap';

const GreeceBoundaryMap = dynamic(() => import('@/components/map/GreeceBoundaryMap'), { ssr: false });

/**
 * A single prefecture pill that links to the location page.
 */
function PrefecturePill({
  prefecture,
  isSelected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}) {
  const displayName = prefecture.name_local || prefecture.name;
  const href = prefecture.slug ? `/locations/${prefecture.slug}` : '/locations';
  return (
    <Link
      href={href}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-current={isSelected ? 'true' : undefined}
      className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
       isSelected
         ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-sm'
         : isHovered
           ? 'border-blue-300 bg-blue-50 text-blue-700'
           : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
      }`}
    >
      {displayName}
    </Link>
  );
}

export default function ExploreLocationsMap({ prefectures = [], className, loading = false }) {
  const [selectedPrefectureId, setSelectedPrefectureId] = useState(null);
  const [hoveredPrefectureId, setHoveredPrefectureId] = useState(null);
  const layerControlsRef = useRef(null);
  const markerControlsRef = useRef(null);

  return (
    <div>
      <GreeceBoundaryMap
       prefectures={prefectures}
       loading={loading}
       className={className}
       selectedLocationId={selectedPrefectureId}
       hoveredLocationId={hoveredPrefectureId}
       onLocationSelect={(id) => setSelectedPrefectureId(id)}
       onLocationHover={(id) => setHoveredPrefectureId(id)}
       onLayerInit={(controls) => {
         layerControlsRef.current = controls;
         const hoveredPrefecture = prefectures.find((p) => Number(p.id) === Number(hoveredPrefectureId));
         const featureId = getLocationFeatureKey(hoveredPrefecture || {});
         if (featureId) controls.highlight(featureId);
       }}
       onMarkerHover={(idOrNull) => {
         if (idOrNull == null) {
           setHoveredPrefectureId(null);
           return;
         }
         const linked = prefectures.find((p) => String(p.id) === String(idOrNull));
         setHoveredPrefectureId(linked?.id ?? null);
       }}
       onMarkersReady={(controls) => { markerControlsRef.current = controls; }}
       showSelectionCard={true}
      />
      {!loading && prefectures.length > 0 && (
       <div
         className="mt-3 flex flex-wrap gap-2"
         aria-label="Περιφέρειες"
       >
         {prefectures.map((pref) => (
           <PrefecturePill
             key={pref.id}
             prefecture={pref}
             isSelected={Number(selectedPrefectureId) === Number(pref.id)}
             isHovered={Number(hoveredPrefectureId) === Number(pref.id)}
             onMouseEnter={() => {
               setHoveredPrefectureId(pref.id);
               const featureId = getLocationFeatureKey(pref);
               if (featureId) {
                 layerControlsRef.current?.highlight(featureId);
               }
               markerControlsRef.current?.highlight(String(pref.id));
             }}
             onMouseLeave={() => {
               setHoveredPrefectureId(null);
               const featureId = getLocationFeatureKey(pref);
               if (featureId) {
                 layerControlsRef.current?.unhighlight(featureId);
               }
               markerControlsRef.current?.unhighlight(
                 String(pref.id),
                 Number(selectedPrefectureId) === Number(pref.id) ? 'selected' : 'explorer'
               );
             }}
           />
         ))}
       </div>
      )}
    </div>
  );
}
