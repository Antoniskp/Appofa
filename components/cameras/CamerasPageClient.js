'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  MapPinIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { locationSectionAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

const GREECE_CENTER = [38.5, 23.8];
const GREECE_ZOOM = 6;

function isValidCoord(value, min, max) {
  if (value == null || value === '') return false;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= min && numericValue <= max;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLocationLabel(location) {
  if (!location) return '';
  return location.name_local || location.name || '';
}

function hasMapLocation(camera) {
  return camera?.mapLocation
    && isValidCoord(camera.mapLocation.lat, -90, 90)
    && isValidCoord(camera.mapLocation.lng, -180, 180);
}

function getSafeCameraUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function getEmbedTypeLabel(camera, t) {
  if (camera.embedType === 'image') return t('badge_image');
  if (camera.embedType === 'iframe') return t('badge_iframe');
  return t('badge_live_link');
}

function buildCameraPopup(camera, t) {
  const cameraLabel = escapeHtml(camera.label);
  const mapLocationLabel = escapeHtml(getLocationLabel(camera.mapLocation));
  const openCameraLabel = escapeHtml(t('open_camera'));
  const locationLabel = escapeHtml(t('map_popup_location'));
  const pinTypeLabel = escapeHtml(
    camera.mapLocationSource === 'camera' ? t('pin_source_exact') : t('pin_source_source')
  );
  const embedTypeLabel = escapeHtml(getEmbedTypeLabel(camera, t));
  const safeUrl = getSafeCameraUrl(camera.url);
  const safeLocationSlug = camera.mapLocation?.slug ? escapeHtml(camera.mapLocation.slug) : '';
  const viewLocationLabel = escapeHtml(t('view_location'));

  const locationLink = safeLocationSlug
    ? `<a href="/locations/${safeLocationSlug}" class="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 hover:underline">${viewLocationLabel}</a>`
    : '';

  const cameraLink = safeUrl
    ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">${openCameraLabel}</a>`
    : '';

  return `
    <div class="space-y-2">
      <div>
        <p class="text-sm font-semibold text-gray-900">${cameraLabel}</p>
        ${mapLocationLabel ? `<p class="mt-0.5 text-xs text-gray-600">${locationLabel}: ${mapLocationLabel}</p>` : ''}
      </div>
      <div class="flex flex-wrap gap-1.5">
        <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">${pinTypeLabel}</span>
        <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">${embedTypeLabel}</span>
      </div>
      ${(cameraLink || locationLink) ? `<div class="flex flex-wrap gap-2">${cameraLink}${locationLink}</div>` : ''}
    </div>
  `;
}

function buildCameraMarkers(cameras, t, highlightedMarkerId = null) {
  return cameras.flatMap((camera) => {
    if (!hasMapLocation(camera)) {
      return [];
    }

    const mapLocation = camera.mapLocation;
    const label = escapeHtml(camera.label);

    return [{
      id: camera.id,
      lat: Number(mapLocation.lat),
      lng: Number(mapLocation.lng),
      popup: buildCameraPopup(camera, t),
      tooltip: label,
      variant: camera.id === highlightedMarkerId ? 'hovered' : 'explorer',
    }];
  });
}

function getMapBounds(markers) {
  if (markers.length === 0) return null;
  return {
    north: Math.max(...markers.map((marker) => marker.lat)),
    south: Math.min(...markers.map((marker) => marker.lat)),
    east: Math.max(...markers.map((marker) => marker.lng)),
    west: Math.min(...markers.map((marker) => marker.lng)),
  };
}

function CameraCard({ camera, t, isHighlighted, onHoverChange, onShowOnMap }) {
  const associatedLocation = camera.location;
  const sourceLocation = camera.sourceLocation;
  const showSourceLocation = sourceLocation && (!associatedLocation || associatedLocation.id !== sourceLocation.id);
  const mapLocationAvailable = hasMapLocation(camera);
  const safeCameraUrl = getSafeCameraUrl(camera.url);

  const previewIsImage = camera.embedType === 'image';

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${isHighlighted ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}
      onMouseEnter={() => onHoverChange(camera.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      {previewIsImage ? (
        <img
          src={camera.url}
          alt={camera.label}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
          <div className="flex flex-col items-center gap-3 text-blue-700">
            <VideoCameraIcon className="h-12 w-12" />
            <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {camera.embedType === 'iframe' ? 'iframe' : 'live'}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{camera.label}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {mapLocationAvailable ? t('map_available') : t('map_unavailable')}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <VideoCameraIcon className="mr-1 h-4 w-4" />
              {t('camera_badge')}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {getEmbedTypeLabel(camera, t)}
            </span>
            {mapLocationAvailable && (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${camera.mapLocationSource === 'camera' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {camera.mapLocationSource === 'camera' ? t('pin_source_exact') : t('pin_source_source')}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          {associatedLocation && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 h-4 w-4 text-blue-500" />
              <div>
                <p className="font-medium text-gray-700">{t('associated_location')}</p>
                {associatedLocation.slug ? (
                  <Link href={`/locations/${associatedLocation.slug}`} className="text-blue-600 hover:underline">
                    {getLocationLabel(associatedLocation)}
                  </Link>
                ) : (
                  <span>{getLocationLabel(associatedLocation)}</span>
                )}
              </div>
            </div>
          )}

          {showSourceLocation && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="font-medium text-gray-700">{t('source_location')}</p>
                {sourceLocation.slug ? (
                  <Link href={`/locations/${sourceLocation.slug}`} className="text-blue-600 hover:underline">
                    {getLocationLabel(sourceLocation)}
                  </Link>
                ) : (
                  <span>{getLocationLabel(sourceLocation)}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {safeCameraUrl && (
            <a
              href={safeCameraUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              {t('open_camera')}
            </a>
          )}
          {mapLocationAvailable && (
            <button
              type="button"
              onClick={() => onShowOnMap(camera.id)}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <MapPinIcon className="h-4 w-4" />
              {t('show_on_map')}
            </button>
          )}
          {camera.mapLocation?.slug && (
            <Link
              href={`/locations/${camera.mapLocation.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <MapPinIcon className="h-4 w-4" />
              {t('view_location')}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default function CamerasPageClient() {
  const t = useTranslations('cameras');
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [focusedMarkerId, setFocusedMarkerId] = useState(null);
  const mapControlsRef = useRef(null);
  const mapSectionRef = useRef(null);
  const {
    data: cameras,
    loading,
    error,
    refetch,
  } = useAsyncData(
    async () => {
      const response = await locationSectionAPI.getAllCameras();
      if (!response?.success) {
        throw new Error(response?.message || t('load_error_description'));
      }
      return response.cameras || [];
    },
    [],
    { initialData: [] }
  );

  const allCameras = cameras || [];
  const filteredCameras = useMemo(() => {
    if (activeFilter === 'mapped') {
      return allCameras.filter((camera) => hasMapLocation(camera));
    }
    if (activeFilter === 'exact') {
      return allCameras.filter((camera) => hasMapLocation(camera) && camera.mapLocationSource === 'camera');
    }
    if (activeFilter === 'image') {
      return allCameras.filter((camera) => camera.embedType === 'image');
    }
    if (activeFilter === 'live') {
      return allCameras.filter((camera) => camera.embedType !== 'image');
    }
    return allCameras;
  }, [activeFilter, allCameras]);

  const highlightedMarkerId = hoveredCardId || hoveredMarkerId || focusedMarkerId || null;
  const markers = buildCameraMarkers(filteredCameras, t, highlightedMarkerId);
  const bounds = getMapBounds(markers);
  const mapCenter = markers.length > 0
    ? [markers[0].lat, markers[0].lng]
    : GREECE_CENTER;
  const unmappedCount = filteredCameras.length - markers.length;

  const filters = [
    { id: 'all', label: t('filter_all') },
    { id: 'mapped', label: t('filter_mapped') },
    { id: 'exact', label: t('filter_exact') },
    { id: 'image', label: t('filter_image') },
    { id: 'live', label: t('filter_live') },
  ];

  function handleShowOnMap(cameraId) {
    setFocusedMarkerId(cameraId);
    setHoveredCardId(cameraId);
    if (typeof mapSectionRef.current?.scrollIntoView === 'function') {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    mapControlsRef.current?.fitTo?.(cameraId, { zoom: 13 });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="app-container py-10">
        <section className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-6 py-10 text-white shadow-sm sm:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
              <VideoCameraIcon className="mr-2 h-4 w-4" />
              {t('community_badge')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h1>
            <p className="mt-4 text-sm leading-7 text-blue-100 sm:text-base">{t('subtitle')}</p>
          </div>

          {!loading && !error && (
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-blue-100">{t('summary_total', { count: filteredCameras.length })}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-blue-100">{t('summary_mapped', { count: markers.length })}</p>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              {t('filters_label')}
            </span>
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.id);
                  setHoveredCardId(null);
                  setHoveredMarkerId(null);
                  setFocusedMarkerId(null);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeFilter === filter.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">{t('map_title')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('map_subtitle')}</p>
          </div>

          {loading ? (
            <SkeletonLoader type="card" count={1} />
          ) : error ? (
            <EmptyState
              type="error"
              title={t('load_error_title')}
              description={error}
              action={{ text: t('retry'), onClick: refetch }}
            />
          ) : markers.length > 0 ? (
            <BaseMap
              center={mapCenter}
              zoom={GREECE_ZOOM}
              bounds={bounds}
              markers={markers}
              onMarkerHover={setHoveredMarkerId}
              onMarkersReady={(controls) => {
                mapControlsRef.current = controls;
              }}
              className="h-[420px] w-full overflow-hidden rounded-2xl"
              scrollWheelZoom
            />
          ) : (
            <EmptyState
              title={t('no_map_title')}
              description={filteredCameras.length > 0 ? t('no_map_filtered_description') : t('no_map_description')}
            />
          )}

          <div ref={mapSectionRef} />

          {!loading && !error && unmappedCount > 0 && (
            <p className="mt-3 text-sm text-amber-700">
              {t('unmapped_notice', { count: unmappedCount })}
            </p>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">{t('list_title')}</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <SkeletonLoader type="card" count={3} variant="grid" />
            </div>
          ) : error ? (
            <EmptyState
              type="error"
              title={t('load_error_title')}
              description={error}
              action={{ text: t('retry'), onClick: refetch }}
            />
          ) : filteredCameras.length === 0 ? (
            <EmptyState
              title={t('no_filtered_cameras_title')}
              description={t('no_filtered_cameras_description')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {filteredCameras.map((camera) => (
                <CameraCard
                  key={camera.id}
                  camera={camera}
                  t={t}
                  isHighlighted={camera.id === hoveredMarkerId || camera.id === hoveredCardId || camera.id === focusedMarkerId}
                  onHoverChange={(id) => {
                    setHoveredCardId(id);
                    if (!id) {
                      setFocusedMarkerId(null);
                    }
                  }}
                  onShowOnMap={handleShowOnMap}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export { buildCameraMarkers, getMapBounds };
