'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
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

function isCameraWorking(camera) {
  return camera?.isWorking !== false;
}

function getEmbedTypeLabel(camera, t) {
  if (camera.embedType === 'image') return t('badge_image');
  if (camera.embedType === 'iframe') return t('badge_iframe');
  return t('badge_live_link');
}

function getCameraGroupLocation(camera) {
  return camera.location || camera.sourceLocation || camera.mapLocation || null;
}

function groupCamerasByLocation(cameras, t) {
  const groupsByKey = new Map();

  cameras.forEach((camera) => {
    const location = getCameraGroupLocation(camera);
    const label = getLocationLabel(location) || t('map_unavailable');
    const key = location?.id || location?.slug || label;

    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, {
        key,
        label,
        slug: location?.slug || null,
        cameras: [],
      });
    }

    groupsByKey.get(key).cameras.push(camera);
  });

  return Array.from(groupsByKey.values());
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
      label: camera.label,
      meta: getLocationLabel(mapLocation),
      href: mapLocation.slug ? `/locations/${mapLocation.slug}` : null,
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

function CameraRow({ camera, t, isHighlighted, onHoverChange }) {
  const safeCameraUrl = getSafeCameraUrl(camera.url);
  const cameraWorking = isCameraWorking(camera);

  return (
    <article
      className={`flex items-center justify-between gap-3 border-t px-3 py-2.5 transition first:border-t-0 sm:px-4 ${isHighlighted ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-slate-50'}`}
      onMouseEnter={() => onHoverChange(camera.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{camera.label}</h3>

      {!cameraWorking && (
        <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
          {t('status_unavailable')}
        </span>
      )}

      {cameraWorking && safeCameraUrl && (
        <a
          href={safeCameraUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('open_camera_new_tab_aria', { label: camera.label })}
          title={getEmbedTypeLabel(camera, t)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </a>
      )}
    </article>
  );
}

function CameraLocationGroup({ group, t, highlightedCameraId, onHoverChange }) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-gray-900">{group.label}</h2>
          <p className="mt-0.5 text-xs font-medium text-gray-500">{t('summary_total', { count: group.cameras.length })}</p>
        </div>

        {group.slug && (
          <Link
            href={`/locations/${group.slug}`}
            aria-label={t('view_location_aria', { location: group.label })}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <MapPinIcon className="h-4 w-4" />
            {t('view_location')}
          </Link>
        )}
      </header>

      <div>
        {group.cameras.map((camera) => (
          <CameraRow
            key={camera.id}
            camera={camera}
            t={t}
            isHighlighted={camera.id === highlightedCameraId}
            onHoverChange={onHoverChange}
          />
        ))}
      </div>
    </section>
  );
}

export default function CamerasPageClient() {
  const t = useTranslations('cameras');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
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
  const visibleCameras = useMemo(
    () => (showUnavailable ? allCameras : allCameras.filter(isCameraWorking)),
    [allCameras, showUnavailable]
  );
  const cameraGroups = useMemo(
    () => groupCamerasByLocation(visibleCameras, t),
    [visibleCameras, t]
  );

  const highlightedMarkerId = hoveredCardId || hoveredMarkerId || null;
  const markers = useMemo(
    () => buildCameraMarkers(visibleCameras, highlightedMarkerId),
    [visibleCameras, highlightedMarkerId]
  );
  // Stable bounds and center: derived from visible camera coordinates only so that
  // BaseMap.fitBounds is NOT re-triggered when hover/focus state changes (which only
  // affect marker icon variant, not the viewport).  fitBounds fires only when the
  // camera data or the availability toggle actually changes.
  const bounds = useMemo(() => {
    const pts = visibleCameras
      .filter(hasMapLocation)
      .map((c) => ({ lat: Number(c.mapLocation.lat), lng: Number(c.mapLocation.lng) }));
    return getMapBounds(pts);
  }, [visibleCameras]);
  const mapCenter = useMemo(() => {
    const first = visibleCameras.find(hasMapLocation);
    return first ? [Number(first.mapLocation.lat), Number(first.mapLocation.lng)] : GREECE_CENTER;
  }, [visibleCameras]);
  const unmappedCount = visibleCameras.length - markers.length;
  const mappedCount = allCameras.filter(hasMapLocation).length;
  const unavailableCount = allCameras.filter((camera) => !isCameraWorking(camera)).length;

  function handleMarkerClick(cameraId) {
    const camera = visibleCameras.find((c) => c.id === cameraId);
    const safeUrl = camera ? getSafeCameraUrl(camera.url) : null;
    if (isCameraWorking(camera) && safeUrl && typeof window !== 'undefined') {
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
              <div className="flex flex-wrap gap-3 text-sm font-semibold text-blue-100">
                <span>{t('summary_total', { count: allCameras.length })}</span>
                <span>{t('summary_mapped', { count: mappedCount })}</span>
                <span>{t('summary_unavailable', { count: unavailableCount })}</span>
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-24 xl:self-start">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{t('map_title')}</h2>
                <p className="mt-2 text-sm text-gray-600">{t('map_subtitle')}</p>
              </div>
              {!loading && !error && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={showUnavailable}
                    aria-label={t('availability_toggle_aria')}
                    onClick={() => {
                      setShowUnavailable((value) => !value);
                      setHoveredCardId(null);
                      setHoveredMarkerId(null);
                    }}
                    className={`relative h-6 w-11 rounded-full transition-colors ${showUnavailable ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${showUnavailable ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </button>
                  <span className="text-sm font-semibold text-slate-700">{t('availability_toggle_label')}</span>
                </div>
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
                clusterMarkers
                onMarkerHover={setHoveredMarkerId}
                onMarkerClick={handleMarkerClick}
                className="h-[360px] w-full overflow-hidden rounded-lg sm:h-[460px] xl:h-[620px]"
                scrollWheelZoom
                tileMode="political"
                showFullscreenControl
              />
            ) : (
              <EmptyState
                title={t('no_map_title')}
                description={visibleCameras.length > 0 ? t('no_map_visible_description') : t('no_map_description')}
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
                  <p className="mt-1 text-sm text-gray-600">{t('summary_total', { count: visibleCameras.length })}</p>
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                <SkeletonLoader type="card" count={4} variant="grid" />
              </div>
            ) : error ? (
              <EmptyState
                type="error"
                title={t('load_error_title')}
                description={error}
                action={{ text: t('retry'), onClick: refetch }}
              />
            ) : visibleCameras.length === 0 ? (
              <EmptyState
                title={showUnavailable ? t('no_cameras_title') : t('no_available_cameras_title')}
                description={showUnavailable ? t('no_cameras_description') : t('no_available_cameras_description')}
              />
            ) : (
              <div className="space-y-4">
                {cameraGroups.map((group) => (
                  <CameraLocationGroup
                    key={group.key}
                    group={group}
                    t={t}
                    highlightedCameraId={hoveredMarkerId || hoveredCardId}
                    onHoverChange={(id) => {
                      setHoveredCardId(id);
                    }}
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
