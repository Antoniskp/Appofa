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

function buildCameraTooltip(camera) {
  const label = escapeHtml(camera.label);
  const locationLabel = escapeHtml(getLocationLabel(camera.mapLocation));
  return locationLabel ? `${label} - ${locationLabel}` : label;
}

function buildCameraMarkers(cameras, highlightedMarkerId = null) {
  return cameras.flatMap((camera) => {
    if (!hasMapLocation(camera)) {
      return [];
    }

    const mapLocation = camera.mapLocation;

    return [{
      id: camera.id,
      lat: Number(mapLocation.lat),
      lng: Number(mapLocation.lng),
      tooltip: buildCameraTooltip(camera),
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

function CameraMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-100">{label}</p>
    </div>
  );
}

function CameraCard({ camera, t, isHighlighted, onHoverChange, onShowOnMap }) {
  const associatedLocation = camera.location;
  const sourceLocation = camera.sourceLocation;
  const showSourceLocation = sourceLocation && (!associatedLocation || associatedLocation.id !== sourceLocation.id);
  const mapLocationAvailable = hasMapLocation(camera);
  const safeCameraUrl = getSafeCameraUrl(camera.url);
  const primaryLocation = associatedLocation || sourceLocation || camera.mapLocation;
  const primaryLocationLabel = getLocationLabel(primaryLocation);

  const previewIsImage = camera.embedType === 'image';

  return (
    <article
      className={`group overflow-hidden rounded-lg border bg-white shadow-sm transition ${isHighlighted ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-200 hover:shadow-md'}`}
      onMouseEnter={() => onHoverChange(camera.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {previewIsImage ? (
          <img
            src={camera.url}
            alt={camera.label}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3 text-white">
              <VideoCameraIcon className="h-12 w-12" />
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {camera.embedType === 'iframe' ? 'iframe' : 'live'}
              </span>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
            <VideoCameraIcon className="mr-1 h-4 w-4 text-blue-600" />
            {getEmbedTypeLabel(camera, t)}
          </span>
          {mapLocationAvailable && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${camera.mapLocationSource === 'camera' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {camera.mapLocationSource === 'camera' ? t('pin_source_exact') : t('pin_source_source')}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{camera.label}</h2>
            {primaryLocationLabel && (
              <p className="mt-1 truncate text-sm text-gray-600">{primaryLocationLabel}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${mapLocationAvailable ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {mapLocationAvailable ? t('map_available') : t('map_unavailable')}
          </span>
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

        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {safeCameraUrl && (
            <a
              href={safeCameraUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('open_camera_new_tab_aria', { label: camera.label })}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              {t('open_camera')}
            </a>
          )}
          {mapLocationAvailable && (
            <button
              type="button"
              onClick={() => onShowOnMap(camera.id)}
              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <MapPinIcon className="h-4 w-4" />
              {t('show_on_map')}
            </button>
          )}
          {camera.mapLocation?.slug && (
            <Link
              href={`/locations/${camera.mapLocation.slug}`}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
  const markers = useMemo(
    () => buildCameraMarkers(filteredCameras, highlightedMarkerId),
    [filteredCameras, highlightedMarkerId]
  );
  // Stable bounds and center — derived from filteredCameras coordinates only so that
  // BaseMap.fitBounds is NOT re-triggered when hover/focus state changes (which only
  // affect marker icon variant, not the viewport).  fitBounds fires only when the
  // camera data or the active filter actually changes.
  const bounds = useMemo(() => {
    const pts = filteredCameras
      .filter(hasMapLocation)
      .map((c) => ({ lat: Number(c.mapLocation.lat), lng: Number(c.mapLocation.lng) }));
    return getMapBounds(pts);
  }, [filteredCameras]);
  const mapCenter = useMemo(() => {
    const first = filteredCameras.find(hasMapLocation);
    return first ? [Number(first.mapLocation.lat), Number(first.mapLocation.lng)] : GREECE_CENTER;
  }, [filteredCameras]);
  const unmappedCount = filteredCameras.length - markers.length;
  const mappedCount = allCameras.filter(hasMapLocation).length;
  const exactCount = allCameras.filter((camera) => hasMapLocation(camera) && camera.mapLocationSource === 'camera').length;
  const imageCount = allCameras.filter((camera) => camera.embedType === 'image').length;
  const liveCount = allCameras.filter((camera) => camera.embedType !== 'image').length;

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
      const reduceMotion = typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      mapSectionRef.current.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    mapControlsRef.current?.fitTo?.(cameraId, { zoom: 13 });
  }

  function handleMarkerClick(cameraId) {
    const camera = filteredCameras.find((c) => c.id === cameraId);
    const safeUrl = camera ? getSafeCameraUrl(camera.url) : null;
    if (safeUrl && typeof window !== 'undefined') {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="app-container py-8 sm:py-10">
        <section className="overflow-hidden rounded-lg bg-slate-950 px-5 py-8 text-white shadow-sm sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                <VideoCameraIcon className="mr-2 h-4 w-4" />
                {t('community_badge')}
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h1>
              <p className="mt-4 text-sm leading-7 text-blue-100 sm:text-base">{t('subtitle')}</p>
            </div>

            {!loading && !error && (
              <div className="grid grid-cols-2 gap-3">
                <CameraMetric label={t('filter_all')} value={allCameras.length} />
                <CameraMetric label={t('filter_mapped')} value={mappedCount} />
                <CameraMetric label={t('filter_exact')} value={exactCount} />
                <CameraMetric label={t('filter_live')} value={liveCount} />
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <section ref={mapSectionRef} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-24 xl:self-start">
            <div
              className="mb-4 flex flex-wrap items-center gap-2"
              role="radiogroup"
              aria-label={t('filters_label')}
            >
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <FunnelIcon className="h-4 w-4" />
                {t('filters_label')}
              </span>
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="radio"
                  onClick={() => {
                    setActiveFilter(filter.id);
                    setHoveredCardId(null);
                    setHoveredMarkerId(null);
                    setFocusedMarkerId(null);
                  }}
                  aria-checked={activeFilter === filter.id}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${activeFilter === filter.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{t('map_title')}</h2>
                <p className="mt-2 text-sm text-gray-600">{t('map_subtitle')}</p>
              </div>
              {!loading && !error && (
                <p className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  {t('summary_mapped', { count: markers.length })}
                </p>
              )}
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
                onMarkerClick={handleMarkerClick}
                onMarkersReady={(controls) => {
                  mapControlsRef.current = controls;
                }}
                className="h-[360px] w-full overflow-hidden rounded-lg sm:h-[460px] xl:h-[620px]"
                scrollWheelZoom
              />
            ) : (
              <EmptyState
                title={t('no_map_title')}
                description={filteredCameras.length > 0 ? t('no_map_filtered_description') : t('no_map_description')}
              />
            )}
            {!loading && !error && unmappedCount > 0 && (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t('unmapped_notice', { count: unmappedCount })}
              </p>
            )}
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{t('list_title')}</h2>
                {!loading && !error && (
                  <p className="mt-1 text-sm text-gray-600">{t('summary_total', { count: filteredCameras.length })}</p>
                )}
              </div>
              {!loading && !error && imageCount > 0 && (
                <p className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  {t('filter_image')}: {imageCount}
                </p>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SkeletonLoader type="card" count={4} variant="grid" />
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
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
    </div>
  );
}

export { buildCameraMarkers, getMapBounds };
