'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
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

function buildCameraMarkers(cameras) {
  return cameras.flatMap((camera) => {
    const mapLocation = camera.mapLocation;
    if (!mapLocation || !isValidCoord(mapLocation.lat, -90, 90) || !isValidCoord(mapLocation.lng, -180, 180)) {
      return [];
    }

    const label = escapeHtml(camera.label);
    const locationLabel = escapeHtml(getLocationLabel(mapLocation));

    return [{
      id: camera.id,
      lat: Number(mapLocation.lat),
      lng: Number(mapLocation.lng),
      popup: locationLabel ? `${label}<br/>${locationLabel}` : label,
      tooltip: label,
      variant: 'explorer',
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

function CameraCard({ camera, t }) {
  const associatedLocation = camera.location;
  const sourceLocation = camera.sourceLocation;
  const showSourceLocation = sourceLocation && (!associatedLocation || associatedLocation.id !== sourceLocation.id);
  const mapLocationAvailable = camera.mapLocation
    && isValidCoord(camera.mapLocation.lat, -90, 90)
    && isValidCoord(camera.mapLocation.lng, -180, 180);

  const previewIsImage = camera.embedType === 'image';

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <VideoCameraIcon className="mr-1 h-4 w-4" />
            {t('camera_badge')}
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

        <div className="flex flex-wrap gap-3">
          <a
            href={camera.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            {t('open_camera')}
          </a>
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

  const markers = buildCameraMarkers(cameras || []);
  const bounds = getMapBounds(markers);
  const mapCenter = markers.length > 0
    ? [markers[0].lat, markers[0].lng]
    : GREECE_CENTER;

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
                <p className="text-xs uppercase tracking-wide text-blue-100">{t('summary_total', { count: cameras.length })}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-blue-100">{t('summary_mapped', { count: markers.length })}</p>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
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
              className="h-[420px] w-full overflow-hidden rounded-2xl"
              scrollWheelZoom
            />
          ) : (
            <EmptyState
              title={t('no_map_title')}
              description={t('no_map_description')}
            />
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
          ) : cameras.length === 0 ? (
            <EmptyState
              title={t('no_cameras_title')}
              description={t('no_cameras_description')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {cameras.map((camera) => (
                <CameraCard key={camera.id} camera={camera} t={t} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export { buildCameraMarkers, getMapBounds };
