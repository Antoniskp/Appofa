'use client';

import { ImageCard, ImageTopCard } from '@/components/Card';
import Badge, { TypeBadge } from '@/components/Badge';
import { TruncatedTextTooltip } from '@/components/Tooltip';
import { idSlug } from '@/lib/utils/slugify';
import { FilmIcon } from '@heroicons/react/24/outline';

/**
 * Helper function to strip markdown syntax from text
 * @param {string} text - Text with markdown syntax
 * @returns {string} Clean text without markdown
 */
export function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  
  let result = text;
  
  // Remove code blocks and replace with [code block]
  result = result.replace(/```[\s\S]*?```/g, '[code block]');
  
  // Remove inline code backticks
  result = result.replace(/`(.*?)`/g, '$1');
  
  // Remove bold formatting (**text** or __text__)
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
  result = result.replace(/__([^_]+)__/g, '$1');
  
  // Remove italic formatting (*text* or _text_)
  result = result.replace(/\*([^*]+)\*/g, '$1');
  result = result.replace(/_([^_]+)_/g, '$1');
  
  // Remove header markers (# ## ###)
  result = result.replace(/^#{1,6}\s+/gm, '');
  
  // Remove link syntax but keep link text [text](url)
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove image syntax ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  
  // Remove video syntax [video](url)
  result = result.replace(/\[video\]\([^)]+\)/gi, '[video]');
  
  // Remove unordered list markers (- or *)
  result = result.replace(/^[\s]*[-*]\s+/gm, '');
  
  // Remove ordered list markers (1. 2. etc)
  result = result.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // Remove blockquote markers (>)
  result = result.replace(/^[\s]*>\s+/gm, '');
  
  // Clean up extra whitespace
  result = result.replace(/\n\s*\n/g, ' ').trim();
  
  return result;
}

/**
 * Reusable article card component
 * @param {Object} article - Article object with title, category, summary, content, author, createdAt
 * @param {string} variant - 'grid' for grid layout (compact) or 'list' for list layout (detailed)
 */
export default function ArticleCard({ article, variant = 'grid' }) {
  const defaultBannerImageUrl = '/images/branding/news default.png';
  const bannerImageUrl = article.bannerImageUrl || defaultBannerImageUrl;
  const createdAt = new Date(article.createdAt);
  const formattedDate = createdAt.toLocaleDateString();
  const formattedTime = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const authorLabel = article.hideAuthor ? 'Anonymous' : (article.author?.username || 'Unknown');
  const articleHref = article.type === 'news'
    ? `/news/${idSlug(article.id, article.title)}`
    : `/articles/${idSlug(article.id, article.title)}`;

  // Detect video articles (YouTube / TikTok with usable embed data or at least
  // a sourceUrl so the VideoEmbed fallback card can still render).
  const isVideoArticle =
    (article.sourceProvider === 'youtube' || article.sourceProvider === 'tiktok') &&
    !!(article.embedUrl || article.embedHtml || article.sourceUrl);

  // Video card layout – thumbnail with no fake play button; a coloured left
  // border accent and "Watch on …" label make it clear this is a video article.
  // Clicking navigates to the detail page where the full embed renders with autoplay.
  if (isVideoArticle) {
    const thumbnailUrl =
      article.sourceMeta?.thumbnailUrl ||
      article.bannerImageUrl ||
      defaultBannerImageUrl;
    const isYouTube = article.sourceProvider === 'youtube';
    const providerLabel = isYouTube ? 'YouTube' : article.sourceProvider === 'tiktok' ? 'TikTok' : null;
    // Red left accent for YouTube, near-black for TikTok
    const accentClass = isYouTube ? 'border-l-4 border-red-600' : 'border-l-4 border-gray-900';

    return (
      <ImageTopCard
        image={thumbnailUrl}
        imageAlt={`${article.title} video thumbnail`}
        imageFallback={defaultBannerImageUrl}
        imageClassName="h-32"
        href={articleHref}
        hoverable
        className={`overflow-hidden ${accentClass}`}
      >
        <div className="flex flex-wrap gap-2 mb-2">
          {article.type && <TypeBadge type={article.type} />}
          {article.category && <Badge variant="primary">{article.category}</Badge>}
          {Array.isArray(article.tags) && article.tags.length > 0 && (
            <Badge variant="purple">{article.tags.join(', ')}</Badge>
          )}
        </div>
        <h3 className="headline hover:text-blue-600 flex items-start gap-1.5">
          <FilmIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
          <span className="sr-only">(Video) </span>
          <TruncatedTextTooltip maxLength={60} className="headline">
            {article.title}
          </TruncatedTextTooltip>
        </h3>
        {providerLabel && (
          <p className="text-xs text-gray-500 mt-1">
            {isYouTube ? (
              <span className="text-red-600 font-medium">▶ Watch on {providerLabel}</span>
            ) : (
              <span className="font-medium">▶ Watch on {providerLabel}</span>
            )}
          </p>
        )}
        <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
          <span>By {authorLabel}</span>
          <span>{formattedDate} {formattedTime}</span>
        </div>
      </ImageTopCard>
    );
  }

  // List variant (image on left)
  if (variant === 'list') {
    return (
      <ImageCard
        image={bannerImageUrl}
        imageAlt={`${article.title} banner`}
        imageFallback={defaultBannerImageUrl}
        href={articleHref}
        hoverable
        className="overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex-grow">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              {article.type && <TypeBadge type={article.type} />}
              {article.category && <Badge variant="primary">{article.category}</Badge>}
              {Array.isArray(article.tags) && article.tags.length > 0 && (
                <Badge variant="purple">{article.tags.join(', ')}</Badge>
              )}
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-semibold mb-2 hover:text-blue-600">
              <TruncatedTextTooltip maxLength={80} className="text-2xl font-semibold">
                {article.title}
              </TruncatedTextTooltip>
            </h2>
            
            {/* Summary */}
            <p className="body-copy mb-4">
              {stripMarkdown(article.summary || (article.content ? `${article.content.substring(0, 200)}...` : ''))}
            </p>
            
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>By {authorLabel}</span>
              <span>•</span>
              <span>{formattedDate} {formattedTime}</span>
              {article.status !== 'published' && (
                <>
                  <span>•</span>
                  <span className="text-orange-600 font-medium">{article.status}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </ImageCard>
    );
  }
  
  // Grid variant (image on top)
  return (
    <ImageTopCard
      image={bannerImageUrl}
      imageAlt={`${article.title} banner`}
      imageFallback={defaultBannerImageUrl}
      imageClassName="h-32"
      href={articleHref}
      hoverable
      className="overflow-hidden"
    >
      <div className="flex flex-wrap gap-2 mb-2">
        {article.type && <TypeBadge type={article.type} />}
        {article.category && <Badge variant="primary">{article.category}</Badge>}
        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <Badge variant="purple">{article.tags.join(', ')}</Badge>
        )}
      </div>
      <h3 className="headline hover:text-blue-600">
        <TruncatedTextTooltip maxLength={60} className="headline">
          {article.title}
        </TruncatedTextTooltip>
      </h3>
      <p className="body-copy mb-4 line-clamp-3">
        {stripMarkdown(article.summary || (article.content ? `${article.content.substring(0, 150)}...` : ''))}
      </p>
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>By {authorLabel}</span>
        <span>{formattedDate} {formattedTime}</span>
      </div>
    </ImageTopCard>
  );
}
