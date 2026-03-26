'use client';

import { useState } from 'react';

/**
 * VideoEmbed
 *
 * Renders an embedded video player for YouTube or TikTok.
 * - YouTube: renders an <iframe> using the stored embedUrl (youtube-nocookie CDN).
 *            When autoplay=true, appends autoplay=1&mute=1 (mute is required by
 *            browsers for policy-compliant autoplay).
 * - TikTok:  uses the official oEmbed <iframe> at https://www.tiktok.com/embed/v2/<videoId>.
 *            This avoids the blockquote + embed.js approach which triggers webmssdk.js
 *            to fetch signed CDN URLs tied to the original publisher's domain, causing
 *            403 errors and "Cannot read properties of undefined (reading 'prod')" crashes.
 *            No `sandbox` attribute is applied to TikTok iframes: sandboxing breaks
 *            TikTok's internal webmssdk.js initialisation (the SDK cannot read its
 *            production-environment config), which prevents playback entirely.
 *            The `autoplay` prop is intentionally ignored for TikTok — TikTok always
 *            uses a click-to-play thumbnail gate regardless of `autoplay`. Injecting
 *            the TikTok iframe immediately on page load (bypassing the gate) causes
 *            webmssdk.js to crash with "Cannot read properties of undefined (reading
 *            'prod')" before TikTok's SDK environment config is initialised.
 *
 * Props:
 *   article  {object}  article data with sourceUrl, sourceProvider, embedUrl,
 *                      embedHtml, sourceMeta fields
 */

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

export default function VideoEmbed({ article, compact = false, autoplay = false }) {
  const [tiktokPlaying, setTiktokPlaying] = useState(false);

  if (!article?.sourceUrl || !article?.sourceProvider) return null;

  const { sourceProvider, sourceUrl, embedUrl, sourceMeta } = article;
  const title = sourceMeta?.title || article.title || 'Video';
  const author = sourceMeta?.authorName || null;
  const thumbnail = sourceMeta?.thumbnailUrl || null;

  // When used inside a card the caller passes compact=true to suppress the
  // large bottom margin that is designed for detail-page layouts.
  const outerMargin = compact ? '' : 'mb-8';

  // ── YouTube ─────────────────────────────────────────────────────────────────
  if (sourceProvider === 'youtube') {
    if (!embedUrl) {
      // Fallback: link out
      return (
        <div className={`${outerMargin} rounded-lg border border-gray-200 p-4 bg-gray-50`}>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Watch on YouTube ↗
          </a>
        </div>
      );
    }

    const iframeSrc = autoplay
      ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1`
      : embedUrl;

    return (
      <div className={`${outerMargin} rounded-lg overflow-hidden border border-gray-200 shadow-sm`}>
        <div className="aspect-video bg-black">
          <iframe
            src={iframeSrc}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        {!compact && (title || author) && (
          <div className="px-4 py-3 bg-white border-t border-gray-100">
            {title && <p className="text-sm font-medium text-gray-900">{title}</p>}
            {author && <p className="text-xs text-gray-500 mt-0.5">{author}</p>}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-600 hover:text-red-800 mt-1 inline-block"
            >
              Watch on YouTube ↗
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── TikTok ──────────────────────────────────────────────────────────────────
  if (sourceProvider === 'tiktok') {
    const videoId = extractTikTokVideoId(embedUrl, sourceUrl);

    // Primary: official TikTok oEmbed iframe.
    // The iframe handles its own CDN auth internally; no embed.js needed.
    if (videoId) {
      // Always show a static thumbnail + play button until the user clicks play.
      // autoplay is intentionally ignored for TikTok (see JSDoc above).
      if (!tiktokPlaying) {
        return (
          <div className={`${outerMargin} flex flex-col items-center`}>
            <div
              style={{ maxWidth: '605px', minWidth: '325px', width: '100%' }}
              className="relative bg-black rounded-lg overflow-hidden cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="Play TikTok video"
              onClick={() => setTiktokPlaying(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTiktokPlaying(true); } }}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={title || 'TikTok video thumbnail'}
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
                {!compact && (title || author) && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    {title && <p className="text-white text-sm font-medium line-clamp-2">{title}</p>}
                    {author && <p className="text-gray-300 text-xs mt-0.5">{author}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className={`${outerMargin} flex flex-col items-center`}>
          <div style={{ maxWidth: '605px', minWidth: '325px', width: '100%' }}>
            <iframe
              src={`https://www.tiktok.com/embed/v2/${videoId}`}
              title={title}
              style={{ width: '100%', height: '740px', border: 'none' }}
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      );
    }

    // Secondary: try the embedUrl iframe (may work in some contexts).
    // Gate behind click-to-play to prevent webmssdk.js from being injected
    // immediately on page load before TikTok's SDK environment is initialised.
    if (embedUrl) {
      if (!tiktokPlaying) {
        return (
          <div className={`${outerMargin} rounded-lg overflow-hidden border border-gray-200 shadow-sm`}>
            <div
              className="aspect-video bg-black flex items-center justify-center relative cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="Play TikTok video"
              onClick={() => setTiktokPlaying(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTiktokPlaying(true); } }}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={title || 'TikTok video thumbnail'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <span className="text-white text-5xl">♪</span>
                </div>
              )}
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl ml-1">▶</span>
                </div>
              </div>
            </div>
            {!compact && (title || author) && (
              <div className="px-4 py-3 bg-white border-t border-gray-100">
                {title && <p className="text-sm font-medium text-gray-900">{title}</p>}
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={author ? `View ${author} on TikTok` : 'Watch on TikTok'}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                >
                  {author || WATCH_ON_TIKTOK}
                </a>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className={`${outerMargin} rounded-lg overflow-hidden border border-gray-200 shadow-sm`}>
          <div className="aspect-video bg-black flex items-center justify-center">
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="lazy"
            />
          </div>
          {!compact && (title || author) && (
            <div className="px-4 py-3 bg-white border-t border-gray-100">
              {title && <p className="text-sm font-medium text-gray-900">{title}</p>}
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={author ? `View ${author} on TikTok` : 'Watch on TikTok'}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
              >
                {author || WATCH_ON_TIKTOK}
              </a>
            </div>
          )}
        </div>
      );
    }

    // Final fallback card
    return (
      <div className={`${outerMargin} rounded-lg border border-gray-200 p-4 flex items-center gap-4 bg-gray-50`}>
        {thumbnail && (
          <img
            src={thumbnail}
            alt="TikTok thumbnail"
            className="w-24 h-24 object-cover rounded flex-shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-semibold text-gray-900 line-clamp-2">{title}</p>}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {author || WATCH_ON_TIKTOK}
          </a>
        </div>
      </div>
    );
  }

  return null;
}
