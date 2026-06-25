'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FormInput from '@/components/ui/FormInput';
import AlertMessage from '@/components/ui/AlertMessage';
import { mediaAPI } from '@/lib/api';
import { useTranslations } from 'next-intl';

export default function ArticleBannerImageField({
  value,
  onChange,
  canManageMedia = false,
  label,
  placeholder,
}) {
  const tArticles = useTranslations('articles');
  const fileInputRef = useRef(null);
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const setBannerUrl = (url) => {
    onChange({
      target: {
        name: 'bannerImageUrl',
        value: url,
        type: 'text',
      },
    });
  };

  const loadMedia = useCallback(async () => {
    if (!canManageMedia) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await mediaAPI.list({ usageType: 'article_banner', limit: 12 });
      setMedia(response.media || []);
    } catch (err) {
      setError(err.message || tArticles('media_library_load_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [canManageMedia]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const response = await mediaAPI.uploadArticleImage(file, { usageType: 'article_banner' });
      const nextUrl = response.media?.url;
      if (nextUrl) {
        setBannerUrl(nextUrl);
        setMedia((current) => [response.media, ...current.filter((item) => item.id !== response.media.id)].slice(0, 12));
      }
    } catch (err) {
      setError(err.message || tArticles('media_image_upload_failed'));
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
        onChange={onChange}
        placeholder={placeholder}
      />

      {value && (
        <div className="overflow-hidden rounded border border-gray-200 bg-gray-50">
          <img
            src={value}
            alt={tArticles('article_banner_preview_alt')}
            className="h-40 w-full object-cover"
          />
        </div>
      )}

      {canManageMedia && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="article-banner-upload-button"
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {isUploading ? tArticles('media_uploading') : tArticles('media_upload_photo')}
            </button>
            <button
              type="button"
              onClick={loadMedia}
              disabled={isLoading}
              data-testid="article-banner-refresh-button"
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {isLoading ? tArticles('media_loading') : tArticles('media_refresh_library')}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            data-testid="article-banner-file-input"
            onChange={handleFileChange}
          />

          {error && <AlertMessage className="mt-3" message={error} />}

          {media.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {media.map((item) => (
                <button
                  key={item.id || item.url}
                  type="button"
                  onClick={() => setBannerUrl(item.url)}
                  className={`overflow-hidden rounded border bg-white ${value === item.url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                  title={item.altText || item.originalName || tArticles('media_use_image_title')}
                >
                  <img
                    src={item.url}
                    alt={item.altText || item.originalName || tArticles('media_library_image_alt')}
                    className="h-16 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
