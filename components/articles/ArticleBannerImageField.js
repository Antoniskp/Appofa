'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FormInput from '@/components/ui/FormInput';
import AlertMessage from '@/components/ui/AlertMessage';
import { mediaAPI } from '@/lib/api';

export default function ArticleBannerImageField({
  value,
  coverImageId,
  altText,
  caption,
  credit,
  onChange,
  canManageMedia = false,
  label,
  placeholder,
  uiText = {},
}) {
  const fileInputRef = useRef(null);
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
    previewAlt: uiText.previewAlt || 'Article banner preview',
    searchPlaceholder: uiText.searchPlaceholder || 'Search by name, alt, caption, credit, or tag',
    altLabel: uiText.altLabel || 'Image alt text',
    captionLabel: uiText.captionLabel || 'Caption',
    creditLabel: uiText.creditLabel || 'Credit',
    emptyLibrary: uiText.emptyLibrary || 'No media found for this search.',
    quotaStatus: uiText.quotaStatus || 'Storage usage',
  };

  const emitFieldChange = (name, nextValue, type = 'text') => {
    onChange({ target: { name, value: nextValue, type } });
  };

  const applyMediaAsset = (asset) => {
    const articleCoverUrl = asset?.variants?.articleCover?.url || asset?.url || '';
    emitFieldChange('bannerImageUrl', articleCoverUrl);
    emitFieldChange('coverImageId', asset?.id ? String(asset.id) : '');
    emitFieldChange('bannerImageAltText', asset?.altText || '');
    emitFieldChange('bannerImageCaption', asset?.caption || '');
    emitFieldChange('bannerImageCredit', asset?.credit || '');
  };

  const loadMedia = useCallback(async () => {
    if (!canManageMedia) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await mediaAPI.list({
        usageType: 'article_cover',
        shared: 'true',
        limit: 12,
        search: search.trim() || undefined,
      });
      setMedia(response.media || []);
      setQuota(response.quota || null);
    } catch (err) {
      setError(err.message || t.libraryError);
    } finally {
      setIsLoading(false);
    }
  }, [canManageMedia, search, t.libraryError]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const response = await mediaAPI.uploadArticleImage(file, {
        usageType: 'article_cover',
        entityType: 'article',
        altText,
        caption,
        credit,
      });
      if (response.media) {
        applyMediaAsset(response.media);
        setQuota(response.quota || null);
        setMedia((current) => [response.media, ...current.filter((item) => item.id !== response.media.id)].slice(0, 12));
      }
    } catch (err) {
      setError(err.message || t.uploadError);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <FormInput
        name="bannerImageUrl"
        label={label}
        value={value}
        onChange={(event) => {
          emitFieldChange('coverImageId', '');
          onChange(event);
        }}
        placeholder={placeholder}
      />

      <input type="hidden" name="coverImageId" value={coverImageId || ''} readOnly />

      {value && (
        <div className="overflow-hidden rounded border border-gray-200 bg-gray-50">
          <img
            src={value}
            alt={altText || t.previewAlt}
            className="h-40 w-full object-cover"
          />
        </div>
      )}
      {quota && (
        <p className="text-xs text-gray-500">
          {t.quotaStatus}: {(Number(quota.usedBytes || 0) / (1024 * 1024)).toFixed(1)}MB / {(Number(quota.totalBytes || 0) / (1024 * 1024)).toFixed(1)}MB
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormInput
          name="bannerImageAltText"
          label={t.altLabel}
          value={altText || ''}
          onChange={onChange}
        />
        <FormInput
          name="bannerImageCaption"
          label={t.captionLabel}
          value={caption || ''}
          onChange={onChange}
        />
        <FormInput
          name="bannerImageCredit"
          label={t.creditLabel}
          value={credit || ''}
          onChange={onChange}
        />
      </div>

      {canManageMedia && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
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

          {error && <AlertMessage className="mt-3" message={error} />}


          {!isLoading && !error && media.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">{t.emptyLibrary}</p>
          )}

          {media.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {media.map((item) => {
                const thumbUrl = item.variants?.thumbnail?.url || item.url;
                const coverUrl = item.variants?.articleCover?.url || item.url;
                const selected = String(coverImageId || '') === String(item.id || '');
                return (
                  <button
                    key={item.id || item.url}
                    type="button"
                    onClick={() => applyMediaAsset(item)}
                    className={`overflow-hidden rounded border bg-white ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                    title={item.altText || item.originalName || t.useImageTitle}
                  >
                    <img
                      src={thumbUrl || coverUrl}
                      alt={item.altText || item.originalName || t.mediaImageAlt}
                      className="h-16 w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
