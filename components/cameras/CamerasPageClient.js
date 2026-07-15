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
import { useAuth } from '@/lib/auth-context';
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

function CameraStatusControl({ camera, t, canToggle, isUpdating, onToggle }) {
  const cameraWorking = isCameraWorking(camera);
  const statusLabel = cameraWorking ? t('status_available') : t('status_unavailable');
  const statusClass = cameraWorking ? 'bg-green-500' : 'bg-red-500';

  if (!canToggle) {
    return (
      <span
        aria-label={statusLabel}
        title={statusLabel}
        className={`inline-flex h-3 w-3 shrink-0 rounded-full ${statusClass}`}
      />
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={cameraWorking}
      aria-label={t('toggle_status_aria', { label: camera.label, status: statusLabel })}
      title={t('toggle_status_title', { status: statusLabel })}
      disabled={isUpdating}
      onClick={() => onToggle(camera)}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-opacity ${isUpdating ? 'cursor-wait opacity-60' : 'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
    >
      <span className={`h-3 w-3 rounded-full ${statusClass}`} />
    </button>
  );
}

function CameraRow({ camera, t, isHighlighted, onHoverChange, canToggleStatus, isUpdatingStatus, onToggleStatus }) {
  const safeCameraUrl = getSafeCameraUrl(camera.url);

  return (
    <article
      className={`flex items-center justify-between gap-3 border-t px-3 py-2.5 transition first:border-t-0 sm:px-4 ${isHighlighted ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-slate-50'}`}
      onMouseEnter={() => onHoverChange(camera.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{camera.label}</h3>

      <CameraStatusControl
        camera={camera}
        t={t}
        canToggle={canToggleStatus}
        isUpdating={isUpdatingStatus}
        onToggle={onToggleStatus}
      />

      {safeCameraUrl && (
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

function CameraLocationGroup({ group, t, highlightedCameraId, onHoverChange, canToggleStatus, updatingStatusIds, onToggleStatus }) {
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
            canToggleStatus={canToggleStatus}
            isUpdatingStatus={updatingStatusIds.has(camera.id)}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>
    </section>
  );
}

export default function CamerasPageClient() {
  const t = useTranslations('cameras');
  const { user } = useAuth();
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({});
  const [updatingStatusIds, setUpdatingStatusIds] = useState(() => new Set());
  const [statusError, setStatusError] = useState(null);
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

  const allCameras = useMemo(
    () => (cameras || []).map((camera) => (
      Object.prototype.hasOwnProperty.call(statusOverrides, camera.id)
        ? { ...camera, isWorking: statusOverrides[camera.id] }
        : camera
    )),
    [cameras, statusOverrides]
  );
  const cameraGroups = useMemo(
    () => groupCamerasByLocation(allCameras, t),
    [allCameras, t]
  );

  const highlightedMarkerId = hoveredCardId || hoveredMarkerId || null;
  const markers = useMemo(
    () => buildCameraMarkers(allCameras, highlightedMarkerId),
    [allCameras, highlightedMarkerId]
  );
  // Stable bounds and center: derived from camera coordinates only so that
  // BaseMap.fitBounds is NOT re-triggered when hover/focus state changes (which only
  // affect marker icon variant, not the viewport).  fitBounds fires only when the
  // camera data actually changes.
  const bounds = useMemo(() => {
    const pts = allCameras
      .filter(hasMapLocation)
      .map((c) => ({ lat: Number(c.mapLocation.lat), lng: Number(c.mapLocation.lng) }));
    return getMapBounds(pts);
  }, [allCameras]);
  const mapCenter = useMemo(() => {
    const first = allCameras.find(hasMapLocation);
    return first ? [Number(first.mapLocation.lat), Number(first.mapLocation.lng)] : GREECE_CENTER;
  }, [allCameras]);
  const unmappedCount = allCameras.length - markers.length;
  const mappedCount = allCameras.filter(hasMapLocation).length;
  const unavailableCount = allCameras.filter((camera) => !isCameraWorking(camera)).length;

  function handleMarkerClick(cameraId) {
    const camera = allCameras.find((c) => c.id === cameraId);
    const safeUrl = camera ? getSafeCameraUrl(camera.url) : null;
    if (safeUrl && typeof window !== 'undefined') {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleToggleStatus(camera) {
    if (!user || updatingStatusIds.has(camera.id)) return;

    const nextStatus = !isCameraWorking(camera);
    setStatusError(null);
    setUpdatingStatusIds((current) => new Set(current).add(camera.id));

    try {
      const response = await locationSectionAPI.updateCameraStatus(camera.sectionId, camera.index, nextStatus);
      if (!response?.success) {
        throw new Error(response?.message || t('status_update_error'));
      }
      setStatusOverrides((current) => ({
        ...current,
        [camera.id]: response.camera?.isWorking ?? nextStatus,
      }));
    } catch (err) {
      setStatusError(err?.message || t('status_update_error'));
    } finally {
      setUpdatingStatusIds((current) => {
        const next = new Set(current);
        next.delete(camera.id);
        return next;
      });
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
                description={allCameras.length > 0 ? t('no_map_description') : t('no_cameras_description')}
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
                  <p className="mt-1 text-sm text-gray-600">{t('summary_total', { count: allCameras.length })}</p>
                )}
              </div>
            </div>
            {statusError && (
              <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {statusError}
              </p>
            )}

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
            ) : allCameras.length === 0 ? (
              <EmptyState
                title={t('no_cameras_title')}
                description={t('no_cameras_description')}
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
                    canToggleStatus={Boolean(user)}
                    updatingStatusIds={updatingStatusIds}
                    onToggleStatus={handleToggleStatus}
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
