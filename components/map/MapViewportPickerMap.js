'use client';

/**
 * MapViewportPickerMap — an interactive map viewport picker.
 *
 * Shows a Leaflet map with a centred crosshair. The user pans and zooms to the
 * desired default view for a location. Whenever the view settles (moveend /
 * zoomend), the component calls onChange({ lat, lng, zoom }) so the parent can
 * persist the new values.
 *
 * Props:
 *   lat       {number|string}  – initial centre latitude  (defaults to Greece centre)
 *   lng       {number|string}  – initial centre longitude (defaults to Greece centre)
 *   zoom      {number|string}  – initial zoom level        (defaults to 7)
 *   onChange  {function}       – called with { lat: number, lng: number, zoom: number }
 *   className {string}         – override the map container div class
 *
 * Architecture note:
 *   Like LocationPickerMap this component manages Leaflet directly (not through
 *   BaseMap) so it can attach moveend/zoomend listeners without interfering with
 *   BaseMap's own layer management.
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default view: Greece centre
const GREECE_CENTER = [38.5, 23.8];
const GREECE_ZOOM = 7;

function isValidCoord(value, min, max) {
  if (value == null || value === '') return false;
  const n = Number(value);
  return isFinite(n) && n >= min && n <= max;
}

function isValidZoom(value) {
  if (value == null || value === '') return false;
  const n = Number(value);
  return isFinite(n) && n >= 1 && n <= 18;
}

export default function MapViewportPickerMap({ lat, lng, zoom, onChange, className }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Capture initial prop values for map initialisation (run once on mount).
  const initLatRef = useRef(lat);
  const initLngRef = useRef(lng);
  const initZoomRef = useRef(zoom);

  // Initialise the Leaflet map exactly once on mount.
  // Prop changes after mount are handled by the sync useEffect below.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasCenter =
      isValidCoord(initLatRef.current, -90, 90) &&
      isValidCoord(initLngRef.current, -180, 180);
    const initialCenter = hasCenter
      ? [Number(initLatRef.current), Number(initLngRef.current)]
      : GREECE_CENTER;
    const initialZoom = isValidZoom(initZoomRef.current)
      ? Number(initZoomRef.current)
      : GREECE_ZOOM;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    });

    // CARTO Positron — same tile provider as BaseMap for visual consistency
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    map.attributionControl?.setPrefix(false);
    map.setView(initialCenter, initialZoom);

    const reportChange = () => {
      const center = map.getCenter();
      onChangeRef.current({
        lat: parseFloat(center.lat.toFixed(6)),
        lng: parseFloat(center.lng.toFixed(6)),
        zoom: map.getZoom(),
      });
    };

    map.on('moveend', reportChange);
    map.on('zoomend', reportChange);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Intentionally empty deps: Leaflet map must only be initialised once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep map view in sync when parent values change externally
  // (e.g. when the user edits the numeric inputs directly).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isValidCoord(lat, -90, 90) || !isValidCoord(lng, -180, 180)) return;

    const targetCenter = [Number(lat), Number(lng)];
    const targetZoom = isValidZoom(zoom) ? Number(zoom) : map.getZoom();
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // Only update if values differ meaningfully to avoid feedback loops
    const latDiff = Math.abs(Number(lat) - currentCenter.lat);
    const lngDiff = Math.abs(Number(lng) - currentCenter.lng);
    if (latDiff > 0.00001 || lngDiff > 0.00001 || currentZoom !== targetZoom) {
      map.setView(targetCenter, targetZoom);
    }
  }, [lat, lng, zoom]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={className || 'h-64 w-full rounded-lg overflow-hidden'}
      />
      {/* Centred crosshair — indicates the point that will be saved */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="opacity-70 drop-shadow"
          aria-hidden="true"
        >
          <line x1="16" y1="4" x2="16" y2="28" stroke="#1d4ed8" strokeWidth="2" />
          <line x1="4" y1="16" x2="28" y2="16" stroke="#1d4ed8" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" fill="none" stroke="#1d4ed8" strokeWidth="2" />
        </svg>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Σύρε και κάνε zoom στον χάρτη για να ορίσεις την προεπιλεγμένη προβολή. Ο σταυρός δείχνει το κέντρο.
      </p>
    </div>
  );
}
