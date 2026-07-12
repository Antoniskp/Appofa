'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { buildTikTokEmbedUrl, extractTikTokVideoId } from '@/lib/utils/tiktokEmbed';

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-0.5 fill-current" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function FallbackLink({ sourceUrl, thumbnailUrl, title, authorName, variant, className = '' }) {
  const tArticles = useTranslations('articles');
  const label = authorName || tArticles('watch_on_tiktok');

  if (variant === 'dark') {
    return (
      <div className={`${className} aspect-video bg-gray-900 flex items-center justify-center`}>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline text-sm"
        >
          {label}
        </a>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg border border-gray-200 p-4 flex items-center gap-4 bg-gray-50`}>
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={tArticles('tiktok_thumbnail')}
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
          {label}
        </a>
      </div>
    </div>
  );
}

export default function TikTokEmbedPlayer({
  embedUrl,
  sourceUrl,
  title,
  authorName,
  thumbnailUrl,
  className = '',
  compact = false,
  rounded = true,
  fallbackVariant = 'card',
  maxWidth = 605,
  maxHeight = 740,
  iframeHeight = 740,
  placeholderMinHeight,
  showMeta = true,
}) {
  const tArticles = useTranslations('articles');
  const [playing, setPlaying] = useState(false);
  const videoId = extractTikTokVideoId(embedUrl, sourceUrl);

  useEffect(() => {
    setPlaying(false);
  }, [embedUrl, sourceUrl]);

  if (!videoId) {
    return (
      <FallbackLink
        sourceUrl={sourceUrl}
        thumbnailUrl={thumbnailUrl}
        title={title}
        authorName={authorName}
        variant={fallbackVariant}
        className={className}
      />
    );
  }

  const frameStyle = {
    maxWidth: `${maxWidth}px`,
    width: '100%',
  };
  const previewStyle = {
    aspectRatio: '9 / 16',
    maxHeight: `${maxHeight}px`,
    minHeight: placeholderMinHeight ? `${placeholderMinHeight}px` : undefined,
  };
  const iframeStyle = {
    width: '100%',
    height: `clamp(560px, 178vw, ${iframeHeight}px)`,
    border: 'none',
  };
  const cornerClass = rounded ? 'rounded-lg' : '';

  if (!playing) {
    return (
      <div className={`${className} flex justify-center bg-black`}>
        <div
          style={frameStyle}
          className={`relative bg-black overflow-hidden cursor-pointer ${cornerClass}`}
          role="button"
          tabIndex={0}
          aria-label={tArticles('play_tiktok_video')}
          onClick={() => setPlaying(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setPlaying(true);
            }
          }}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title || tArticles('tiktok_video_thumbnail')}
              className="w-full object-cover"
              style={previewStyle}
              loading="lazy"
            />
          ) : (
            <div
              className="w-full flex items-center justify-center bg-gray-900"
              style={previewStyle}
            >
              <span className="text-white text-sm font-semibold tracking-wide">TikTok</span>
            </div>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center text-white">
              <PlayIcon />
            </div>
            {!compact && showMeta && (title || authorName) && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/75 to-transparent">
                {title && <p className="text-white text-sm font-medium line-clamp-2">{title}</p>}
                {authorName && <p className="text-gray-300 text-xs mt-0.5">{authorName}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} flex justify-center bg-black`}>
      <div style={frameStyle}>
        <iframe
          src={buildTikTokEmbedUrl(videoId)}
          title={title || tArticles('tiktok_video')}
          style={iframeStyle}
          allow="autoplay; encrypted-media"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
