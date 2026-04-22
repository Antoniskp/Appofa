'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { idSlug } from '@/lib/utils/slugify';
import { useTranslations } from 'next-intl';

/**
 * VideoFeedCard
 *
 * Full-width video card for the /videos feed. Features:
 * - Lazy-loaded video embed (iframe rendered only when near viewport)
 * - IntersectionObserver-based autoplay for YouTube (muted); TikTok stays click-to-play
 * - Rich metadata: title, provider badge, author, category, tags, relative timestamp, summary
 * - "Watch on YouTube/TikTok" external link
 *
 * Props:
 *   article  {object}  video article object from the API
 *   onPlay   {function} optional callback so the parent can pause other videos
 *             receives a ref to the iframe postMessage pause function
 */

function extractTikTokVideoId(embedUrl, sourceUrl) {
  if (embedUrl) {
    const m = embedUrl.match(/\/embed\/v2\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
  }
  if (sourceUrl) {
    const m = sourceUrl.match(/\/(?:video|photo)\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
  }
  return null;
}

/** Build a YouTube embed URL with the given extra params appended. */
function buildYouTubeSrc(baseEmbedUrl, extraParams = {}) {
  if (!baseEmbedUrl) return '';
  const url = new URL(baseEmbedUrl, 'https://www.youtube-nocookie.com');
  Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

/** Send a command to a YouTube iframe via postMessage. */
function sendYouTubeCommand(iframe, func) {
  if (!iframe) return;
  try {
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func }),
      '*'
    );
  } catch {
    // cross-origin restrictions – silently ignore
  }
}

// ---------------------------------------------------------------------------
// YouTube player
// ---------------------------------------------------------------------------
function YouTubePlayer({ embedUrl, title, sourceUrl, onPlay, onPauseRef }) {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  // Once true, stays true — prevents destroying the iframe on scroll-away
  const [hasBeenNear, setHasBeenNear] = useState(false);
  // Tracks whether the YouTube iframe API has fired onReady
  const [playerReady, setPlayerReady] = useState(false);
  // True when the play observer wants the video to be playing
  const shouldPlayRef = useRef(false);

  // Register the pause callback so the parent can pause this video
  useEffect(() => {
    if (onPauseRef) {
      onPauseRef.current = () => sendYouTubeCommand(iframeRef.current, 'pauseVideo');
    }
  }, [onPauseRef]);

  // Lazy-load: render the iframe once the card is near the viewport;
  // once set to true it never goes back to false so the iframe is never destroyed.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasBeenNear(true);
      },
      { rootMargin: '200px 0px', threshold: 0 }
    );
    nearObserver.observe(el);
    return () => nearObserver.disconnect();
  }, []);

  // Listen for the YouTube iframe API onReady / onStateChange messages
  useEffect(() => {
    if (!hasBeenNear) return;

    function handleMessage(event) {
      if (!iframeRef.current) return;
      // Only handle messages from our iframe's contentWindow
      if (event.source !== iframeRef.current.contentWindow) return;

      let data;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (data?.event === 'onReady') {
        setPlayerReady(true);
        // If the play observer already fired, start playback now
        if (shouldPlayRef.current) {
          sendYouTubeCommand(iframeRef.current, 'playVideo');
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasBeenNear]);

  // Autoplay / pause when the video scrolls in/out of the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasBeenNear) return;

    const playObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          shouldPlayRef.current = true;
          if (playerReady) {
            sendYouTubeCommand(iframeRef.current, 'playVideo');
          }
          onPlay?.();
        } else {
          shouldPlayRef.current = false;
          sendYouTubeCommand(iframeRef.current, 'pauseVideo');
        }
      },
      { threshold: 0.5 }
    );
    playObserver.observe(el);
    return () => playObserver.disconnect();
  }, [hasBeenNear, playerReady, onPlay]);

  // Build src with all params needed for JS API + muted autoplay
  const iframeSrc = hasBeenNear
    ? buildYouTubeSrc(embedUrl, {
        enablejsapi: 1,
        autoplay: 1,
        mute: 1,
        rel: 0,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
      })
    : '';

  return (
    <div ref={containerRef} className="aspect-video bg-black w-full">
      {hasBeenNear && (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TikTok player (click-to-play thumbnail)
// ---------------------------------------------------------------------------
function TikTokPlayer({ embedUrl, sourceUrl, sourceMeta, title, tArticles }) {
  const videoId = extractTikTokVideoId(embedUrl, sourceUrl);
  const [playing, setPlaying] = useState(false);
  const thumbnail = sourceMeta?.thumbnailUrl;
  const author = sourceMeta?.authorName;

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center">
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline text-sm"
        >
          {tArticles('watch_on_tiktok')}
        </a>
      </div>
    );
  }

  if (!playing) {
    return (
      <div
        className="relative bg-black flex justify-center cursor-pointer"
        style={{ minHeight: '360px' }}
        role="button"
        tabIndex={0}
        aria-label={tArticles('play_tiktok_video')}
        onClick={() => setPlaying(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setPlaying(true);
          }
        }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title || 'TikTok video thumbnail'}
            className="object-cover h-full"
            style={{ maxHeight: '600px', aspectRatio: '9/16' }}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full flex items-center justify-center bg-gray-900"
            style={{ aspectRatio: '9/16', maxHeight: '600px' }}
          >
            <span className="text-white text-5xl">♪</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
          <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
            <span className="text-white text-2xl ml-1">▶</span>
          </div>
          {(title || author) && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {title && (
                <p className="text-white text-sm font-semibold line-clamp-2">{title}</p>
              )}
              {author && (
                <p className="text-gray-300 text-xs mt-1">@{author}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-black py-4">
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

// ---------------------------------------------------------------------------
// Provider badge
// ---------------------------------------------------------------------------
function ProviderBadge({ provider }) {
  if (provider === 'youtube') {
    return (
      <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        YouTube
      </span>
    );
  }
  if (provider === 'tiktok') {
    return (
      <span className="inline-flex items-center gap-1 bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded">
        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
        TikTok
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main VideoFeedCard component
// ---------------------------------------------------------------------------
export default function VideoFeedCard({ article, onPlay }) {
  const tArticles = useTranslations('articles');
  const pauseRef = useRef(null);
  const isYouTube = article?.sourceProvider === 'youtube';
  const isTikTok = article?.sourceProvider === 'tiktok';

  // Expose pause function to parent via onPlay callback pattern
  const handlePlay = useCallback(() => {
    onPlay?.(() => {
      pauseRef.current?.();
    });
  }, [onPlay]);

  if (!article) return null;

  const {
    id,
    title,
    summary,
    category,
    sourceProvider,
    sourceUrl,
    embedUrl,
    sourceMeta,
    author,
    createdAt,
    tags,
  } = article;

  const videoTitle = sourceMeta?.title || title || tArticles('video');
  const authorName = sourceMeta?.authorName;
  const postingUser = author?.username;
  const articleHref = `/articles/${idSlug(id, title)}`;

  const relativeTime = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    : null;

  const watchLabel = isYouTube ? tArticles('watch_on_youtube') : tArticles('watch_on_tiktok');

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow duration-200 hover:shadow-md">
      {/* Video player */}
      <div className="bg-black">
        {isYouTube && (
          <YouTubePlayer
            embedUrl={embedUrl}
            title={videoTitle}
            sourceUrl={sourceUrl}
            onPlay={handlePlay}
            onPauseRef={pauseRef}
          />
        )}
        {isTikTok && (
          <TikTokPlayer
            embedUrl={embedUrl}
            sourceUrl={sourceUrl}
            sourceMeta={sourceMeta}
            title={videoTitle}
            tArticles={tArticles}
          />
        )}
        {!isYouTube && !isTikTok && (
          <div className="aspect-video flex items-center justify-center bg-gray-900">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline text-sm"
            >
              {tArticles('watch_video')} ↗
            </a>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-4 sm:p-5">
        {/* Provider badge + category + timestamp row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <ProviderBadge provider={sourceProvider} />
          {category && (
            <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              {category}
            </span>
          )}
          {relativeTime && (
            <span className="text-xs text-gray-400 ml-auto">{relativeTime}</span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2 hover:text-blue-700 transition-colors">
          <Link href={articleHref}>{videoTitle}</Link>
        </h2>

        {/* Creator row */}
        {(authorName || postingUser) && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
            {authorName && (
              <span className="font-medium text-gray-700">@{authorName}</span>
            )}
            {authorName && postingUser && (
              <span className="text-gray-300">·</span>
            )}
            {postingUser && (
              <span>
                {tArticles('posted_by')}{' '}
                <Link
                  href={`/users/${postingUser}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {postingUser}
                </Link>
              </span>
            )}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
            {summary}
          </p>
        )}

        {/* Tags */}
        {Array.isArray(tags) && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* External link */}
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 transition-colors ${
              isYouTube
                ? 'text-red-600 hover:text-red-800'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            {watchLabel}
          </a>
        )}
      </div>
    </article>
  );
}
