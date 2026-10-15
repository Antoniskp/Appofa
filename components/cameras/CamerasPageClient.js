'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  SignalIcon,
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
const CAMERA_STATUS_FILTERS = ['all', 'working', 'unavailable'];

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

function cleanDisplayText(value, fallback = '') {
  return String(value || fallback)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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

function getCameraLocationText(camera, t) {
  const location = getCameraGroupLocation(camera);
  return getLocationLabel(location) || t('map_unavailable');
}

function getCameraMapSourceLabel(camera, t) {
  if (!hasMapLocation(camera)) return t('map_unavailable');
  return camera.mapLocationSource === 'camera' ? t('pin_source_exact') : t('pin_source_source');
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
  const label = escapeHtml(cleanDisplayText(camera.label));
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
      label: cleanDisplayText(camera.label),
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
  const statusClass = cameraWorking
    ? 'bg-green-50 text-green-700 ring-green-600/20'
    : 'bg-red-50 text-red-700 ring-red-600/20';
  const dotClass = cameraWorking ? 'bg-green-500' : 'bg-red-500';

  if (!canToggle) {
    return (
      <span
        aria-label={statusLabel}
        title={statusLabel}
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass}`}
      >
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        {statusLabel}
      </span>
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset transition-opacity ${statusClass} ${isUpdating ? 'cursor-wait opacity-60' : 'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {statusLabel}
    </button>
  );
}

function CameraRow({
  camera,
  t,
  isHighlighted,
  onHoverChange,
  onFocusMap,
  canToggleStatus,
  isUpdatingStatus,
  onToggleStatus,
}) {
  const safeCameraUrl = getSafeCameraUrl(camera.url);
  const cameraLabel = cleanDisplayText(camera.label);
  const locationLabel = getCameraLocationText(camera, t);
  const mapSourceLabel = getCameraMapSourceLabel(camera, t);
  const hasValidMapLocation = hasMapLocation(camera);

  return (
    <article
      className={`flex flex-col gap-3 border-t px-4 py-3 transition first:border-t-0 sm:flex-row sm:items-center sm:justify-between ${isHighlighted ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-slate-50'}`}
      onMouseEnter={() => onHoverChange(camera.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-gray-900">{cameraLabel}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </span>
          <span>{getEmbedTypeLabel(camera, t)}</span>
          <span>{mapSourceLabel}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            aria-label={t('open_camera_new_tab_aria', { label: cameraLabel })}
            title={getEmbedTypeLabel(camera, t)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            {t('open_camera')}
          </a>
        )}
        {hasValidMapLocation && (
          <button
            type="button"
            onClick={() => onFocusMap(camera.id)}
            aria-label={t('show_camera_on_map_aria', { label: cameraLabel })}
            title={t('show_on_map')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50"
          >
            <MapPinIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

function CameraLocationGroup({
  group,
  t,
  highlightedCameraId,
  onHoverChange,
  onFocusMap,
  canToggleStatus,
  updatingStatusIds,
  onToggleStatus,
}) {
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
            className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
            onFocusMap={onFocusMap}
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
  const [cameraSearch, setCameraSearch] = useState('');
  const [cameraStatusFilter, setCameraStatusFilter] = useState('all');
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
  const filteredCameras = useMemo(() => {
    const search = normalizeSearchText(cameraSearch);

    return allCameras.filter((camera) => {
      const statusMatches = cameraStatusFilter === 'all'
        || (cameraStatusFilter === 'working' && isCameraWorking(camera))
        || (cameraStatusFilter === 'unavailable' && !isCameraWorking(camera));

      if (!statusMatches) return false;
      if (!search) return true;

      return normalizeSearchText([
        camera.label,
        getLocationLabel(getCameraGroupLocation(camera)),
        camera.embedType,
      ].join(' ')).includes(search);
    });
  }, [allCameras, cameraSearch, cameraStatusFilter]);
  const cameraGroups = useMemo(
    () => groupCamerasByLocation(filteredCameras, t),
    [filteredCameras, t]
  );
  const highlightedMarkerId = hoveredCardId || hoveredMarkerId || null;
  const cameraMarkers = useMemo(
    () => buildCameraMarkers(filteredCameras, highlightedMarkerId),
    [filteredCameras, highlightedMarkerId]
  );
  const markers = cameraMarkers;
  // Stable bounds and center: derived from camera coordinates only so that
  // BaseMap.fitBounds is NOT re-triggered when hover/focus state changes (which only
  // affect marker icon variant, not the viewport).  fitBounds fires only when the
  // marker coordinate data actually changes.
  const mapPoints = useMemo(
    () => [
      ...filteredCameras
        .filter(hasMapLocation)
        .map((c) => ({ lat: Number(c.mapLocation.lat), lng: Number(c.mapLocation.lng) })),
    ],
    [filteredCameras]
  );
  const bounds = useMemo(() => {
    return getMapBounds(mapPoints);
  }, [mapPoints]);
  const mapCenter = useMemo(() => {
    const first = mapPoints[0];
    return first ? [first.lat, first.lng] : GREECE_CENTER;
  }, [mapPoints]);
  const unmappedCount = filteredCameras.length - filteredCameras.filter(hasMapLocation).length;
  const mappedCount = allCameras.filter(hasMapLocation).length;
  const unavailableCount = allCameras.filter((camera) => !isCameraWorking(camera)).length;
  const workingCount = allCameras.length - unavailableCount;
  function handleFocusCameraOnMap(cameraId) {
    setHoveredCardId(cameraId);
    setHoveredMarkerId(cameraId);
    if (typeof document !== 'undefined') {
      document.getElementById('camera-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleMarkerClick(markerId) {
    const camera = allCameras.find((c) => c.id === markerId);
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
      <div className="app-container space-y-6 py-6 sm:py-8">
        <section className="rounded-lg border border-blue-100 bg-white px-5 py-6 shadow-sm sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                <SignalIcon className="mr-2 h-4 w-4" />
                {t('live_cameras_badge')}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">{t('title')}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 sm:text-base">{t('subtitle')}</p>
            </div>

            {!loading && !error && (
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-gray-600 lg:justify-end">
                <span>{t('summary_total', { count: allCameras.length })}</span>
                <span>{t('summary_working', { count: workingCount })}</span>
                <span>{t('summary_unavailable', { count: unavailableCount })}</span>
                <span>{t('summary_mapped', { count: mappedCount })}</span>
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <section id="live-cameras" className="space-y-5">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{t('list_title')}</h2>
                  {!loading && !error && (
                    <p className="mt-1 text-sm text-gray-600">{t('camera_results_count', { shown: filteredCameras.length, total: allCameras.length })}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    {t('camera_search_label')}
                  </span>
                  <input
                    type="search"
                    value={cameraSearch}
                    onChange={(event) => setCameraSearch(event.target.value)}
                    placeholder={t('camera_search_placeholder')}
                    className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <FunnelIcon className="h-4 w-4" />
                    {t('camera_status_filter')}
                  </span>
                  <select
                    value={cameraStatusFilter}
                    onChange={(event) => setCameraStatusFilter(event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {CAMERA_STATUS_FILTERS.map((statusKey) => (
                      <option key={statusKey} value={statusKey}>
                        {t(`camera_status_${statusKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {statusError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
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
            ) : filteredCameras.length === 0 ? (
              <EmptyState
                title={t('no_filtered_cameras_title')}
                description={t('no_filtered_cameras_description')}
              />
            ) : (
              <div className="space-y-6">
                {cameraGroups.map((group) => (
                  <CameraLocationGroup
                    key={group.key}
                    group={group}
                    t={t}
                    highlightedCameraId={hoveredMarkerId || hoveredCardId}
                    onHoverChange={(id) => {
                      setHoveredCardId(id);
                    }}
                    onFocusMap={handleFocusCameraOnMap}
                    canToggleStatus={Boolean(user)}
                    updatingStatusIds={updatingStatusIds}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            )}
          </section>

          <aside id="camera-map" className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{t('map_title')}</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">{t('map_subtitle')}</p>
              </div>

              {loading ? (
                <SkeletonLoader type="card" count={1} />
              ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-semibold text-red-800">{t('map_load_error_title')}</p>
                  <p className="mt-1">{error}</p>
                </div>
              ) : markers.length > 0 ? (
                <BaseMap
                  center={mapCenter}
                  zoom={GREECE_ZOOM}
                  bounds={bounds}
                  markers={markers}
                  clusterMarkers
                  onMarkerHover={setHoveredMarkerId}
                  onMarkerClick={handleMarkerClick}
                  className="h-[360px] w-full overflow-hidden rounded-lg sm:h-[460px] xl:h-[540px]"
                  scrollWheelZoom
                  tileMode="political"
                  showFullscreenControl
                />
              ) : (
                <EmptyState
                  title={t('no_map_title')}
                  description={filteredCameras.length > 0 ? t('no_map_description') : t('no_filtered_cameras_description')}
                />
              )}
              {!loading && !error && unmappedCount > 0 && (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {t('unmapped_notice', { count: unmappedCount })}
                </p>
              )}
            </section>

          </aside>
        </div>

      </div>
    </div>
  );
}

export { buildCameraMarkers, getMapBounds };
