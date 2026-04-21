'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { idSlug } from '@/lib/utils/slugify';
import { useTranslations } from 'next-intl';

function ProviderBadge({ provider }) {
  if (provider === 'youtube') {
    return (
      <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow">
        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        YT
      </span>
    );
  }
  if (provider === 'tiktok') {
    return (
      <span className="inline-flex items-center gap-1 bg-gray-900 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow">
        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
        </svg>
        TikTok
      </span>
    );
  }
  return null;
}

/**
 * VideoThumbnailCard
 *
 * Compact thumbnail-only card for the /videos grid page.
 * Clicking navigates to the article detail page.
 *
 * Props:
 *   article  {object}  video article object from the API
 */
export default function VideoThumbnailCard({ article }) {
  const tArticles = useTranslations('articles');
  if (!article) return null;

  const {
    id,
    title,
    category,
    sourceProvider,
    sourceMeta,
    author,
    createdAt,
  } = article;

  const isTikTok = sourceProvider === 'tiktok';

  const videoTitle = sourceMeta?.title || title || tArticles('video');
  const thumbnail = sourceMeta?.thumbnailUrl || null;
  const authorName = sourceMeta?.authorName || author?.username || null;
  const articleHref = `/videos/${idSlug(id, title)}`;

  // Uniform landscape 16/9 for all providers (TikTok thumbnails are center-cropped)
  const aspectStyle = { aspectRatio: '16/9' };

  const relativeTime = (() => {
    if (!createdAt) return null;
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch {
      return null;
    }
  })();

  return (
    <Link
      href={articleHref}
      className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02] flex flex-col group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={videoTitle}
    >
      {/* Thumbnail area */}
      <div className="relative overflow-hidden bg-gray-900" style={aspectStyle}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={videoTitle}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <span className="text-white text-3xl">{isTikTok ? '♪' : '▶'}</span>
          </div>
        )}

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-white text-base ml-0.5">▶</span>
          </div>
        </div>

        {/* Provider badge — bottom-left */}
        <div className="absolute bottom-2 left-2">
          <ProviderBadge provider={sourceProvider} />
        </div>

        {/* Category badge — top-right */}
        {category && (
          <div className="absolute top-2 right-2">
            <span className="text-xs font-medium text-blue-700 bg-white/90 border border-blue-100 px-1.5 py-0.5 rounded-full shadow-sm">
              {category}
            </span>
          </div>
        )}
      </div>

      {/* Metadata below thumbnail */}
      <div className="p-2.5 flex flex-col gap-0.5 flex-1">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
          {videoTitle}
        </p>
        {authorName && (
          <p className="text-xs text-gray-500 truncate">{authorName.startsWith('@') ? authorName : `@${authorName}`}</p>
        )}
        {relativeTime && (
          <p className="text-xs text-gray-400">{relativeTime}</p>
        )}
      </div>
    </Link>
  );
}
