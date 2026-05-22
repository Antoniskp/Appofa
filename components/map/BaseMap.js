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
 *   interactive   {boolean}        – when false, disables all interaction
 *   onMapClick    {function}       – called with (lat, lng) when the map is clicked; enables picker mode
 *
 * Extension points for future work:
 *   - Pass `overlays` to render GeoJSON prefecture boundaries.
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

export default function BaseMap({
  center,
  zoom = 12,
  bounds,
  markers = [],
  overlays = [],
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

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      overlaysLayerRef.current = null;
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

  // Sync GeoJSON overlays (extension point for prefecture boundaries etc.)
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

  return <div ref={mapContainerRef} className={className} />;
}

