'use client';

/**
 * LocationChildrenExplorer — unified "inside this location" section.
 *
 * Renders child locations as an interactive map (polygons when boundary_geojson is
 * available, markers when only coordinates exist) with a pills/list beside the map.
 * Pills and map features are fully bidirectionally linked:
 *   - hover on a map polygon/marker → highlights the corresponding pill
 *   - hover on a pill → highlights the corresponding polygon or marker on the map
 *   - click on a pill OR map polygon/marker → navigates directly to that location page
 *
 * When no children have geometry, the section renders as a pills-only list.
 * When children.length === 0 (after loading), the section renders nothing.
 *
 * Props:
 *   location  {object}   – parent location object (used for context labels + map defaults)
 *   children  {Array}    – child location objects from the API (may include userCount + moderatorPreview)
 *   loading   {boolean}  – when true shows skeleton placeholders
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { getChildLocationTerminology } from '@/lib/constants/locations';
import {
  buildFeatureCollectionFromLocations,
  buildLocationLookupByFeatureProps,
  resolveLocationFromFeatureProps,
  getLocationFeatureKey,
} from '@/components/map/GreeceBoundaryMap';

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

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build a compact tooltip HTML string for a child location.
 * Shows: name (bold), user count (when available), first moderator name (when available).
 */
function buildTooltip(props) {
  const name = escapeHtml(props.name || '');
  const lines = [
    `<div style="font-weight:600;font-size:13px;line-height:1.3">${name}</div>`,
  ];

  if (typeof props.userCount === 'number' && props.userCount > 0) {
    lines.push(
      `<div style="font-size:11px;color:#6b7280;margin-top:2px">👥 ${props.userCount} χρήστ${props.userCount === 1 ? 'ης' : 'ες'}</div>`
    );
  }

  const mod = props.moderatorPreview;
  if (mod) {
    const modName = escapeHtml(
      [mod.firstNameNative, mod.lastNameNative].filter(Boolean).join(' ') || mod.username || ''
    );
    if (modName) {
      lines.push(
        `<div style="font-size:11px;color:#6b7280;margin-top:2px">🏛 <span aria-label="Υπεύθυνος">${modName}</span></div>`
      );
    }
  }

  return lines.join('');
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
  const router = useRouter();
  const [hoveredChildId, setHoveredChildId] = useState(null);

  // Ref tracks the current hovered child id synchronously (updated before state).
  // styleFeature reads from this ref so resetStyle always sees the correct value.
  const hoveredChildIdRef = useRef(null);

  // Imperative controls exposed by BaseMap after each layer init — used to
  // apply/remove polygon highlight when a pill is hovered without rebuilding layers.
  const featureLayerControlsRef = useRef(null);

  // Imperative controls for the marker-fallback layer.
  const markerLayerControlsRef = useRef(null);

  const childTerms = getChildLocationTerminology(location?.type);
  const hasPolygons = children.some((c) => c.boundary_geojson);
  const hasMarkers = children.some((c) => c.lat && c.lng);
  const hasGeometry = hasPolygons || hasMarkers;

  // O(1) feature props → child lookup (supports slug/code/name fallbacks).
  const childLookup = useMemo(
    () => buildLocationLookupByFeatureProps(children),
    [children]
  );

  // Sync helper: update ref immediately (so styleFeature/resetStyle callbacks read
  // the new value) and queue the React state update for pill CSS repaint.
  const setHoveredChild = useCallback((id) => {
    hoveredChildIdRef.current = id;
    setHoveredChildId(id);
  }, []);

  // Map feature click: navigate directly to that child location's page.
  const handleFeatureClick = useCallback((feature) => {
    const child = resolveLocationFromFeatureProps(feature.properties || {}, childLookup);
    if (!child) return;
    router.push(`/locations/${child.slug || child.id}`);
  }, [childLookup, router]);

  // Map feature hover: update the ref FIRST (so resetStyle in BaseMap sees the new
  // value), then queue the React state update for pill CSS.
  const handleFeatureHover = useCallback((feature) => {
    if (!feature) { setHoveredChild(null); return; }
    const child = resolveLocationFromFeatureProps(feature.properties || {}, childLookup);
    setHoveredChild(child?.id ?? null);
  }, [childLookup, setHoveredChild]);

  // Marker click: navigate directly to that child location's page.
  const handleMarkerClick = useCallback((id) => {
    const child = children.find((c) => String(c.id) === String(id));
    if (!child) return;
    router.push(`/locations/${child.slug || child.id}`);
  }, [children, router]);

  // Marker hover callback: map marker hovered/un-hovered → update pill highlight.
  const handleMarkerHover = useCallback((id) => {
    if (!id) { setHoveredChild(null); return; }
    const child = children.find((c) => String(c.id) === String(id));
    if (child) setHoveredChild(child.id);
  }, [children, setHoveredChild]);

  // Build polygon layers — no longer needs selectedChildId (click now navigates away).
  // Hover highlighting is applied imperatively via featureLayerControlsRef so that the
  // layer is not rebuilt on every mouse movement.
  const polygonLayers = useMemo(() => {
    if (!hasPolygons) return [];
    const featureCollection = buildFeatureCollectionFromLocations(children);
    if (!featureCollection) return [];
    return [
      {
        id: 'location-children',
        geojson: featureCollection,
        style: POLY_DEFAULT,
        // styleFeature reads hoveredChildIdRef so resetStyle always reflects the
        // most current hover state without requiring a layer rebuild on every hover.
        styleFeature: (feature, base) => {
          const child = resolveLocationFromFeatureProps(feature.properties || {}, childLookup);
          if (child && child.id === hoveredChildIdRef.current) return POLY_HOVER;
          return base;
        },
        hoverStyle: POLY_HOVER,
        fitBoundsOnClick: false,
        onFeatureClick: handleFeatureClick,
        onFeatureHover: handleFeatureHover,
        getTooltip: buildTooltip,
        getFeatureId: (feature) => getLocationFeatureKey(feature.properties || {}),
        // onLayerInit is called each time the layer is (re)built — store fresh controls
        // and re-apply any active pill hover so the highlight survives layer rebuilds.
        onLayerInit: (controls) => {
          featureLayerControlsRef.current = controls;
          const currentHovered = hoveredChildIdRef.current;
          if (currentHovered !== null) {
            const hoveredChild = children.find((c) => c.id === currentHovered);
            const featureId = getLocationFeatureKey(hoveredChild || {});
            if (featureId) {
              controls.highlight(featureId);
            }
          }
        },
      },
    ];
  }, [children, childLookup, hasPolygons, handleFeatureClick, handleFeatureHover]);

  // Marker fallback: used when children only have coordinates (no polygons).
  // Markers include tooltip content; hover highlighting uses markerLayerControlsRef.
  const markers = useMemo(() => {
    if (!hasMarkers) return [];
    return children
      .filter((c) => c.lat && c.lng)
      .map((c) => ({
        id: String(c.id),
        lat: Number(c.lat),
        lng: Number(c.lng),
        popup: buildTooltip({ name: c.name_local || c.name, userCount: c.userCount ?? null, moderatorPreview: c.moderatorPreview ?? null }),
        tooltip: buildTooltip({ name: c.name_local || c.name, userCount: c.userCount ?? null, moderatorPreview: c.moderatorPreview ?? null }),
        variant: 'explorer',
      }));
  }, [children, hasMarkers]);

  const mapCenter = useMemo(() => computeMapCenter(location, children), [location, children]);
  const mapZoom = location?.map_default_zoom ? Number(location.map_default_zoom) : 7;
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
                  onMarkerHover={hasMarkers ? handleMarkerHover : undefined}
                  onMarkerClick={hasMarkers ? handleMarkerClick : undefined}
                  onMarkersReady={hasMarkers ? (controls) => { markerLayerControlsRef.current = controls; } : undefined}
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
                    const isHovered = child.id === hoveredChildId;
                    return (
                      <button
                        key={child.id}
                        role="listitem"
                        type="button"
                        onClick={() => router.push(`/locations/${child.slug || child.id}`)}
                        onMouseEnter={() => {
                          setHoveredChild(child.id);
                          // Imperatively highlight the polygon/marker without rebuilding layers
                          const featureId = getLocationFeatureKey(child || {});
                          if (hasPolygons && featureId) {
                            featureLayerControlsRef.current?.highlight(featureId);
                          }
                          if (hasMarkers) {
                            markerLayerControlsRef.current?.highlight(String(child.id));
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredChild(null);
                          // Restore polygon/marker to its default style
                          const featureId = getLocationFeatureKey(child || {});
                          if (hasPolygons && featureId) {
                            featureLayerControlsRef.current?.unhighlight(featureId);
                          }
                          if (hasMarkers) {
                            markerLayerControlsRef.current?.unhighlight(
                              String(child.id),
                              'explorer'
                            );
                          }
                        }}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                          isHovered
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

      </div>
    </section>
  );
}
