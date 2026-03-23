'use client';

/**
 * VideoEmbed
 *
 * Renders an embedded video player for YouTube or TikTok.
 * - YouTube: renders an <iframe> using the stored embedUrl (youtube-nocookie CDN)
 * - TikTok:  renders an <iframe> from embedUrl when available (preferred), or a
 *            sanitized iframe from embedHtml as fallback; never injects arbitrary HTML
 *
 * Props:
 *   article  {object}  article data with sourceUrl, sourceProvider, embedUrl,
 *                      embedHtml, sourceMeta fields
 */

// Allowed iframe src hosts for TikTok embed sanitization
const ALLOWED_TIKTOK_IFRAME_HOSTS = new Set([
  'www.tiktok.com',
  'tiktok.com'
]);

/**
 * Sanitize TikTok embedHtml by extracting the first safe <iframe>.
 * Returns a safe HTML string or null if no safe iframe found.
 */
function sanitizeTikTokEmbedHtml(html) {
  if (typeof html !== 'string') return null;

  const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (iframeMatch) {
    try {
      const srcUrl = new URL(iframeMatch[1]);
      if (ALLOWED_TIKTOK_IFRAME_HOSTS.has(srcUrl.hostname)) {
        return `<iframe
          src="${srcUrl.toString()}"
          style="width:100%;max-width:605px;min-width:325px;border:none;"
          allow="autoplay"
          allowfullscreen
          sandbox="allow-scripts allow-same-origin allow-popups"
          loading="lazy"
          title="TikTok video"
        ></iframe>`;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export default function VideoEmbed({ article, compact = false }) {
  if (!article?.sourceUrl || !article?.sourceProvider) return null;

  const { sourceProvider, sourceUrl, embedUrl, embedHtml, sourceMeta } = article;
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

    return (
      <div className={`${outerMargin} rounded-lg overflow-hidden border border-gray-200 shadow-sm`}>
        <div className="aspect-video bg-black">
          <iframe
            src={embedUrl}
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
    // Preferred path: render an iframe from embedUrl (safe, no script injection)
    if (embedUrl) {
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
              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
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
                className="text-xs text-gray-500 hover:text-gray-700 mt-1 inline-block"
              >
                Watch on TikTok ↗
              </a>
            </div>
          )}
        </div>
      );
    }

    // Fallback: sanitize embedHtml if it contains a safe iframe
    if (embedHtml) {
      const safeHtml = sanitizeTikTokEmbedHtml(embedHtml);
      if (safeHtml) {
        return (
          <div className={`${outerMargin} flex flex-col items-center`}>
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
            {!compact && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Watch on TikTok ↗
              </a>
            )}
          </div>
        );
      }
    }

    // Fallback card
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
          {author && <p className="text-xs text-gray-500 mt-1">{author}</p>}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Watch on TikTok ↗
          </a>
        </div>
      </div>
    );
  }

  return null;
}
