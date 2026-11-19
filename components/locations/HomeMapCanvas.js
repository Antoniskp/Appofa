'use client';

import { useMemo } from 'react';
import BaseMap from '@/components/map/BaseMap';
import { hasMapPoint, normalizeMapBoundary } from '@/lib/map-utils';
import { MAP_ISSUE_TYPE_COLORS } from '@/lib/constants/mapIssues';

const COUNTRY_BOUNDS = { north: 42, south: 34.7, east: 29.8, west: 19.2 };
const escape = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const colorForCount = count => count > 20 ? '#80462f' : count > 5 ? '#bc8868' : count > 0 ? '#e9cbb9' : '#e5e7eb';

export default function HomeMapCanvas({ areas, items, location, layer, detail, loading, selectedId, hoveredId,
  onMarkerClick, onHover, onViewportChange, focusTarget, viewResetKey, tileMode, label, controlLabels }) {
  const markers = useMemo(() => detail ? items.filter(item => hasMapPoint(item)).map(item => ({
    id: item.id, lat: Number(item.lat), lng: Number(item.lng), label: item.title,
    tooltip: escape(item.title), href: item.href,
    variant: item.id === selectedId ? 'selected' : item.id === hoveredId ? 'hovered' : 'explorer',
    issueType: item.kind === 'issues' ? item.issueType || 'other' : undefined,
    markerType: item.kind === 'cameras' || item.kind === 'live' ? 'camera' : item.kind === 'polls' ? 'poll' : undefined,
    iconColor: item.kind === 'cameras' ? item.isWorking ? '#0f766e' : '#64748b'
      : item.kind === 'live' ? '#e11d48' : item.kind === 'news' ? '#2563eb'
        : item.kind === 'polls' ? '#7c3aed' : MAP_ISSUE_TYPE_COLORS[item.issueType] || '#80462f',
  })) : areas.filter(area => hasMapPoint(area)).map(area => ({
    id: `area-${area.id}`, lat: Number(area.lat), lng: Number(area.lng),
    label: area.name_local || area.name, tooltip: escape(area.name_local || area.name),
    count: loading || !area.totals ? undefined : area.totals[layer],
    iconColor: '#80462f', variant: hoveredId === `area-${area.id}` ? 'hovered' : 'explorer',
  })), [detail, items, areas, selectedId, hoveredId, layer, loading]);
  const polygons = useMemo(() => {
    const layers = areas.flatMap(area => {
      const geojson = normalizeMapBoundary(area.boundary_geojson);
      if (!geojson) return [];
      const hovered = hoveredId === `area-${area.id}`;
      return [{ id: `home-area-${area.id}`, geojson,
        style: { color: hovered ? '#80462f' : '#b5a598', weight: hovered ? 2.5 : 1,
          fillColor: loading || !area.totals ? '#cbd5e1' : colorForCount(area.totals[layer]), fillOpacity: 0.55 },
        hoverStyle: { color: '#80462f', weight: 2.5, fillOpacity: 0.65 },
        getTooltip: () => escape(area.name_local || area.name), fitBoundsOnClick: false,
        onFeatureClick: () => onMarkerClick(`area-${area.id}`),
        onFeatureHover: feature => onHover(feature ? `area-${area.id}` : null),
      }];
    });
    const boundary = normalizeMapBoundary(location?.boundary_geojson);
    if (boundary) layers.push({ id: 'home-selected-boundary', geojson: boundary,
      interactive: false, style: { color: '#80462f', weight: 2.5, fillOpacity: 0.02 } });
    return layers;
  }, [areas, location, layer, loading, hoveredId, onMarkerClick, onHover]);
  return <BaseMap center={[38.5, 23.8]} zoom={6} bounds={COUNTRY_BOUNDS} markers={markers}
    polygonLayers={polygons} clusterMarkers={detail && markers.length > 8} className="isolate h-full w-full"
    onMarkerClick={onMarkerClick} onMarkerHover={onHover} onViewportChange={onViewportChange}
    focusTarget={focusTarget} viewResetKey={viewResetKey} tileMode={tileMode}
    ariaLabel={label} showResetControl showFullscreenControl controlLabels={controlLabels} />;
}
