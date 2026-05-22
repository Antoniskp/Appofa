'use client';

/**
 * LocationPickerMap — an interactive coordinate picker built on BaseMap.
 *
 * Renders a Leaflet map where the user can:
 *   - click anywhere to place / move a marker
 *   - drag the existing marker to refine the point
 *
 * The map starts on Greece when no initial coordinates are provided.
 *
 * Props:
 *   lat       {number|string}  – current latitude  (may be '' or null for no initial marker)
 *   lng       {number|string}  – current longitude (may be '' or null for no initial marker)
 *   onChange  {function}       – called with { lat: number, lng: number } on every coordinate change
 *   className {string}         – override the map container class (default: 'h-64 w-full rounded-lg overflow-hidden')
 *
 * Architecture note:
 *   This component manages its own Leaflet marker directly rather than going through BaseMap's
 *   static `markers` array, because it needs a draggable marker with live drag callbacks.
 *   It still reuses BaseMap for the tile layer, attribution, and map initialisation logic.
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Same icon fix as BaseMap — webpack loses the default marker asset URLs.
const PICKER_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Default view: Greece centre
const GREECE_CENTER = [38.5, 23.8];
const GREECE_ZOOM = 6;

function isValidCoord(value, min, max) {
  if (value == null || value === '') return false;
  const n = Number(value);
  return isFinite(n) && n >= min && n <= max;
}

export default function LocationPickerMap({ lat, lng, onChange, className }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const hasCoords =
    isValidCoord(lat, -90, 90) && isValidCoord(lng, -180, 180);

  // Initialise the map once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

    // CARTO Positron — same tile provider as BaseMap for visual consistency
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    map.attributionControl.setPrefix(false);

    // Set initial view
    if (hasCoords) {
      map.setView([Number(lat), Number(lng)], 13);
    } else {
      map.setView(GREECE_CENTER, GREECE_ZOOM);
    }

    // Place initial marker if coordinates exist
    if (hasCoords) {
      const marker = L.marker([Number(lat), Number(lng)], {
        icon: PICKER_ICON,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current({ lat: pos.lat, lng: pos.lng });
      });

      markerRef.current = marker;
    }

    // Click on map → place / move marker
    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        const marker = L.marker([clickLat, clickLng], {
          icon: PICKER_ICON,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChangeRef.current({ lat: pos.lat, lng: pos.lng });
        });

        markerRef.current = marker;
      }

      onChangeRef.current({ lat: clickLat, lng: clickLng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker position in sync when parent lat/lng change externally
  // (e.g. when a user types into the number inputs directly)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isValidCoord(lat, -90, 90) && isValidCoord(lng, -180, 180)) {
      const pos = [Number(lat), Number(lng)];
      if (markerRef.current) {
        markerRef.current.setLatLng(pos);
      } else {
        const marker = L.marker(pos, { icon: PICKER_ICON, draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const p = marker.getLatLng();
          onChangeRef.current({ lat: p.lat, lng: p.lng });
        });
        markerRef.current = marker;
      }
      map.setView(pos, Math.max(map.getZoom(), 10));
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [lat, lng]);

  return (
    <div>
      <div
        ref={containerRef}
        className={className || 'h-64 w-full rounded-lg overflow-hidden'}
      />
      <p className="mt-1 text-xs text-gray-400">
        Κάνε κλικ στον χάρτη για να ορίσεις συντεταγμένες, ή σύρε το pin για να το μετακινήσεις.
      </p>
    </div>
  );
}
