'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { linkPreviewAPI } from '@/lib/api';
import TikTokEmbedPlayer from '@/components/articles/TikTokEmbedPlayer';

const DEBOUNCE_MS = 700;

/**
 * Reusable field for pasting a YouTube or TikTok URL into an article form.
 * It fetches preview metadata, suggests a title, and renders a safe preview.
 */
export default function VideoEmbedField({
  value = '',
  onChange,
  onTitleSuggest,
  isTitleDirty = false,
}) {
  const tArticles = useTranslations('articles');
  const [inputValue, setInputValue] = useState(value || '');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onTitleSuggestRef = useRef(onTitleSuggest);
  const isTitleDirtyRef = useRef(isTitleDirty);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onTitleSuggestRef.current = onTitleSuggest; }, [onTitleSuggest]);
  useEffect(() => { isTitleDirtyRef.current = isTitleDirty; }, [isTitleDirty]);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const clearInFlightRequest = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const fetchPreview = useCallback(async (url) => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setStatus('idle');
      setPreview(null);
      setErrorMessage('');
      onChangeRef.current?.(null);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setErrorMessage('');

    try {
      const result = await linkPreviewAPI.fetch(trimmedUrl, { signal: controller.signal });
      if (controller.signal.aborted) return;

      if (result?.success && result.data) {
        const data = result.data;
        setPreview(data);
        setStatus('success');
        onChangeRef.current?.(data);

        if (!isTitleDirtyRef.current && data.title && onTitleSuggestRef.current) {
          const truncatedTitle = data.title.length > 200 ? data.title.slice(0, 200) : data.title;
          onTitleSuggestRef.current(truncatedTitle);
        }
      } else {
        setStatus('error');
        setErrorMessage(result?.message || tArticles('preview_load_error'));
        setPreview(null);
        onChangeRef.current?.(null);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;

      setStatus('error');
      setErrorMessage(err?.message || tArticles('preview_network_error'));
      setPreview(null);
      onChangeRef.current?.(null);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [tArticles]);

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    clearInFlightRequest();

    if (!newValue.trim()) {
      setStatus('idle');
      setPreview(null);
      setErrorMessage('');
      onChange?.(null);
      return;
    }

    setStatus('loading');
    debounceRef.current = setTimeout(() => {
      fetchPreview(newValue);
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    clearInFlightRequest();
    setInputValue('');
    setStatus('idle');
    setPreview(null);
    setErrorMessage('');
    onChange?.(null);
  };

  const renderEmbedPlayer = () => {
    if (!preview) return null;

    if (preview.provider === 'youtube' && preview.embedUrl) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 bg-black aspect-video">
          <iframe
            src={preview.embedUrl}
            title={preview.title || tArticles('youtube_video')}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }

    if (preview.provider === 'tiktok') {
      return (
        <TikTokEmbedPlayer
          embedUrl={preview.embedUrl}
          sourceUrl={preview.url}
          title={preview.title || tArticles('tiktok_video')}
          authorName={preview.authorName}
          thumbnailUrl={preview.thumbnailUrl}
          className="mt-3"
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {tArticles('video_url')}
        <span className="ml-1 text-xs font-normal text-gray-500">({tArticles('video_url_hint')})</span>
      </label>

      <div className="relative">
        <input
          type="url"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={tArticles('video_url_placeholder')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-20"
          autoComplete="off"
          spellCheck={false}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded"
            aria-label={tArticles('clear_video_url')}
          >
            {tArticles('clear')}
          </button>
        )}
      </div>

      {status === 'loading' && (
        <p className="text-xs text-gray-500 animate-pulse">{tArticles('fetching_video_info')}</p>
      )}

      {status === 'error' && (
        <p className="text-xs text-red-600" role="alert">
          {errorMessage || tArticles('preview_load_error_help')}
        </p>
      )}

      {status === 'success' && preview && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-start gap-3">
            {preview.thumbnailUrl && preview.provider === 'youtube' && (
              <img
                src={preview.thumbnailUrl}
                alt={tArticles('video_thumbnail')}
                className="w-24 h-16 object-cover rounded flex-shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              {preview.title && (
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">{preview.title}</p>
              )}
              {preview.authorName && (
                <p className="text-xs text-gray-500 mt-0.5">{preview.authorName}</p>
              )}
              <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 capitalize">
                {preview.provider}
              </span>
            </div>
          </div>

          {renderEmbedPlayer()}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {tArticles('video_embed_supported')}
      </p>
    </div>
  );
}
