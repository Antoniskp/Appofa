'use client';

/**
 * BaseMap — a generic, reusable Leaflet/OpenStreetMap wrapper.
 *
 * Props:
 *   center        {[lat, lng]}     – map centre point (required)
 *   zoom          {number}         – initial zoom level (default 12)
 *   bounds        {{north,south,east,west}}  – if provided, the map fits to these bounds
 *   markers       {Array<{lat, lng, popup?, key?}>}  – list of marker objects
 *   overlays      {Array<object>}  – GeoJSON feature-collection objects (extension point)
 *   className     {string}         – wrapper class for sizing (default: 'h-64 w-full rounded-lg')
 *   scrollWheelZoom {boolean}      – enable/disable scroll-wheel zoom (default false)
 *   interactive   {boolean}        – when false, disables all interaction (future edit mode uses true)
 *
 * Extension points for future work:
 *   - Pass `overlays` to render GeoJSON prefecture boundaries.
 *   - Set `interactive={true}` + a click/drag callback for coordinate-picking in edit forms.
 *   - Add `onMarkerMove` prop for draggable markers in admin forms.
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

export default function BaseMap({
  center,
  zoom = 12,
  bounds,
  markers = [],
  overlays = [],
  className = 'h-64 w-full rounded-lg overflow-hidden',
  scrollWheelZoom = false,
  interactive = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    // Avoid double-initialisation in strict-mode / hot-reload
    if (mapInstanceRef.current) return;

    const leafletBounds = boundingBoxToLeaflet(bounds);

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

    // Tile layer — OpenStreetMap (free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Set view: prefer bounds, fall back to center+zoom
    if (leafletBounds) {
      map.fitBounds(leafletBounds, { padding: [20, 20] });
    } else if (center) {
      map.setView(center, zoom);
    }

    // Markers
    markers.forEach(({ lat, lng, popup }) => {
      const marker = L.marker([lat, lng], { icon: DEFAULT_ICON }).addTo(map);
      if (popup) {
        marker.bindPopup(popup);
      }
    });

    // GeoJSON overlays (extension point for prefecture boundaries etc.)
    overlays.forEach((geojson) => {
      if (geojson) {
        L.geoJSON(geojson, {
          style: {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.1,
          },
        }).addTo(map);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync bounds/center/zoom changes without full reinitialisation
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

  return <div ref={mapContainerRef} className={className} />;
}
