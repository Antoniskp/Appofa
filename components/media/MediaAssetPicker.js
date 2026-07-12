'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import AlertMessage from '@/components/ui/AlertMessage';
import { mediaAPI } from '@/lib/api';

function formatMegabytes(bytes) {
  return (Number(bytes || 0) / (1024 * 1024)).toFixed(1);
}

function getAssetUrl(asset, variantName) {
  return asset?.variants?.[variantName]?.url || asset?.url || '';
}

export default function MediaAssetPicker({
  canManageMedia = false,
  selectedAssetId,
  onSelect,
  uploadFields = {},
  listParams = {},
  selectVariant = 'articleCover',
  limit = 12,
  uiText = {},
}) {
  const fileInputRef = useRef(null);
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState(null);
  const [search, setSearch] = useState('');

  const t = {
    upload: uiText.upload || 'Upload photo',
    uploading: uiText.uploading || 'Uploading...',
    refresh: uiText.refresh || 'Refresh library',
    loading: uiText.loading || 'Loading...',
    libraryError: uiText.libraryError || 'Could not load media library.',
    uploadError: uiText.uploadError || 'Could not upload image.',
    useImageTitle: uiText.useImageTitle || 'Use image',
    mediaImageAlt: uiText.mediaImageAlt || 'Media library image',
    searchPlaceholder: uiText.searchPlaceholder || 'Search by name, alt, caption, credit, or tag',
    emptyLibrary: uiText.emptyLibrary || 'No media found for this search.',
    quotaStatus: uiText.quotaStatus || 'Storage usage',
  };
  const listParamsKey = JSON.stringify(listParams || {});
  const stableListParams = useMemo(() => JSON.parse(listParamsKey), [listParamsKey]);

  const loadMedia = useCallback(async () => {
    if (!canManageMedia) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await mediaAPI.list({
        ...stableListParams,
        limit,
        search: search.trim() || undefined,
      });
      setMedia(response.media || []);
      setQuota(response.quota || null);
    } catch (err) {
      setError(err.message || t.libraryError);
    } finally {
      setIsLoading(false);
    }
  }, [canManageMedia, limit, stableListParams, search, t.libraryError]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const addUploadedAsset = (asset, nextQuota) => {
    if (!asset) return;
    setQuota(nextQuota || null);
    setMedia((current) => [asset, ...current.filter((item) => item.id !== asset.id)].slice(0, limit));
    onSelect?.(asset, getAssetUrl(asset, selectVariant));
  };

  const uploadFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setError('');

    try {
      const response = await mediaAPI.upload(file, uploadFields);
      addUploadedAsset(response.media, response.quota);
    } catch (err) {
      setError(err.message || t.uploadError);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (event) => {
    uploadFile(event.target.files?.[0]);
  };

  const handlePaste = (event) => {
    const file = Array.from(event.clipboardData?.files || []).find((item) => item.type?.startsWith('image/'));
    if (file) uploadFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = Array.from(event.dataTransfer?.files || []).find((item) => item.type?.startsWith('image/'));
    if (file) uploadFile(file);
  };

  if (!canManageMedia) return null;

  return (
    <div
      className={`rounded-md border p-3 ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
      onPaste={handlePaste}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      title={uiText.dropHint || 'Drop or paste an image to upload'}
    >
      <div className="mb-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          aria-label={t.searchPlaceholder}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {isUploading ? t.uploading : t.upload}
        </button>
        <button
          type="button"
          onClick={loadMedia}
          disabled={isLoading}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {isLoading ? t.loading : t.refresh}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleFileChange}
      />

      {quota && (
        <p className="mt-2 text-xs text-gray-500">
          {t.quotaStatus}: {formatMegabytes(quota.usedBytes)}MB / {formatMegabytes(quota.totalBytes)}MB
        </p>
      )}

      {error && <AlertMessage className="mt-3" message={error} />}

      {!isLoading && !error && media.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">{t.emptyLibrary}</p>
      )}

      {media.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {media.map((item) => {
            const thumbUrl = getAssetUrl(item, 'thumbnail') || getAssetUrl(item, selectVariant);
            const selected = String(selectedAssetId || '') === String(item.id || '');
            return (
              <button
                key={item.id || item.url}
                type="button"
                onClick={() => onSelect?.(item, getAssetUrl(item, selectVariant))}
                className={`overflow-hidden rounded border bg-white ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                title={item.altText || item.originalName || t.useImageTitle}
              >
                <Image
                  src={thumbUrl}
                  alt={item.altText || item.originalName || t.mediaImageAlt}
                  width={160}
                  height={64}
                  unoptimized
                  className="h-16 w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
