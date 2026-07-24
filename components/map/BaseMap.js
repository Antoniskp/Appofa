'use client';

/**
 * BaseMap — a generic, reusable Leaflet/OpenStreetMap wrapper.
 *
 * Props:
 *   center        {[lat, lng]}     – map centre point (required)
 *   zoom          {number}         – initial zoom level (default 12)
 *   bounds        {{north,south,east,west}}  – if provided, the map fits to these bounds
 *   markers       {Array<{lat, lng, popup?, key?}>}  – list of marker objects
 *   clusterMarkers {boolean}     – group nearby markers into count bubbles (default false)
 *   clusterRadius  {number}      – grouping radius in screen pixels (default 44)
 *   overlays      {Array<object>}  – GeoJSON feature-collection objects (legacy extension point; no interactivity)
 *   polygonLayers {Array<PolygonLayerDef>} – interactive polygon/boundary layers with hover, tooltip, popup, click-to-zoom
 *   className     {string}         – wrapper class for sizing (default: 'h-64 w-full rounded-lg')
 *   scrollWheelZoom {boolean}      – enable/disable scroll-wheel zoom (default false)
 *   interactive   {boolean}        – when false, disables all interaction
 *   onMapClick    {function}       – called with (lat, lng) when the map is clicked; enables picker mode
 *
 * PolygonLayerDef shape:
 *   {
 *     id:               string,   – unique key (required for React reconciliation)
 *     geojson:          object,   – GeoJSON FeatureCollection or Feature
 *     style:            object,   – default Leaflet PathOptions
 *     styleFeature:     (feature, defaultStyle) => PathOptions, – optional per-feature style
 *     hoverStyle:       object,   – PathOptions applied on mouseover
 *     getTooltip:       (props) => string | null,  – HTML string for hover tooltip
 *     getPopup:         (props) => string | null,  – HTML string for click popup
 *     fitBoundsOnClick: boolean,  – auto-fit map to feature bounds on click (default true)
 *     onFeatureClick:   (feature) => void,  – optional callback after click
 *     onFeatureHover:   (feature | null) => void, – optional callback on mouseover/mouseout
 *     onLayerInit:      (controls) => void, – called after layer is built; controls: { highlight(slug), unhighlight(slug) }
 *                        Use to imperatively apply hover styles from outside the map (e.g. pill hover).
 *   }
 *
 * Marker shape (extended):
 *   {
 *     lat:      number,
 *     lng:      number,
 *     popup?:   string,    – HTML for click popup
 *     tooltip?: string,    – HTML for hover tooltip
 *     id?:      string,    – identifier for hover linking
 *     variant?: 'default' | 'hovered' | 'selected', – icon variant (uses DivIcon circles)
 *   }
 *
 * Extra BaseMap props:
 *   onMarkerHover    {function(id | null)}  – called when a marker is hovered/un-hovered (requires marker.id)
 *   onMarkerClick    {function(id)}        – called when a marker is clicked (requires marker.id)
 *   onMarkersReady   {function(controls)}  – called after markers are built; controls: { highlight(id), unhighlight(id, variant) }
 *
 * Designed for:
 *   - Prefecture / electoral-district / municipality boundary layers
 *   - Future choropleth coloring (by extending PolygonLayerDef with a per-feature style callback)
 *   - Drill-down navigation (handle `onFeatureClick` to route to location pages)
 *
 * Extension points for future work:
 *   - Pass `overlays` to render GeoJSON prefecture boundaries (simple, non-interactive).
 *   - Use `onMapClick` + a draggable-marker wrapper (LocationPickerMap) for coordinate-picking.
 *
 * Tile provider: CARTO Positron (light_all) — clean white design, free for non-commercial use.
 * Attribution: © OpenStreetMap contributors © CARTO (required; kept minimal via setPrefix).
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's bundled default marker icon paths broken by webpack/next.js module resolution.
// This is a well-known issue: webpack inlines or renames the PNG assets so the default
// auto-detected URL is wrong.  We point the URLs at Leaflet's own dist folder served from
// node_modules via the public URL (or an unpkg CDN fallback).
const DEFAULT_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const TILE_MODES = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  },
  political: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
};

function getTileModeConfig(tileMode) {
  return TILE_MODES[tileMode] || TILE_MODES.light;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSafeHref(href) {
  if (!href) return null;
  const value = String(href);
  if (value.startsWith('/') || value.startsWith('#')) return value;
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Convert a bounding-box object {north, south, east, west} to a Leaflet LatLngBounds.
 * Returns null if the input is invalid.
 */
function boundingBoxToLeaflet(bb) {
  if (!bb || typeof bb !== 'object') return null;
  const { north, south, east, west } = bb;
  if ([north, south, east, west].some((v) => v == null || isNaN(Number(v)))) return null;
  return L.latLngBounds(
    [Number(south), Number(west)],
    [Number(north), Number(east)]
  );
}

// Default styles for interactive polygon layers (boundary mode)
const DEFAULT_POLY_STYLE = {
  color: '#3b82f6',
  weight: 1.5,
  opacity: 0.7,
  fillColor: '#3b82f6',
  fillOpacity: 0.08,
};

const DEFAULT_POLY_HOVER_STYLE = {
  color: '#1d4ed8',
  weight: 2.5,
  opacity: 1,
  fillColor: '#3b82f6',
  fillOpacity: 0.22,
};

// DivIcon circle markers used in explorer/fallback mode (variant-based).
// Lazy-initialized so they are created only when Leaflet is fully ready,
// which avoids "L.divIcon is not a function" errors in test environments
// where the Leaflet mock may not include divIcon.
const _explorerIcons = {};

function resolveMarkerIcon(variant, iconColor) {
  if (!L.divIcon) {
    // Fallback when Leaflet mock does not provide divIcon (e.g. in jest)
    return DEFAULT_ICON;
  }
  if (iconColor) {
    const cacheKey = `${variant || 'default'}:${iconColor}`;
    if (!_explorerIcons[cacheKey]) {
      const size = variant === 'hovered' || variant === 'selected' ? 18 : 14;
      _explorerIcons[cacheKey] = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${escapeHtml(iconColor)};border:2px solid #fff;box-shadow:0 2px 7px rgba(15,23,42,0.42)"></div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -12],
        tooltipAnchor: [size / 2, -8],
      });
    }
    return _explorerIcons[cacheKey];
  }
  if (variant === 'hovered') {
    if (!_explorerIcons.hovered) {
      _explorerIcons.hovered = L.divIcon({
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#1d4ed8;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>',
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -12],
        tooltipAnchor: [8, -8],
      });
    }
    return _explorerIcons.hovered;
  }
  if (variant === 'selected') {
    if (!_explorerIcons.selected) {
      _explorerIcons.selected = L.divIcon({
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#1e40af;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>',
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        popupAnchor: [0, -12],
        tooltipAnchor: [8, -8],
      });
    }
    return _explorerIcons.selected;
  }
  if (variant === 'explorer') {
    if (!_explorerIcons.explorer) {
      _explorerIcons.explorer = L.divIcon({
        html: '<div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -10],
        tooltipAnchor: [6, -6],
      });
    }
    return _explorerIcons.explorer;
  }
  return DEFAULT_ICON;
}

function resolveClusterIcon(count) {
  if (!L.divIcon) return DEFAULT_ICON;
  const size = count >= 100 ? 44 : count >= 10 ? 38 : 32;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#fff;border:2px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,0.35);font-size:13px;font-weight:700">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
    tooltipAnchor: [size / 2, -size / 2],
  });
}

function buildClusterPopup(clusterMarkers) {
  const visible = clusterMarkers.slice(0, 8);
  const remainingCount = clusterMarkers.length - visible.length;
  const items = visible
    .map((marker) => {
      const label = escapeHtml(marker.label || marker.tooltip || marker.id || 'Marker');
      const href = getSafeHref(marker.href);
      const source = href
        ? `<a href="${escapeHtml(href)}" style="color:#1d4ed8;text-decoration:none;font-weight:600">${label}</a>`
        : `<span style="font-weight:600">${label}</span>`;
      const meta = marker.meta ? `<div style="font-size:11px;color:#64748b;margin-top:1px">${escapeHtml(marker.meta)}</div>` : '';
      return `<li style="margin:4px 0">${source}${meta}</li>`;
    })
    .join('');
  const remaining = remainingCount > 0
    ? `<li><strong>+${remainingCount} more</strong></li>`
    : '';

  return `<div><strong>${clusterMarkers.length} markers in this area</strong><ul style="margin:6px 0 0;padding-left:18px">${items}${remaining}</ul><div style="font-size:11px;color:#64748b;margin-top:8px">Click the cluster to zoom in.</div></div>`;
}

function getMarkerClusters(markers, map, radius, fallbackZoom) {
  if (!map || typeof map.project !== 'function' || typeof L.latLng !== 'function') {
    return markers.map((marker) => ({
      lat: marker.lat,
      lng: marker.lng,
      markers: [marker],
    }));
  }

  const currentZoom = typeof map.getZoom === 'function' ? map.getZoom() : fallbackZoom;
  const clusters = [];

  markers.forEach((marker) => {
    const point = map.project(L.latLng(marker.lat, marker.lng), currentZoom);
    const existingCluster = clusters.find((cluster) => {
      if (typeof point.distanceTo === 'function') {
        return point.distanceTo(cluster.point) <= radius;
      }
      const dx = point.x - cluster.point.x;
      const dy = point.y - cluster.point.y;
      return Math.sqrt((dx * dx) + (dy * dy)) <= radius;
    });

    if (existingCluster) {
      existingCluster.markers.push(marker);
      existingCluster.lat = existingCluster.markers.reduce((sum, item) => sum + Number(item.lat), 0) / existingCluster.markers.length;
      existingCluster.lng = existingCluster.markers.reduce((sum, item) => sum + Number(item.lng), 0) / existingCluster.markers.length;
      existingCluster.point = map.project(L.latLng(existingCluster.lat, existingCluster.lng), currentZoom);
    } else {
      clusters.push({
        lat: Number(marker.lat),
        lng: Number(marker.lng),
        point,
        markers: [marker],
      });
    }
  });

  return clusters;
}

export default function BaseMap({
  center,
  zoom = 12,
  bounds,
  markers = [],
  clusterMarkers = false,
  clusterRadius = 44,
  overlays = [],
  polygonLayers = [],
  className = 'h-64 w-full rounded-lg overflow-hidden',
  scrollWheelZoom = false,
  interactive = true,
  tileMode = 'light',
  showFullscreenControl = false,
  onMapClick,
  onMarkerHover,
  onMarkerClick,
  onMarkersReady,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  // Layer groups for dynamic updates
  const markersLayerRef = useRef(null);
  const overlaysLayerRef = useRef(null);
  const polyLayersGroupRef = useRef(null);  // dedicated group for interactive polygon layers
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onMarkerHoverRef = useRef(onMarkerHover);
  onMarkerHoverRef.current = onMarkerHover;
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const onMarkersReadyRef = useRef(onMarkersReady);
  onMarkersReadyRef.current = onMarkersReady;
  const tileLayerRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialise the map once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom,
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });

    mapInstanceRef.current = map;

    // Tile layer — CARTO Positron (clean light design, free for non-commercial use).
    // Attribution is required by both OSM (ODbL) and CARTO's terms of service.
    // We remove the default "Leaflet" prefix to keep it minimal while staying compliant.
    const initialTile = getTileModeConfig(tileMode);
    tileLayerRef.current = L.tileLayer(initialTile.url, initialTile).addTo(map);

    // Remove the default "Leaflet" prefix — attribution links remain (legally required).
    map.attributionControl?.setPrefix(false);

    // Wire up map-click for picker mode (only if a callback is provided)
    map.on('click', (e) => {
      if (onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    // Layer groups allow clean updates without re-creating the whole map
    markersLayerRef.current = L.layerGroup().addTo(map);
    overlaysLayerRef.current = L.layerGroup().addTo(map);
    polyLayersGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      overlaysLayerRef.current = null;
      polyLayersGroupRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);  // Empty deps: map is initialised once; scrollWheelZoom/interactive aren't reactive

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;
    const nextTile = getTileModeConfig(tileMode);
    map.removeLayer?.(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(nextTile.url, nextTile).addTo(map);
    map.attributionControl?.setPrefix(false);
  }, [tileMode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const timeout = setTimeout(() => {
      map.invalidateSize?.();
    }, 40);
    return () => clearTimeout(timeout);
  }, [isExpanded]);

  // Sync bounds / center / zoom whenever they change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const leafletBounds = boundingBoxToLeaflet(bounds);
    if (leafletBounds) {
      map.fitBounds(leafletBounds, { padding: [20, 20] });
    } else if (center) {
      map.setView(center, zoom);
    }
  }, [bounds, center, zoom]);

  // Sync markers whenever the markers array changes
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    // id → L.marker map for external highlight controls
    const idToMarker = new Map();

    const map = mapInstanceRef.current;

    function renderSingleMarker({ lat, lng, popup, tooltip, id, variant, iconColor }) {
      const icon = resolveMarkerIcon(variant, iconColor);
      const marker = L.marker([lat, lng], { icon }).addTo(layer);
      if (popup) {
        marker.bindPopup(popup, { maxWidth: 260 });
      }
      if (tooltip) {
        marker.bindTooltip(tooltip, {
          sticky: true,
          direction: 'top',
          offset: [0, -4],
          className: 'leaflet-boundary-tooltip',
        });
      }
      if (id) {
        idToMarker.set(id, marker);
        if (onMarkerHoverRef.current) {
          marker.on('mouseover', () => onMarkerHoverRef.current(id));
          marker.on('mouseout', () => onMarkerHoverRef.current(null));
        }
        if (onMarkerClickRef.current) {
          marker.on('click', () => onMarkerClickRef.current(id));
        }
      }
    }

    function renderCluster(cluster) {
      if (cluster.markers.length === 1) {
        renderSingleMarker(cluster.markers[0]);
        return;
      }

      const clusterMarker = L.marker([cluster.lat, cluster.lng], {
        icon: resolveClusterIcon(cluster.markers.length),
      }).addTo(layer);

      clusterMarker.bindPopup(buildClusterPopup(cluster.markers), { maxWidth: 300 });
      clusterMarker.bindTooltip(`${cluster.markers.length} markers`, {
        sticky: true,
        direction: 'top',
        offset: [0, -4],
        className: 'leaflet-boundary-tooltip',
      });

      clusterMarker.on('click', () => {
        if (!map || typeof map.getZoom !== 'function' || typeof map.setView !== 'function') return;
        const currentZoom = map.getZoom();
        const maxZoom = typeof map.getMaxZoom === 'function' ? map.getMaxZoom() : 20;
        if (currentZoom < Math.min(maxZoom, 18)) {
          const nextZoom = currentZoom + 2;
          if (cluster.markers.length > 1 && typeof L.latLngBounds === 'function' && typeof map.fitBounds === 'function') {
            const markerBounds = L.latLngBounds(cluster.markers.map((marker) => [marker.lat, marker.lng]));
            if (markerBounds?.isValid?.()) {
              map.fitBounds(markerBounds, { padding: [32, 32], maxZoom: nextZoom });
              return;
            }
          }
          map.setView([cluster.lat, cluster.lng], nextZoom);
        }
      });
    }

    function renderMarkers() {
      layer.clearLayers();
      idToMarker.clear();

      if (clusterMarkers) {
        getMarkerClusters(markers, map, clusterRadius, zoom).forEach(renderCluster);
      } else {
        markers.forEach(renderSingleMarker);
      }
    }

    renderMarkers();

    if (clusterMarkers && map && typeof map.on === 'function') {
      map.on('zoomend', renderMarkers);
    }

    // Expose imperative controls for external hover management (e.g. pill hover → marker icon)
    if (onMarkersReadyRef.current) {
      onMarkersReadyRef.current({
        highlight: (id) => {
          const marker = idToMarker.get(id);
          const markerDef = markers.find((item) => item.id === id);
          if (marker) marker.setIcon(resolveMarkerIcon('hovered', markerDef?.iconColor));
        },
        unhighlight: (id, variant = 'default') => {
          const marker = idToMarker.get(id);
          const markerDef = markers.find((item) => item.id === id);
          if (marker) marker.setIcon(resolveMarkerIcon(variant, markerDef?.iconColor));
        },
      });
    }

    return () => {
      if (clusterMarkers && map && typeof map.off === 'function') {
        map.off('zoomend', renderMarkers);
      }
    };
  }, [markers, clusterMarkers, clusterRadius, zoom]);

  // Sync GeoJSON overlays (legacy extension point for simple, non-interactive boundaries)
  useEffect(() => {
    const layer = overlaysLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    overlays.forEach((geojson) => {
      if (geojson) {
        L.geoJSON(geojson, {
          style: {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.1,
          },
        }).addTo(layer);
      }
    });
  }, [overlays]);

  // Sync interactive polygon layers (boundary mode with hover, click-to-zoom, tooltip, popup).
  // Each entry in polygonLayers is a PolygonLayerDef (see JSDoc at top of file).
  // Extension point: to support choropleth coloring, replace the static `style` object with
  //   a `styleFeature(feature) => PathOptions` function passed in the layer def.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = polyLayersGroupRef.current;
    if (!map || !group) return;
    group.clearLayers();

    polygonLayers.forEach((layerDef) => {
      if (!layerDef || !layerDef.geojson) return;

      const baseStyle = layerDef.style || DEFAULT_POLY_STYLE;
      const styleFeature = typeof layerDef.styleFeature === 'function'
        ? layerDef.styleFeature
        : null;
      const hoverStyle = layerDef.hoverStyle || DEFAULT_POLY_HOVER_STYLE;
      const fitOnClick = layerDef.fitBoundsOnClick !== false; // default true

      // slug/id → featureLayer map for onLayerInit controls
      const slugToLayer = new Map();

      const geoLayer = L.geoJSON(layerDef.geojson, {
        style: (feature) => {
          if (!styleFeature) return baseStyle;
          const nextStyle = styleFeature(feature, baseStyle);
          return nextStyle && typeof nextStyle === 'object' ? nextStyle : baseStyle;
        },

        onEachFeature: (feature, featureLayer) => {
          const props = feature.properties || {};

          // Track featureId → featureLayer for onLayerInit imperative controls
          const featureId = typeof layerDef.getFeatureId === 'function'
            ? layerDef.getFeatureId(feature)
            : (props.slug || props.id || props.code);
          if (featureId) slugToLayer.set(featureId, featureLayer);

          // Hover tooltip (shown while the pointer is over the feature)
          if (layerDef.getTooltip) {
            const tooltipContent = layerDef.getTooltip(props);
            if (tooltipContent) {
              featureLayer.bindTooltip(tooltipContent, {
                sticky: true,
                direction: 'top',
                offset: [0, -4],
                className: 'leaflet-boundary-tooltip',
              });
            }
          }

          // Click popup (shown after clicking the feature)
          if (layerDef.getPopup) {
            const popupContent = layerDef.getPopup(props);
            if (popupContent) {
              featureLayer.bindPopup(popupContent, { maxWidth: 260 });
            }
          }

          // Hover: highlight + bring to front
          featureLayer.on('mouseover', () => {
            featureLayer.setStyle(hoverStyle);
            // bringToFront is not supported by all renderers; swallow silently
            try { featureLayer.bringToFront(); } catch (_) { /* no-op */ }
            if (layerDef.onFeatureHover) {
              layerDef.onFeatureHover(feature);
            }
          });

          // Mouseout: fire onFeatureHover(null) BEFORE resetStyle so that
          // any styleFeature callback that reads a ref-based hover state sees
          // the cleared value when resetStyle computes the restored style.
          featureLayer.on('mouseout', () => {
            if (layerDef.onFeatureHover) {
              layerDef.onFeatureHover(null);
            }
            geoLayer.resetStyle(featureLayer);
          });

          // Click: fit to feature bounds, open popup, fire optional callback
          featureLayer.on('click', () => {
            if (fitOnClick) {
              const bounds = featureLayer.getBounds();
              if (bounds && bounds.isValid()) {
                map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
              }
            }
            if (layerDef.onFeatureClick) {
              layerDef.onFeatureClick(feature);
            }
          });
        },
      });

      geoLayer.addTo(group);

      // Expose imperative controls after layer is built so callers can apply
      // external highlight (e.g. pill hover → polygon highlight) without
      // rebuilding the whole layer.
      if (typeof layerDef.onLayerInit === 'function') {
        layerDef.onLayerInit({
          highlight: (id) => {
            const fl = slugToLayer.get(id);
            if (fl) {
              fl.setStyle(hoverStyle);
              try { fl.bringToFront(); } catch (_) { /* no-op */ }
            }
          },
          unhighlight: (id) => {
            const fl = slugToLayer.get(id);
            if (fl) {
              geoLayer.resetStyle(fl);
            }
          },
        });
      }
    });
  }, [polygonLayers]);

  const wrapperClassName = isExpanded
    ? 'fixed inset-3 z-[2000] rounded-xl bg-white p-2 shadow-2xl'
    : `relative ${className}`;

  return (
    <div className={wrapperClassName}>
      <div
        ref={mapContainerRef}
        className={isExpanded ? 'h-full w-full rounded-lg overflow-hidden' : 'h-full w-full'}
      />
      {showFullscreenControl && (
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="absolute right-3 top-3 z-[1000] rounded-md border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          aria-pressed={isExpanded}
        >
          {isExpanded ? 'Close map' : 'Expand map'}
        </button>
      )}
    </div>
  );
}
