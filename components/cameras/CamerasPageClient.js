'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  FunnelIcon,
  MapPinIcon,
  PlusCircleIcon,
  SparklesIcon,
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
const DEFAULT_CREATOR_CONTENT = [];

const INITIAL_CONTENT_FORM = {
  type: 'creator-live',
  title: '',
  creator: '',
  platform: 'TikTok',
  url: '',
  cameraId: '',
};

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

function getSafeSocialUrl(url) {
  try {
    const parsed = new URL(url);
    const allowedHosts = [
      'tiktok.com',
      'www.tiktok.com',
      'instagram.com',
      'www.instagram.com',
      'youtube.com',
      'www.youtube.com',
      'youtu.be',
      'x.com',
      'www.x.com',
      'twitter.com',
      'www.twitter.com',
    ];

    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:')
      && allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
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

function buildCreatorTooltip(item) {
  const title = escapeHtml(item.title);
  const creator = escapeHtml(item.creator);
  const locationLabel = escapeHtml(item.locationLabel);
  const status = escapeHtml(item.status);
  return `${title}${creator ? ` - ${creator}` : ''}${locationLabel ? ` - ${locationLabel}` : ''}${status ? ` (${status})` : ''}`;
}

function buildCreatorMarkers(items, highlightedMarkerId = null) {
  return items.map((item) => {
    const id = `content:${item.id}`;
    return {
      id,
      lat: Number(item.lat),
      lng: Number(item.lng),
      tooltip: buildCreatorTooltip(item),
      variant: id === highlightedMarkerId ? 'hovered' : (item.type === 'creator-live' ? 'creatorLive' : 'viralVideo'),
    };
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

function CameraCard({ camera, t, isHighlighted, onHoverChange }) {
  const associatedLocation = camera.location;
  const sourceLocation = camera.sourceLocation;
  const showSourceLocation = sourceLocation && (!associatedLocation || associatedLocation.id !== sourceLocation.id);
  const mapLocationAvailable = hasMapLocation(camera);
  const safeCameraUrl = getSafeCameraUrl(camera.url);
  const primaryLocation = associatedLocation || sourceLocation || camera.mapLocation;
  const primaryLocationLabel = getLocationLabel(primaryLocation);

  return (
    <article
      className={`rounded-lg border bg-white p-4 shadow-sm transition ${isHighlighted ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-200 hover:shadow-md'}`}
      onMouseEnter={() => onHoverChange(camera.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <div className="space-y-4">
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

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <VideoCameraIcon className="mr-1 h-4 w-4 text-blue-600" />
            {getEmbedTypeLabel(camera, t)}
          </span>
          {mapLocationAvailable && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${camera.mapLocationSource === 'camera' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {camera.mapLocationSource === 'camera' ? t('pin_source_exact') : t('pin_source_source')}
            </span>
          )}
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

function CreatorContentCard({ item, t, isHighlighted, onHoverChange }) {
  const safeUrl = getSafeSocialUrl(item.url);
  const isLive = item.type === 'creator-live';

  return (
    <article
      className={`rounded-lg border bg-white p-4 shadow-sm transition ${isHighlighted ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 hover:border-red-200 hover:shadow-md'}`}
      onMouseEnter={() => onHoverChange(`content:${item.id}`)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
            <p className="mt-1 truncate text-sm text-gray-600">{item.creator || t('creator_unknown')} · {item.locationLabel}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${isLive ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
            {isLive ? t('creator_live_badge') : t('viral_video_badge')}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {isLive ? <BoltIcon className="mr-1 h-4 w-4 text-red-600" /> : <SparklesIcon className="mr-1 h-4 w-4 text-amber-600" />}
            {item.platform}
          </span>
          {item.source === 'local' && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {t('submitted_pending_badge')}
            </span>
          )}
        </div>

        {safeUrl && (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            {isLive ? t('open_creator_live') : t('open_viral_video')}
          </a>
        )}
      </div>
    </article>
  );
}

function CreatorSubmissionPanel({ t, cameras, form, error, notice, onChange, onSubmit }) {
  const mappableCameras = cameras.filter(hasMapLocation);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-md bg-red-50 p-2 text-red-600">
          <PlusCircleIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('creator_submit_title')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('creator_submit_description')}</p>
        </div>
      </div>

      <form className="grid gap-3" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            {t('creator_type_label')}
            <select
              value={form.type}
              onChange={(event) => onChange({ type: event.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="creator-live">{t('creator_type_live')}</option>
              <option value="viral-video">{t('creator_type_viral')}</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            {t('creator_location_label')}
            <select
              value={form.cameraId}
              onChange={(event) => onChange({ cameraId: event.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">{t('creator_location_placeholder')}</option>
              {mappableCameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            {t('creator_title_label')}
            <input
              value={form.title}
              onChange={(event) => onChange({ title: event.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder={t('creator_title_placeholder')}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            {t('creator_handle_label')}
            <input
              value={form.creator}
              onChange={(event) => onChange({ creator: event.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="@creator"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            {t('creator_platform_label')}
            <select
              value={form.platform}
              onChange={(event) => onChange({ platform: event.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="TikTok">TikTok</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="X">X</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            {t('creator_url_label')}
            <input
              value={form.url}
              onChange={(event) => onChange({ url: event.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="https://www.tiktok.com/@creator/live"
            />
          </label>
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {notice && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

        <button
          type="submit"
          className="inline-flex w-fit items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          <PlusCircleIcon className="h-4 w-4" />
          {t('creator_submit_action')}
        </button>
      </form>
    </section>
  );
}

export default function CamerasPageClient() {
  const t = useTranslations('cameras');
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [creatorSubmissions, setCreatorSubmissions] = useState([]);
  const [contentForm, setContentForm] = useState(INITIAL_CONTENT_FORM);
  const [contentFormError, setContentFormError] = useState('');
  const [contentFormNotice, setContentFormNotice] = useState('');
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
  const allCreatorContent = useMemo(
    () => [...creatorSubmissions, ...DEFAULT_CREATOR_CONTENT],
    [creatorSubmissions]
  );
  const filteredCameras = useMemo(() => {
    if (activeFilter === 'creatorLive' || activeFilter === 'viral') {
      return [];
    }
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
  const filteredCreatorContent = useMemo(() => {
    if (activeFilter === 'exact' || activeFilter === 'image') {
      return [];
    }
    if (activeFilter === 'creatorLive' || activeFilter === 'live') {
      return allCreatorContent.filter((item) => item.type === 'creator-live');
    }
    if (activeFilter === 'viral') {
      return allCreatorContent.filter((item) => item.type === 'viral-video');
    }
    return allCreatorContent;
  }, [activeFilter, allCreatorContent]);

  const highlightedMarkerId = hoveredCardId || hoveredMarkerId || null;
  const markers = useMemo(
    () => [
      ...buildCameraMarkers(filteredCameras, highlightedMarkerId),
      ...buildCreatorMarkers(filteredCreatorContent, highlightedMarkerId),
    ],
    [filteredCameras, filteredCreatorContent, highlightedMarkerId]
  );
  // Stable bounds and center — derived from filteredCameras coordinates only so that
  // BaseMap.fitBounds is NOT re-triggered when hover/focus state changes (which only
  // affect marker icon variant, not the viewport).  fitBounds fires only when the
  // camera data or the active filter actually changes.
  const bounds = useMemo(() => {
    const cameraPts = filteredCameras
      .filter(hasMapLocation)
      .map((c) => ({ lat: Number(c.mapLocation.lat), lng: Number(c.mapLocation.lng) }));
    const creatorPts = filteredCreatorContent.map((item) => ({ lat: Number(item.lat), lng: Number(item.lng) }));
    const pts = [...cameraPts, ...creatorPts];
    return getMapBounds(pts);
  }, [filteredCameras, filteredCreatorContent]);
  const mapCenter = useMemo(() => {
    const first = filteredCameras.find(hasMapLocation);
    const firstContent = filteredCreatorContent[0];
    if (!first && firstContent) {
      return [Number(firstContent.lat), Number(firstContent.lng)];
    }
    return first ? [Number(first.mapLocation.lat), Number(first.mapLocation.lng)] : GREECE_CENTER;
  }, [filteredCameras, filteredCreatorContent]);
  const cameraMarkerCount = filteredCameras.filter(hasMapLocation).length;
  const unmappedCount = filteredCameras.length - cameraMarkerCount;
  const mappedCount = allCameras.filter(hasMapLocation).length;
  const liveCount = allCameras.filter((camera) => camera.embedType !== 'image').length;
  const creatorLiveCount = allCreatorContent.filter((item) => item.type === 'creator-live').length;
  const viralCount = allCreatorContent.filter((item) => item.type === 'viral-video').length;
  const showCreatorSubmissionPanel = activeFilter !== 'exact' && activeFilter !== 'image';

  const filters = [
    { id: 'all', label: t('filter_all') },
    { id: 'mapped', label: t('filter_mapped') },
    { id: 'exact', label: t('filter_exact') },
    { id: 'image', label: t('filter_image') },
    { id: 'live', label: t('filter_live') },
    { id: 'creatorLive', label: t('filter_creator_live') },
    { id: 'viral', label: t('filter_viral') },
  ];

  function handleMarkerClick(markerId) {
    if (markerId?.startsWith('content:')) {
      const contentId = markerId.replace('content:', '');
      const item = filteredCreatorContent.find((content) => content.id === contentId);
      const safeUrl = item ? getSafeSocialUrl(item.url) : null;
      if (safeUrl && typeof window !== 'undefined') {
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const camera = filteredCameras.find((c) => c.id === markerId);
    const safeUrl = camera ? getSafeCameraUrl(camera.url) : null;
    if (safeUrl && typeof window !== 'undefined') {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function handleContentFormChange(partial) {
    setContentForm((current) => ({ ...current, ...partial }));
    setContentFormError('');
    setContentFormNotice('');
  }

  function handleContentSubmit(event) {
    event.preventDefault();
    const selectedCamera = allCameras.find((camera) => camera.id === contentForm.cameraId);
    const safeUrl = getSafeSocialUrl(contentForm.url);

    if (!selectedCamera || !hasMapLocation(selectedCamera)) {
      setContentFormError(t('creator_error_location'));
      return;
    }
    if (!contentForm.title.trim()) {
      setContentFormError(t('creator_error_title'));
      return;
    }
    if (!safeUrl) {
      setContentFormError(t('creator_error_url'));
      return;
    }

    const mapLocation = selectedCamera.mapLocation;
    const newItem = {
      id: `local-${Date.now()}`,
      type: contentForm.type,
      title: contentForm.title.trim(),
      creator: contentForm.creator.trim(),
      platform: contentForm.platform,
      url: safeUrl,
      lat: Number(mapLocation.lat),
      lng: Number(mapLocation.lng),
      locationLabel: getLocationLabel(mapLocation) || selectedCamera.label,
      status: contentForm.type === 'creator-live' ? t('creator_live_badge') : t('viral_video_badge'),
      source: 'local',
    };

    setCreatorSubmissions((current) => [newItem, ...current]);
    setContentForm({ ...INITIAL_CONTENT_FORM, cameraId: contentForm.cameraId });
    setContentFormNotice(t('creator_submit_success'));
    setActiveFilter(contentForm.type === 'creator-live' ? 'creatorLive' : 'viral');
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
                <span>{t('filter_live')}: {liveCount}</span>
                <span>{t('filter_creator_live')}: {creatorLiveCount}</span>
                <span>{t('filter_viral')}: {viralCount}</span>
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-24 xl:self-start">
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
                  {t('summary_map_items', { count: markers.length })}
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
                clusterMarkers
                onMarkerHover={setHoveredMarkerId}
                onMarkerClick={handleMarkerClick}
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
                <h2 className="text-2xl font-semibold text-gray-900">{t('map_content_title')}</h2>
                {!loading && !error && (
                  <p className="mt-1 text-sm text-gray-600">
                    {t('summary_content_total', { cameras: filteredCameras.length, content: filteredCreatorContent.length })}
                  </p>
                )}
              </div>
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
            ) : filteredCameras.length === 0 && filteredCreatorContent.length === 0 ? (
              <EmptyState
                title={t('no_filtered_cameras_title')}
                description={t('no_filtered_cameras_description')}
              />
            ) : (
              <div className="space-y-6">
                {showCreatorSubmissionPanel && (
                  <CreatorSubmissionPanel
                    t={t}
                    cameras={allCameras}
                    form={contentForm}
                    error={contentFormError}
                    notice={contentFormNotice}
                    onChange={handleContentFormChange}
                    onSubmit={handleContentSubmit}
                  />
                )}

                {filteredCreatorContent.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('creator_content_heading')}</h3>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      {filteredCreatorContent.map((item) => (
                        <CreatorContentCard
                          key={item.id}
                          item={item}
                          t={t}
                          isHighlighted={`content:${item.id}` === hoveredMarkerId || `content:${item.id}` === hoveredCardId}
                          onHoverChange={setHoveredCardId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredCameras.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('camera_content_heading')}</h3>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      {filteredCameras.map((camera) => (
                        <CameraCard
                          key={camera.id}
                          camera={camera}
                          t={t}
                          isHighlighted={camera.id === hoveredMarkerId || camera.id === hoveredCardId}
                          onHoverChange={(id) => {
                            setHoveredCardId(id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export { buildCameraMarkers, getMapBounds };
