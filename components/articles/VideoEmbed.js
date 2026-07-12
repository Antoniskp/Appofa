'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import TikTokEmbedPlayer from '@/components/articles/TikTokEmbedPlayer';

/**
 * Renders an embedded video player for YouTube or TikTok.
 *
 * YouTube uses the stored privacy-enhanced embed URL. TikTok uses the shared
 * click-to-play player around the official /embed/v2/<videoId> endpoint.
 */
export default function VideoEmbed({ article, compact = false, autoplay = false }) {
  const tArticles = useTranslations('articles');
  const [youtubeMuted, setYoutubeMuted] = useState(true);
  const youtubeIframeRef = useRef(null);

  useEffect(() => {
    setYoutubeMuted(true);
  }, [article?.sourceUrl]);

  if (!article?.sourceUrl || !article?.sourceProvider) return null;

  const { sourceProvider, sourceUrl, embedUrl, sourceMeta } = article;
  const title = sourceMeta?.title || article.title || tArticles('video');
  const author = sourceMeta?.authorName || null;
  const thumbnail = sourceMeta?.thumbnailUrl || null;
  const outerMargin = compact ? '' : 'mb-8';

  if (sourceProvider === 'youtube') {
    if (!embedUrl) {
      return (
        <div className={`${outerMargin} rounded-lg border border-gray-200 p-4 bg-gray-50`}>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {tArticles('watch_on_youtube')}
          </a>
        </div>
      );
    }

    const iframeSrc = autoplay
      ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&enablejsapi=1`
      : embedUrl;

    function handleUnmute() {
      if (youtubeIframeRef.current) {
        let targetOrigin = 'https://www.youtube.com';
        try {
          const { hostname } = new URL(embedUrl);
          if (hostname === 'www.youtube-nocookie.com' || hostname === 'youtube-nocookie.com') {
            targetOrigin = 'https://www.youtube-nocookie.com';
          }
        } catch {
          // Fall back to youtube.com for malformed embed URLs.
        }
        youtubeIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
          targetOrigin
        );
      }
      setYoutubeMuted(false);
    }

    return (
      <div className={`${outerMargin} rounded-lg overflow-hidden border border-gray-200 shadow-sm`}>
        <div className="aspect-video bg-black relative">
          <iframe
            ref={youtubeIframeRef}
            src={iframeSrc}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
          {autoplay && youtubeMuted && (
            <button
              onClick={handleUnmute}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 text-white text-sm font-medium hover:bg-black/90 transition-colors"
              aria-label={tArticles('unmute_video')}
            >
              {tArticles('unmute')}
            </button>
          )}
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
              {tArticles('watch_on_youtube')}
            </a>
          </div>
        )}
      </div>
    );
  }

  if (sourceProvider === 'tiktok') {
    return (
      <TikTokEmbedPlayer
        embedUrl={embedUrl}
        sourceUrl={sourceUrl}
        title={title}
        authorName={author}
        thumbnailUrl={thumbnail}
        className={outerMargin}
        compact={compact}
        showMeta={!compact}
      />
    );
  }

  return null;
}
