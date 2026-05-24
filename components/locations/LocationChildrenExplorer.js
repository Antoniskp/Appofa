'use client';

/**
 * LocationChildrenExplorer — unified "inside this location" section.
 *
 * Renders child locations as an interactive map (polygons when boundary_geojson is
 * available, markers when only coordinates exist) with a pills/list below the map.
 * Pills and map features are linked bidirectionally:
 *   - hover/click on a map polygon/marker → highlights + selects the corresponding pill
 *   - click on a pill → selects and shows an inline preview card; map zooms to that child
 *     (via BaseMap fitBoundsOnClick)
 *   - hover on a pill → highlights the pill (map hover is handled internally by BaseMap)
 *
 * When no children have geometry, the section renders as a pills-only list.
 * When children.length === 0 (after loading), the section renders nothing.
 *
 * Props:
 *   location  {object}   – parent location object (used for context labels + map defaults)
 *   children  {Array}    – child location objects from the API
 *   loading   {boolean}  – when true shows skeleton placeholders
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getChildLocationTerminology } from '@/lib/constants/locations';
import { buildFeatureCollectionFromLocations } from '@/components/map/GreeceBoundaryMap';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

// Polygon styles for child boundaries
const POLY_DEFAULT = {
  color: '#2563eb',
  weight: 1.5,
  opacity: 0.65,
  fillColor: '#3b82f6',
  fillOpacity: 0.10,
};
const POLY_HOVER = {
  color: '#1e40af',
  weight: 2.5,
  opacity: 0.9,
  fillColor: '#3b82f6',
  fillOpacity: 0.28,
};
const POLY_SELECTED = {
  color: '#1d4ed8',
  weight: 2.5,
  opacity: 1,
  fillColor: '#1d4ed8',
  fillOpacity: 0.35,
};

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTooltip(props) {
  const name = escapeHtml(props.name || '');
  return `<div style="font-weight:600;font-size:13px;line-height:1.3">${name}</div>`;
}

/**
 * Compute the best map center for an explorer section.
 * Priority: parent map defaults → parent lat/lng → average of children with coords.
 */
function computeMapCenter(location, children) {
  if (location?.map_default_center_lat && location?.map_default_center_lng) {
    return [Number(location.map_default_center_lat), Number(location.map_default_center_lng)];
  }
  if (location?.lat && location?.lng) {
    return [Number(location.lat), Number(location.lng)];
  }
  const withCoords = children.filter((c) => c.lat && c.lng);
  if (!withCoords.length) return null;
  const avgLat = withCoords.reduce((s, c) => s + Number(c.lat), 0) / withCoords.length;
  const avgLng = withCoords.reduce((s, c) => s + Number(c.lng), 0) / withCoords.length;
  return [avgLat, avgLng];
}

export default function LocationChildrenExplorer({
  location,
  children = [],
  loading = false,
}) {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [hoveredChildId, setHoveredChildId] = useState(null);
  const pillRefs = useRef({});

  const childTerms = getChildLocationTerminology(location?.type);
  const hasPolygons = children.some((c) => c.boundary_geojson);
  const hasMarkers = !hasPolygons && children.some((c) => c.lat && c.lng);
  const hasGeometry = hasPolygons || hasMarkers;

  // O(1) slug → child lookup to avoid repeated linear scans in hover/click handlers
  const childBySlug = useMemo(
    () => new Map(children.filter((c) => c.slug).map((c) => [c.slug, c])),
    [children]
  );

  // Map feature click: select the matching pill and scroll it into view
  const handleFeatureClick = useCallback((feature) => {
    const slug = feature.properties?.slug;
    const child = slug ? childBySlug.get(slug) : null;
    if (!child) return;
    setSelectedChildId((prev) => (prev === child.id ? null : child.id));
    const el = pillRefs.current[child.id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [childBySlug]);

  // Map feature hover: highlight the matching pill
  const handleFeatureHover = useCallback((feature) => {
    if (!feature) { setHoveredChildId(null); return; }
    const slug = feature.properties?.slug;
    const child = slug ? childBySlug.get(slug) : null;
    setHoveredChildId(child?.id ?? null);
  }, [childBySlug]);

  // Build polygon layers — includes selectedChildId so the selected polygon is highlighted.
  // Rebuilding on click (when selectedChildId changes) is acceptable; it happens once per click
  // and the browser only paints the final result, so there is no visible flicker.
  const polygonLayers = useMemo(() => {
    if (!hasPolygons) return [];
    const featureCollection = buildFeatureCollectionFromLocations(children);
    if (!featureCollection) return [];
    return [
      {
        id: 'location-children',
        geojson: featureCollection,
        style: POLY_DEFAULT,
        styleFeature: (feature, base) => {
          const slug = feature.properties?.slug;
          const child = slug ? childBySlug.get(slug) : null;
          if (child && child.id === selectedChildId) return POLY_SELECTED;
          return base;
        },
        hoverStyle: POLY_HOVER,
        fitBoundsOnClick: true,
        onFeatureClick: handleFeatureClick,
        onFeatureHover: handleFeatureHover,
        getTooltip: buildTooltip,
      },
    ];
  }, [children, childBySlug, hasPolygons, selectedChildId, handleFeatureClick, handleFeatureHover]);

  // Marker fallback: used when children only have coordinates (no polygons)
  const markers = useMemo(() => {
    if (!hasMarkers) return [];
    return children
      .filter((c) => c.lat && c.lng)
      .map((c) => ({
        lat: Number(c.lat),
        lng: Number(c.lng),
        popup: c.name_local || c.name,
      }));
  }, [children, hasMarkers]);

  const mapCenter = useMemo(() => computeMapCenter(location, children), [location, children]);
  const mapZoom = location?.map_default_zoom ? Number(location.map_default_zoom) : 7;
  const selectedChild = selectedChildId != null ? children.find((c) => c.id === selectedChildId) : null;
  const showMap = !loading && hasGeometry && mapCenter;
  const showPills = !loading && children.length > 0;
  const useDesktopSplitLayout = showMap && showPills;

  // Don't render anything when there are no children (after loading completes)
  if (!loading && children.length === 0) return null;

  return (
    <section id="location-children-explorer" className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        {childTerms.label}{!loading ? ` (${children.length})` : ''}
      </h2>
      <div className="bg-white rounded-lg shadow-md p-3 space-y-3">
        {/* Map + pills explorer layout */}
        {loading ? (
          <div className="h-[300px] w-full rounded-xl bg-gray-100 animate-pulse" aria-hidden="true" />
        ) : (
          <div
            className={useDesktopSplitLayout ? 'grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start lg:gap-4' : 'space-y-3'}
            data-testid={useDesktopSplitLayout ? 'children-explorer-split-layout' : 'children-explorer-stacked-layout'}
          >
            {showMap && (
              <div className="space-y-2">
                <BaseMap
                  center={mapCenter}
                  zoom={mapZoom}
                  markers={markers}
                  polygonLayers={polygonLayers}
                  className="h-[300px] w-full rounded-xl overflow-hidden sm:h-[340px] lg:h-auto lg:aspect-square"
                  scrollWheelZoom={false}
                  interactive={true}
                />
                <p className="text-xs text-gray-500">
                  Επίλεξε περιοχή από τον χάρτη ή τη λίστα για να εξερευνήσεις τοπική δραστηριότητα
                </p>
              </div>
            )}

            {showPills && (
              <div className={useDesktopSplitLayout ? 'rounded-xl border border-gray-200 bg-gray-50 p-3 lg:max-h-[420px] lg:overflow-y-auto' : ''}>
                <div
                  className="flex flex-wrap gap-2"
                  role="list"
                  aria-label={childTerms.label}
                >
                  {children.map((child) => {
                    const isSelected = child.id === selectedChildId;
                    const isHovered = child.id === hoveredChildId;
                    return (
                      <button
                        key={child.id}
                        role="listitem"
                        ref={(el) => { if (el) pillRefs.current[child.id] = el; }}
                        type="button"
                        onClick={() => setSelectedChildId(isSelected ? null : child.id)}
                        onMouseEnter={() => setHoveredChildId(child.id)}
                        onMouseLeave={() => setHoveredChildId(null)}
                        aria-pressed={isSelected}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-sm'
                            : isHovered
                              ? 'border-blue-300 bg-blue-50 text-blue-700'
                              : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                        }`}
                      >
                        {child.name_local || child.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected child preview card — shown when a pill or map feature is selected */}
        {selectedChild && (
          <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-2.5">
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {selectedChild.name_local || selectedChild.name}
              </p>
              {selectedChild.type && (
                <p className="text-xs text-blue-600 capitalize">{selectedChild.type}</p>
              )}
            </div>
            <Link
              href={`/locations/${selectedChild.slug || selectedChild.id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Άνοιγμα →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
