'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
  SignalIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { locationSectionAPI, videoPinAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import VideoEmbedField from '@/components/articles/VideoEmbedField';
import {
  VIDEO_PIN_CATEGORY_STYLES,
  buildVideoPinMarkers,
  getVideoPinCategoryStyle,
  getVideoPinWatchUrl,
} from '@/lib/utils/videoPinMarkers';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });
const LocationPickerMap = dynamic(() => import('@/components/map/LocationPickerMap'), { ssr: false });

const GREECE_CENTER = [38.5, 23.8];
const GREECE_ZOOM = 6;
const VIDEO_PIN_CATEGORIES = Object.keys(VIDEO_PIN_CATEGORY_STYLES);
const VIDEO_PIN_SORTS = ['newest', 'expiresSoon', 'recentlyApproved', 'category'];
const LIVE_EXPIRY_OPTIONS = [2, 6, 24, 72];
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
      className={`rounded-lg border bg-white p-4 shadow-sm transition ${isHighlighted ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
      onMouseEnter={() => onHoverChange(camera.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold leading-6 text-gray-900">{cameraLabel}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </p>
        </div>
        <CameraStatusControl
          camera={camera}
          t={t}
          canToggle={canToggleStatus}
          isUpdating={isUpdatingStatus}
          onToggle={onToggleStatus}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-gray-600">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1">
          {getEmbedTypeLabel(camera, t)}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1">
          {mapSourceLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <MapPinIcon className="h-4 w-4" />
            {t('show_on_map')}
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
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-900">{group.label}</h2>
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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

function getVideoPinTitle(pin) {
  return cleanDisplayText(pin?.title || pin?.sourceMeta?.title, 'Video');
}

function getVideoPinCreator(pin) {
  return pin?.creatorHandle || pin?.creatorName || '';
}

function getVideoPinLocationLabel(pin) {
  return getLocationLabel(pin?.location);
}

function getTranslatedCategoryLabel(category, t) {
  const key = `video_category_${String(category || 'other').replace(/-/g, '_')}`;
  const translated = t(key);
  return translated === key ? getVideoPinCategoryStyle(category).label : translated;
}

function getTranslatedContentTypeLabel(contentType, t) {
  return contentType === 'live' ? t('content_type_live') : t('content_type_viral');
}

function getVideoPinSourceLabel(pin, t) {
  const source = String(pin?.canonicalUrl || pin?.sourceUrl || '').toLowerCase();
  if (source.includes('tiktok.com')) return t('source_tiktok');
  if (source.includes('youtube.com') || source.includes('youtu.be')) return t('source_youtube');
  return t('source_video');
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return '';
  try {
    return new Date(expiresAt).toLocaleString();
  } catch {
    return '';
  }
}

function LayerToggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}
    >
      {children}
    </button>
  );
}

function VideoPinMedia({ pin, label, t }) {
  const [failed, setFailed] = useState(false);

  if (pin.thumbnailUrl && !failed) {
    return (
      <img
        src={pin.thumbnailUrl}
        alt=""
        className="h-36 w-full bg-slate-900 object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-36 w-full items-center justify-center bg-slate-900 px-4 text-center text-sm font-semibold text-white">
      <span>{label || t('video_preview_unavailable')}</span>
    </div>
  );
}

function VideoPinCard({ pin, t, isHighlighted, onHoverChange }) {
  const markerId = `video-pin:${pin.id}`;
  const safeWatchUrl = getVideoPinWatchUrl(pin);
  const title = getVideoPinTitle(pin);
  const creator = getVideoPinCreator(pin);
  const locationLabel = getVideoPinLocationLabel(pin);
  const categoryStyle = getVideoPinCategoryStyle(pin.category);
  const expiry = pin.contentType === 'live' ? formatExpiry(pin.expiresAt) : '';
  const sourceLabel = getVideoPinSourceLabel(pin, t);

  return (
    <article
      className={`overflow-hidden rounded-lg border bg-white shadow-sm transition ${isHighlighted ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
      onMouseEnter={() => onHoverChange(markerId)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <VideoPinMedia pin={pin} label={title} t={t} />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
            {getTranslatedContentTypeLabel(pin.contentType, t)}
          </span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: categoryStyle.color }}
          >
            {getTranslatedCategoryLabel(pin.category, t)}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {sourceLabel}
          </span>
        </div>

        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">{title}</h3>
          {(creator || locationLabel) && (
            <p className="mt-1 truncate text-xs text-gray-500">
              {[creator, locationLabel].filter(Boolean).join(' - ')}
            </p>
          )}
        </div>

        {expiry && (
          <p className="inline-flex items-center gap-1.5 text-xs text-amber-700">
            <ClockIcon className="h-4 w-4" />
            {t('expires_at', { time: expiry })}
          </p>
        )}

        {safeWatchUrl && (
          <a
            href={safeWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            {pin.contentType === 'live' ? t('open_live_video') : t('open_tiktok_video')}
          </a>
        )}
      </div>
    </article>
  );
}

function VideoPinSection({
  title,
  subtitle,
  pins,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  onRetry,
  t,
  highlightedMarkerId,
  onHoverChange,
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">{subtitle}</p>
      </div>

      {loading ? (
        <SkeletonLoader type="card" count={2} variant="grid" />
      ) : error ? (
        <EmptyState
          type="error"
          title={t('video_load_error_title')}
          description={error}
          action={{ text: t('retry'), onClick: onRetry }}
        />
      ) : pins.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pins.map((pin) => (
            <VideoPinCard
              key={pin.id}
              pin={pin}
              t={t}
              isHighlighted={highlightedMarkerId === `video-pin:${pin.id}`}
              onHoverChange={onHoverChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function VideoPinSubmissionModal({ isOpen, onClose, onSubmitted, t }) {
  const [form, setForm] = useState({
    sourceUrl: '',
    title: '',
    contentType: 'viral',
    category: 'local-news',
    expiresInHours: 24,
    lat: '',
    lng: '',
  });
  const [isTitleDirty, setIsTitleDirty] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasValidCoords = isValidCoord(form.lat, -90, 90) && isValidCoord(form.lng, -180, 180);
  const canSubmit = Boolean(form.sourceUrl) && hasValidCoords && !isSubmitting;

  function resetForm() {
    setForm({
      sourceUrl: '',
      title: '',
      contentType: 'viral',
      category: 'local-news',
      expiresInHours: 24,
      lat: '',
      lng: '',
    });
    setIsTitleDirty(false);
    setSubmitError(null);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      setSubmitError(t('video_form_missing_fields'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await videoPinAPI.create({
        sourceUrl: form.sourceUrl,
        title: form.title || undefined,
        contentType: form.contentType,
        category: form.category,
        lat: Number(form.lat),
        lng: Number(form.lng),
        expiresInHours: form.contentType === 'live' ? Number(form.expiresInHours) : undefined,
      });

      if (!response?.success) {
        throw new Error(response?.message || t('submit_error'));
      }

      resetForm();
      await onSubmitted?.(response.data?.videoPin);
      onClose();
    } catch (err) {
      setSubmitError(err?.message || t('submit_error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('video_submit_title')}
      size="xl"
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form="video-pin-submission-form"
            loading={isSubmitting}
            disabled={!canSubmit}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            {t('submit_video_pin')}
          </Button>
        </>
      )}
    >
      <form id="video-pin-submission-form" className="space-y-5" onSubmit={handleSubmit}>
        <p className="text-sm text-gray-600">{t('video_submit_description')}</p>

        <VideoEmbedField
          value={form.sourceUrl}
          onChange={(preview) => {
            setForm((current) => ({
              ...current,
              sourceUrl: preview?.url || '',
            }));
          }}
          onTitleSuggest={(title) => {
            if (isTitleDirty) return;
            setForm((current) => ({ ...current, title }));
          }}
          isTitleDirty={isTitleDirty}
        />

        <div>
          <label htmlFor="video-pin-title" className="block text-sm font-medium text-gray-700">
            {t('video_title')}
          </label>
          <input
            id="video-pin-title"
            type="text"
            value={form.title}
            onChange={(event) => {
              setIsTitleDirty(true);
              setForm((current) => ({ ...current, title: event.target.value }));
            }}
            maxLength={200}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="video-pin-type" className="block text-sm font-medium text-gray-700">
              {t('content_type')}
            </label>
            <select
              id="video-pin-type"
              value={form.contentType}
              onChange={(event) => setForm((current) => ({ ...current, contentType: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="viral">{t('content_type_viral')}</option>
              <option value="live">{t('content_type_live')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="video-pin-category" className="block text-sm font-medium text-gray-700">
              {t('category')}
            </label>
            <select
              id="video-pin-category"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {VIDEO_PIN_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {getTranslatedCategoryLabel(category, t)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="video-pin-expiry" className="block text-sm font-medium text-gray-700">
              {t('expires_in')}
            </label>
            <select
              id="video-pin-expiry"
              value={form.expiresInHours}
              onChange={(event) => setForm((current) => ({ ...current, expiresInHours: Number(event.target.value) }))}
              disabled={form.contentType !== 'live'}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {LIVE_EXPIRY_OPTIONS.map((hours) => (
                <option key={hours} value={hours}>
                  {t(`expires_${hours}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t('map_pick_title')}</h3>
          <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
            <LocationPickerMap
              lat={form.lat}
              lng={form.lng}
              onChange={({ lat, lng }) => setForm((current) => ({
                ...current,
                lat: Number(lat).toFixed(6),
                lng: Number(lng).toFixed(6),
              }))}
              className="h-72 w-full"
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('lat')}
              <input
                type="number"
                step="0.000001"
                value={form.lat}
                onChange={(event) => setForm((current) => ({ ...current, lat: event.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              {t('lng')}
              <input
                type="number"
                step="0.000001"
                value={form.lng}
                onChange={(event) => setForm((current) => ({ ...current, lng: event.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {submitError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        )}
      </form>
    </Modal>
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
  const [visibleLayers, setVisibleLayers] = useState({ cameras: true, live: true, viral: true });
  const [cameraSearch, setCameraSearch] = useState('');
  const [cameraStatusFilter, setCameraStatusFilter] = useState('all');
  const [videoCategoryFilter, setVideoCategoryFilter] = useState('all');
  const [videoSort, setVideoSort] = useState('newest');
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState(null);
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
  const {
    data: videoPins,
    loading: videoPinsLoading,
    error: videoPinsError,
    refetch: refetchVideoPins,
  } = useAsyncData(
    async () => {
      const response = await videoPinAPI.getAll({
        contentType: 'all',
        category: videoCategoryFilter,
        sort: videoSort,
      });
      if (!response?.success) {
        throw new Error(response?.message || t('video_load_error_description'));
      }
      return response.data?.videoPins || [];
    },
    [videoCategoryFilter, videoSort],
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
  const allVideoPins = useMemo(() => videoPins || [], [videoPins]);
  const liveVideoPins = useMemo(
    () => allVideoPins.filter((pin) => pin.contentType === 'live'),
    [allVideoPins]
  );
  const viralVideoPins = useMemo(
    () => allVideoPins.filter((pin) => pin.contentType !== 'live'),
    [allVideoPins]
  );
  const visibleCameras = useMemo(
    () => (visibleLayers.cameras ? filteredCameras : []),
    [filteredCameras, visibleLayers.cameras]
  );
  const visibleVideoPins = useMemo(
    () => allVideoPins.filter((pin) => visibleLayers[pin.contentType] !== false),
    [allVideoPins, visibleLayers]
  );

  const highlightedMarkerId = hoveredCardId || hoveredMarkerId || null;
  const cameraMarkers = useMemo(
    () => buildCameraMarkers(visibleCameras, highlightedMarkerId),
    [visibleCameras, highlightedMarkerId]
  );
  const videoMarkers = useMemo(
    () => buildVideoPinMarkers(visibleVideoPins, highlightedMarkerId),
    [visibleVideoPins, highlightedMarkerId]
  );
  const markers = useMemo(
    () => [...cameraMarkers, ...videoMarkers],
    [cameraMarkers, videoMarkers]
  );
  // Stable bounds and center: derived from camera coordinates only so that
  // BaseMap.fitBounds is NOT re-triggered when hover/focus state changes (which only
  // affect marker icon variant, not the viewport).  fitBounds fires only when the
  // marker coordinate data actually changes.
  const mapPoints = useMemo(
    () => [
      ...visibleCameras
        .filter(hasMapLocation)
        .map((c) => ({ lat: Number(c.mapLocation.lat), lng: Number(c.mapLocation.lng) })),
      ...visibleVideoPins
        .filter((pin) => isValidCoord(pin.lat, -90, 90) && isValidCoord(pin.lng, -180, 180))
        .map((pin) => ({ lat: Number(pin.lat), lng: Number(pin.lng) })),
    ],
    [visibleCameras, visibleVideoPins]
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
  const liveVideoCount = liveVideoPins.length;
  const viralVideoCount = viralVideoPins.length;

  function handleLayerToggle(layer) {
    setVisibleLayers((current) => ({
      ...current,
      [layer]: !current[layer],
    }));
  }

  function handleFocusCameraOnMap(cameraId) {
    setHoveredCardId(cameraId);
    setHoveredMarkerId(cameraId);
    if (typeof document !== 'undefined') {
      document.getElementById('camera-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleMarkerClick(markerId) {
    if (String(markerId).startsWith('video-pin:')) {
      const pinId = String(markerId).slice('video-pin:'.length);
      const pin = allVideoPins.find((item) => String(item.id) === pinId);
      const safeUrl = pin ? getVideoPinWatchUrl(pin) : null;
      if (safeUrl && typeof window !== 'undefined') {
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const camera = allCameras.find((c) => c.id === markerId);
    const safeUrl = camera ? getSafeCameraUrl(camera.url) : null;
    if (safeUrl && typeof window !== 'undefined') {
      window.open(safeUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleVideoPinSubmitted() {
    setSubmissionNotice(t('submitted_for_review'));
    await refetchVideoPins();
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
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:w-[520px]">
                <span className="rounded-lg bg-slate-50 px-3 py-2 font-semibold text-gray-800">{t('summary_total', { count: allCameras.length })}</span>
                <span className="rounded-lg bg-green-50 px-3 py-2 font-semibold text-green-800">{t('summary_working', { count: workingCount })}</span>
                <span className="rounded-lg bg-amber-50 px-3 py-2 font-semibold text-amber-800">{t('summary_unavailable', { count: unavailableCount })}</span>
                <span className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800">{t('summary_mapped', { count: mappedCount })}</span>
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
            {submissionNotice && (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {submissionNotice}
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

              <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <LayerToggle active={visibleLayers.cameras} onClick={() => handleLayerToggle('cameras')}>
                    <VideoCameraIcon className="h-4 w-4" />
                    {t('layer_cameras')}
                  </LayerToggle>
                  <LayerToggle active={visibleLayers.live} onClick={() => handleLayerToggle('live')}>
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    {t('layer_live_videos')}
                  </LayerToggle>
                  <LayerToggle active={visibleLayers.viral} onClick={() => handleLayerToggle('viral')}>
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                    {t('layer_tiktok_videos')}
                  </LayerToggle>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center gap-1.5">
                      <FunnelIcon className="h-4 w-4" />
                      {t('category_filter')}
                    </span>
                    <select
                      value={videoCategoryFilter}
                      onChange={(event) => setVideoCategoryFilter(event.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">{t('category_all')}</option>
                      {VIDEO_PIN_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {getTranslatedCategoryLabel(category, t)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-gray-700">
                    {t('sort_label')}
                    <select
                      value={videoSort}
                      onChange={(event) => setVideoSort(event.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {VIDEO_PIN_SORTS.map((sortKey) => (
                        <option key={sortKey} value={sortKey}>
                          {t(`sort_${sortKey}`)}
                        </option>
                      ))}
                    </select>
                  </label>
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

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              {user ? (
                <Button
                  size="sm"
                  onClick={() => setIsSubmissionOpen(true)}
                  icon={<PlusIcon className="h-4 w-4" />}
                  className="w-full"
                >
                  {t('add_video_pin')}
                </Button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-10 w-full items-center justify-center rounded-md border border-blue-600 bg-white px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                >
                  {t('login_to_submit')}
                </Link>
              )}
            </div>
          </aside>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <VideoPinSection
            title={t('live_videos_title')}
            subtitle={t('live_videos_subtitle', { count: liveVideoCount })}
            pins={liveVideoPins}
            loading={videoPinsLoading}
            error={videoPinsError}
            emptyTitle={allVideoPins.length === 0 ? t('no_video_pins_title') : t('no_live_videos_title')}
            emptyDescription={allVideoPins.length === 0 ? t('no_video_pins_description') : t('no_live_videos_description')}
            onRetry={refetchVideoPins}
            t={t}
            highlightedMarkerId={highlightedMarkerId}
            onHoverChange={setHoveredCardId}
          />

          <VideoPinSection
            title={t('tiktok_videos_title')}
            subtitle={t('tiktok_videos_subtitle', { count: viralVideoCount })}
            pins={viralVideoPins}
            loading={videoPinsLoading}
            error={videoPinsError}
            emptyTitle={allVideoPins.length === 0 ? t('no_video_pins_title') : t('no_tiktok_videos_title')}
            emptyDescription={allVideoPins.length === 0 ? t('no_video_pins_description') : t('no_tiktok_videos_description')}
            onRetry={refetchVideoPins}
            t={t}
            highlightedMarkerId={highlightedMarkerId}
            onHoverChange={setHoveredCardId}
          />
        </section>
      </div>
      <VideoPinSubmissionModal
        isOpen={isSubmissionOpen}
        onClose={() => setIsSubmissionOpen(false)}
        onSubmitted={handleVideoPinSubmitted}
        t={t}
      />
    </div>
  );
}

export { buildCameraMarkers, getMapBounds };
