'use client';

/**
 * BaseMap — a generic, reusable Leaflet/OpenStreetMap wrapper.
 *
 * Props:
 *   center        {[lat, lng]}     – map centre point (required)
 *   zoom          {number}         – initial zoom level (default 12)
 *   bounds        {{north,south,east,west}}  – if provided, the map fits to these bounds
 *   markers       {Array<{lat, lng, popup?, key?}>}  – list of marker objects
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
 *     hoverStyle:       object,   – PathOptions applied on mouseover
 *     getTooltip:       (props) => string | null,  – HTML string for hover tooltip
 *     getPopup:         (props) => string | null,  – HTML string for click popup
 *     fitBoundsOnClick: boolean,  – auto-fit map to feature bounds on click (default true)
 *     onFeatureClick:   (feature) => void,  – optional callback after click
 *   }
 *
 * Designed for:
 *   - Prefecture / electoral-district / municipality boundary layers
 *   - Future choropleth coloring (override `style.fillColor` per feature via `styleFeature` fn)
 *   - Drill-down navigation (handle `onFeatureClick` to route to location pages)
 *
 * Extension points for future work:
 *   - Pass `overlays` to render GeoJSON prefecture boundaries (simple, non-interactive).
 *   - Use `onMapClick` + a draggable-marker wrapper (LocationPickerMap) for coordinate-picking.
 *
 * Tile provider: CARTO Positron (light_all) — clean white design, free for non-commercial use.
 * Attribution: © OpenStreetMap contributors © CARTO (required; kept minimal via setPrefix).
 */

import { useEffect, useRef } from 'react';
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

export default function BaseMap({
  center,
  zoom = 12,
  bounds,
  markers = [],
  overlays = [],
  polygonLayers = [],
  className = 'h-64 w-full rounded-lg overflow-hidden',
  scrollWheelZoom = false,
  interactive = true,
  onMapClick,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  // Layer groups for dynamic updates
  const markersLayerRef = useRef(null);
  const overlaysLayerRef = useRef(null);
  const polyLayersGroupRef = useRef(null);  // dedicated group for interactive polygon layers
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

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
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

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
    };
  }, []);  // Empty deps: map is initialised once; scrollWheelZoom/interactive aren't reactive

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
    markers.forEach(({ lat, lng, popup }) => {
      const marker = L.marker([lat, lng], { icon: DEFAULT_ICON }).addTo(layer);
      if (popup) {
        marker.bindPopup(popup);
      }
    });
  }, [markers]);

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
      const hoverStyle = layerDef.hoverStyle || DEFAULT_POLY_HOVER_STYLE;
      const fitOnClick = layerDef.fitBoundsOnClick !== false; // default true

      const geoLayer = L.geoJSON(layerDef.geojson, {
        // styleFeature hook: callers can swap this for choropleth coloring later.
        // For now use the static baseStyle for every feature.
        style: () => ({ ...baseStyle }),

        onEachFeature: (feature, featureLayer) => {
          const props = feature.properties || {};

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
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              featureLayer.bringToFront();
            }
          });

          // Mouseout: reset to base style
          featureLayer.on('mouseout', () => {
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
    });
  }, [polygonLayers]);

  return <div ref={mapContainerRef} className={className} />;
}

