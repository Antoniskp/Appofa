'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { linkPreviewAPI } from '@/lib/api';

// Debounce delay in milliseconds
const DEBOUNCE_MS = 700;

const WATCH_ON_TIKTOK = 'Watch on TikTok ↗';

/**
 * Extract TikTok video ID from embedUrl or sourceUrl.
 * embedUrl format:  https://www.tiktok.com/embed/v2/<videoId>
 * sourceUrl format: https://www.tiktok.com/@user/video/<videoId>
 */
function extractTikTokVideoId(embedUrl, sourceUrl) {
  if (embedUrl) {
    const m = embedUrl.match(/\/embed\/v2\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
  }
  if (sourceUrl) {
    const m = sourceUrl.match(/\/video\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
  }
  return null;
}

/**
 * VideoEmbedField
 *
 * Reusable component for pasting a YouTube or TikTok URL into an article form.
 * - Shows a URL input field
 * - Debounces calls to POST /api/link-preview
 * - Shows loading / error state
 * - Auto-fills title field ONLY if title has not been manually edited ("dirty" guard)
 * - Shows an embedded player preview:
 *     YouTube → <iframe> using embedUrl
 *     TikTok  → sanitized embedHtml OR fallback link
 *
 * Props:
 *   value        {string}   current sourceUrl value
 *   onChange     {function} called with (previewData) when preview resolves
 *                           where previewData is null (cleared) or:
 *                           { provider, url, title, authorName, thumbnailUrl,
 *                             providerName, providerUrl, embedUrl, embedHtml }
 *   onTitleSuggest {function} called with (title) if title should be auto-filled
 *   isTitleDirty  {boolean} whether the user has manually edited the title
 */
export default function VideoEmbedField({
  value = '',
  onChange,
  onTitleSuggest,
  isTitleDirty = false
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [tiktokPlaying, setTiktokPlaying] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  // Use refs for callbacks and dirty flag to avoid stale closures in debounced function
  const onChangeRef = useRef(onChange);
  const onTitleSuggestRef = useRef(onTitleSuggest);
  const isTitleDirtyRef = useRef(isTitleDirty);

  // Keep refs in sync with latest props
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onTitleSuggestRef.current = onTitleSuggest; }, [onTitleSuggest]);
  useEffect(() => { isTitleDirtyRef.current = isTitleDirty; }, [isTitleDirty]);

  // Keep input in sync if parent resets the value
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fetchPreview = useCallback(async (url) => {
    if (!url || !url.trim()) {
      setStatus('idle');
      setPreview(null);
      setErrorMessage('');
      if (onChangeRef.current) onChangeRef.current(null);
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const result = await linkPreviewAPI.fetch(url.trim());

      if (result && result.success && result.data) {
        const data = result.data;
        setPreview(data);
        setTiktokPlaying(false);
        setStatus('success');
        if (onChangeRef.current) onChangeRef.current(data);
        // Auto-fill title only if title field hasn't been touched by the user
        if (!isTitleDirtyRef.current && data.title && onTitleSuggestRef.current) {
          const truncatedTitle = data.title.length > 200 ? data.title.slice(0, 200) : data.title;
          onTitleSuggestRef.current(truncatedTitle);
        }
      } else {
        setStatus('error');
        setErrorMessage((result && result.message) ? result.message : 'Could not load preview.');
        setPreview(null);
        if (onChangeRef.current) onChangeRef.current(null);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err?.message || 'Network error while fetching preview.');
      setPreview(null);
      if (onChangeRef.current) onChangeRef.current(null);
    }
  // fetchPreview has no reactive dependencies - all state is accessed via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current = null;

    if (!newValue.trim()) {
      setStatus('idle');
      setPreview(null);
      setErrorMessage('');
      if (onChange) onChange(null);
      return;
    }

    setStatus('loading');

    debounceRef.current = setTimeout(() => {
      fetchPreview(newValue);
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue('');
    setStatus('idle');
    setPreview(null);
    setErrorMessage('');
    if (onChange) onChange(null);
  };

  // Render the embedded video player
  const renderEmbedPlayer = () => {
    if (!preview) return null;

    if (preview.provider === 'youtube' && preview.embedUrl) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 bg-black aspect-video">
          <iframe
            src={preview.embedUrl}
            title={preview.title || 'YouTube video'}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }

    if (preview.provider === 'tiktok') {
      const videoId = extractTikTokVideoId(preview.embedUrl, preview.url);

      // Primary: official TikTok oEmbed iframe.
      // The iframe handles its own CDN auth; no embed.js needed.
      if (videoId) {
        // Show a static thumbnail + play button until the user clicks play.
        if (!tiktokPlaying) {
          return (
            <div className="mt-3 flex justify-center">
              <div
                style={{ maxWidth: '605px', minWidth: '325px', width: '100%' }}
                className="relative bg-black rounded-lg overflow-hidden cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label="Play TikTok video"
                onClick={() => setTiktokPlaying(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTiktokPlaying(true); } }}
              >
                {preview.thumbnailUrl ? (
                  <img
                    src={preview.thumbnailUrl}
                    alt={preview.title || 'TikTok video thumbnail'}
                    className="w-full object-cover"
                    style={{ aspectRatio: '9/16', maxHeight: '740px' }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full flex items-center justify-center bg-gray-900"
                    style={{ aspectRatio: '9/16', maxHeight: '740px' }}
                  >
                    <span className="text-white text-5xl">♪</span>
                  </div>
                )}
                {/* Play button overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                    <span className="text-white text-2xl ml-1">▶</span>
                  </div>
                  {(preview.title || preview.authorName) && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                      {preview.title && <p className="text-white text-sm font-medium line-clamp-2">{preview.title}</p>}
                      {preview.authorName && <p className="text-gray-300 text-xs mt-0.5">{preview.authorName}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="mt-3 flex justify-center">
            <div style={{ maxWidth: '605px', minWidth: '325px', width: '100%' }}>
              <iframe
                src={`https://www.tiktok.com/embed/v2/${videoId}`}
                title={preview.title || 'TikTok video'}
                style={{ width: '100%', height: '740px', border: 'none' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        );
      }

      // Secondary: try embedUrl iframe
      if (preview.embedUrl) {
        return (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 bg-black aspect-video">
            <iframe
              src={preview.embedUrl}
              title={preview.title || 'TikTok video'}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="lazy"
            />
          </div>
        );
      }

      // Final fallback: link-out card
      return (
        <div className="mt-3 rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          {preview.thumbnailUrl && (
            <img
              src={preview.thumbnailUrl}
              alt="TikTok thumbnail"
              className="w-20 h-20 object-cover rounded"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{preview.title}</p>
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-xs text-blue-600 hover:text-blue-800"
            >
              {preview.authorName || WATCH_ON_TIKTOK}
            </a>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Video URL
        <span className="ml-1 text-xs font-normal text-gray-500">(YouTube or TikTok)</span>
      </label>

      <div className="relative">
        <input
          type="url"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Paste a YouTube or TikTok link…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-20"
          autoComplete="off"
          spellCheck={false}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded"
            aria-label="Clear video URL"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status indicators */}
      {status === 'loading' && (
        <p className="text-xs text-gray-500 animate-pulse">Fetching video info…</p>
      )}

      {status === 'error' && (
        <p className="text-xs text-red-600" role="alert">
          {errorMessage || 'Could not load preview. Please check the URL.'}
        </p>
      )}

      {/* Preview card (shown on success) */}
      {status === 'success' && preview && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-start gap-3">
            {preview.thumbnailUrl && preview.provider === 'youtube' && (
              <img
                src={preview.thumbnailUrl}
                alt="Video thumbnail"
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

          {/* Embedded player */}
          {renderEmbedPlayer()}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Supported: YouTube and TikTok links. The video will be embedded in your post.
      </p>
    </div>
  );
}
