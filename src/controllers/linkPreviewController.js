/**
 * Link Preview Controller
 *
 * Fetches metadata (title, thumbnail, embed info) for YouTube and TikTok URLs.
 * Implements:
 *   - Domain allowlisting to prevent SSRF
 *   - oEmbed metadata fetching with OpenGraph fallback
 *   - DB-backed cache with configurable TTL (default 7 days)
 *   - Normalized response shape
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { Op } = require('sequelize');
const { LinkPreviewCache } = require('../models');

// Cache TTL: 7 days in milliseconds
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Request timeout: 8 seconds
const FETCH_TIMEOUT_MS = 8000;

// Max response body size: 512 KB
const MAX_BODY_BYTES = 512 * 1024;

// Retry delays for TikTok oEmbed intermittent failures (milliseconds)
const TIKTOK_RETRY_DELAYS_MS = [500, 1500, 3000];

/**
 * Truncate a string to fit within a database column limit.
 * Ensures the value doesn't exceed maxLen characters to prevent DB errors.
 */
const truncate = (str, maxLen = 2000) => {
  if (typeof str !== 'string') return str;
  return str.length > maxLen ? str.slice(0, maxLen) : str;
};

/**
 * Allowed hostname sets by provider.
 * These are the only hostnames we will ever fetch oEmbed / pages from.
 */
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com'
]);

const TIKTOK_HOSTS = new Set([
  'tiktok.com',
  'www.tiktok.com',
  'vm.tiktok.com',
  'm.tiktok.com',
  't.tiktok.com'
]);

/**
 * Allowed hostnames for oEmbed endpoints (never allow user-supplied URLs to be fetched).
 * We re-use YOUTUBE_HOSTS and TIKTOK_HOSTS for this; keeping it explicit here for clarity.
 */

/**
 * Detect provider from a URL object.
 * Returns 'youtube', 'tiktok', or null.
 */
const detectProvider = (urlObj) => {
  const host = urlObj.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) return 'youtube';
  if (TIKTOK_HOSTS.has(host)) return 'tiktok';
  return null;
};

/**
 * Validate that a URL:
 * 1. Is a valid URL string
 * 2. Uses https: or http: protocol
 * 3. Hostname is in the YouTube or TikTok allowlist
 * 4. Does not contain credentials (SSRF protection)
 *
 * Returns { urlObj, provider } on success, or throws an Error.
 */
const validateAndParseUrl = (rawUrl) => {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    throw Object.assign(new Error('URL is required.'), { statusCode: 400 });
  }

  let urlObj;
  try {
    urlObj = new URL(rawUrl.trim());
  } catch {
    throw Object.assign(new Error('Invalid URL format.'), { statusCode: 400 });
  }

  // Only allow http/https protocols (prevent file://, data://, etc.)
  if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
    throw Object.assign(new Error('Only http and https URLs are supported.'), { statusCode: 400 });
  }

  // Prevent credentials in URL (SSRF risk)
  if (urlObj.username || urlObj.password) {
    throw Object.assign(new Error('URLs with credentials are not allowed.'), { statusCode: 400 });
  }

  // Prevent private/loopback IP addresses (basic SSRF protection)
  const hostname = urlObj.hostname.toLowerCase();
  const privatePatterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^::1$/,
    /^localhost$/,
    /^0\.0\.0\.0$/,
    /^169\.254\./  // Link-local
  ];
  if (privatePatterns.some((p) => p.test(hostname))) {
    throw Object.assign(new Error('Private or loopback addresses are not allowed.'), { statusCode: 400 });
  }

  const provider = detectProvider(urlObj);
  if (!provider) {
    throw Object.assign(
      new Error('Only YouTube and TikTok URLs are supported.'),
      { statusCode: 422 }
    );
  }

  return { urlObj, provider };
};

/**
 * Extract a normalized URL key for caching.
 * Strips tracking parameters and normalises the URL.
 */
const normalizeUrl = (urlObj, provider) => {
  const u = new URL(urlObj.toString());

  if (provider === 'youtube') {
    // Keep only the video ID parameter
    const videoId = extractYouTubeVideoId(u);
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  }

  if (provider === 'tiktok') {
    // Normalize to www.tiktok.com and keep only path (strip query/hash)
    return `https://www.tiktok.com${u.pathname}`;
  }

  // Fallback: origin + pathname
  return `${u.origin}${u.pathname}`;
};

/**
 * Extract YouTube video ID from various URL formats.
 */
const extractYouTubeVideoId = (urlObj) => {
  const hostname = urlObj.hostname.toLowerCase();

  // youtu.be/<id>
  if (hostname === 'youtu.be') {
    return urlObj.pathname.slice(1).split('/')[0] || null;
  }

  // youtube.com/watch?v=<id>
  const v = urlObj.searchParams.get('v');
  if (v) return v;

  // youtube.com/embed/<id>
  const embedMatch = urlObj.pathname.match(/\/embed\/([^/?#]+)/);
  if (embedMatch) return embedMatch[1];

  // youtube.com/shorts/<id>
  const shortsMatch = urlObj.pathname.match(/\/shorts\/([^/?#]+)/);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/v/<id>
  const vMatch = urlObj.pathname.match(/\/v\/([^/?#]+)/);
  if (vMatch) return vMatch[1];

  return null;
};

/**
 * Build a safe YouTube embed URL from a video ID.
 */
const buildYouTubeEmbedUrl = (videoId) => {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;
};

/**
 * Extract TikTok video ID from a URL object.
 * Handles standard URLs: https://www.tiktok.com/@user/video/<id>
 * Returns the video ID string or null.
 */
const extractTikTokVideoId = (urlObj) => {
  const videoMatch = urlObj.pathname.match(/\/(?:video|photo)\/(\d+)/);
  if (videoMatch) return videoMatch[1];
  return null;
};

/**
 * Build a TikTok embed URL from a video ID.
 * Uses TikTok's official /embed/v2/ endpoint.
 */
const buildTikTokEmbedUrl = (videoId) => {
  return `https://www.tiktok.com/embed/v2/${encodeURIComponent(videoId)}`;
};

/**
 * Perform an HTTP GET request with timeout and body size limit.
 * Only resolves URLs on the explicit OEMBED_HOSTS allowlist.
 *
 * @param {string} url - Must be a fully-qualified https:// URL on an allowed host.
 * @returns {Promise<string>} - Response body as string.
 */
const MAX_REDIRECTS = 5;

const safeFetch = (url, redirectCount = 0) => {
  return new Promise((resolve, reject) => {
    if (redirectCount >= MAX_REDIRECTS) {
      return reject(new Error('Too many redirects'));
    }

    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      return reject(new Error('Invalid fetch URL'));
    }

    // Only allow fetching from provider oEmbed hostnames (YouTube and TikTok)
    const fetchHostAllowed = YOUTUBE_HOSTS.has(urlObj.hostname) || TIKTOK_HOSTS.has(urlObj.hostname);
    if (!fetchHostAllowed) {
      return reject(new Error(`Fetch blocked: ${urlObj.hostname} not in allowlist`));
    }

    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      return reject(new Error('Only http/https fetch supported'));
    }

    const lib = urlObj.protocol === 'https:' ? https : http;

    const req = lib.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Appofa/1.0; +https://appofasi.gr)',
        'Accept': 'application/json, text/html'
      }
    }, (res) => {
      // Follow redirects, but only to allowed hosts
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const location = res.headers.location;
        if (location) {
          try {
            const redirectUrl = new URL(location, url);
            const rHost = redirectUrl.hostname.toLowerCase();
            const hostAllowed =
              YOUTUBE_HOSTS.has(rHost) || TIKTOK_HOSTS.has(rHost) ||
              rHost.endsWith('.youtube.com') || rHost.endsWith('.tiktok.com');
            if (
              hostAllowed &&
              (redirectUrl.protocol === 'https:' || redirectUrl.protocol === 'http:')
            ) {
              return resolve(safeFetch(redirectUrl.toString(), redirectCount + 1));
            }
          } catch {
            // ignore bad redirect
          }
        }
        return reject(new Error(`Redirect to disallowed host`));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let body = '';
      let bytes = 0;

      res.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_BODY_BYTES) {
          req.destroy();
          reject(new Error('Response body too large'));
          return;
        }
        body += chunk;
      });

      res.on('end', () => resolve(body));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
};

/**
 * Fetch YouTube oEmbed metadata.
 */
const fetchYouTubeOEmbed = async (originalUrl) => {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(originalUrl)}&format=json`;
  const body = await safeFetch(oEmbedUrl);
  const data = JSON.parse(body);

  return {
    title: truncate(data.title) || null,
    authorName: truncate(data.author_name) || null,
    thumbnailUrl: data.thumbnail_url || null,
    providerName: data.provider_name || 'YouTube',
    providerUrl: data.provider_url || 'https://www.youtube.com'
  };
};

/**
 * Fetch TikTok oEmbed metadata.
 * Also attempts to extract videoId from the oEmbed HTML for shortlink support
 * (vm.tiktok.com) where the original URL path doesn't contain the video ID.
 */
const fetchTikTokOEmbed = async (originalUrl) => {
  const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(originalUrl)}`;
  const body = await safeFetch(oEmbedUrl);
  const data = JSON.parse(body);

  // Try to extract video ID from oEmbed HTML data-video-id attribute.
  // This handles vm.tiktok.com shortlinks where the original URL has no ID.
  let extractedVideoId = null;
  if (data.html) {
    const idMatch = data.html.match(/data-video-id=["'](\d+)["']/);
    if (idMatch) extractedVideoId = idMatch[1];
  }

  return {
    title: truncate(data.title) || null,
    authorName: truncate(data.author_name) || null,
    thumbnailUrl: data.thumbnail_url || null,
    providerName: data.provider_name || 'TikTok',
    providerUrl: data.provider_url || 'https://www.tiktok.com',
    embedHtml: data.html || null,
    videoId: extractedVideoId
  };
};

/**
 * Build the normalized preview response for a given URL.
 * Tries oEmbed first; never falls through to arbitrary URL fetching.
 */
const buildPreview = async (urlObj, provider, originalUrl) => {
  const youtubeVideoId = provider === 'youtube' ? extractYouTubeVideoId(urlObj) : null;
  const youtubeEmbedUrl = youtubeVideoId ? buildYouTubeEmbedUrl(youtubeVideoId) : null;

  let meta = {};

  const fetchOEmbed = async () => {
    if (provider === 'youtube') {
      return fetchYouTubeOEmbed(originalUrl);
    } else if (provider === 'tiktok') {
      return fetchTikTokOEmbed(originalUrl);
    }
    return {};
  };

  let lastErr = null;
  for (let attempt = 0; attempt <= TIKTOK_RETRY_DELAYS_MS.length; attempt++) {
    try {
      meta = await fetchOEmbed();
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      if (provider !== 'tiktok' || attempt >= TIKTOK_RETRY_DELAYS_MS.length) break;
      await new Promise((r) => setTimeout(r, TIKTOK_RETRY_DELAYS_MS[attempt]));
    }
  }

  if (lastErr) {
    if (provider === 'tiktok') {
      console.warn(`[link-preview] oEmbed fetch failed for ${originalUrl} after all retries: ${lastErr.message}`);
    } else {
      console.warn(`[link-preview] oEmbed fetch failed for ${originalUrl}: ${lastErr.message}`);
    }
  }

  // Compute TikTok embedUrl: prefer ID from URL path, fall back to ID from oEmbed HTML
  let tikTokEmbedUrl = null;
  if (provider === 'tiktok') {
    const tikTokVideoId = extractTikTokVideoId(urlObj) || meta.videoId || null;
    tikTokEmbedUrl = tikTokVideoId ? buildTikTokEmbedUrl(tikTokVideoId) : null;
  }

  return {
    provider,
    url: originalUrl,
    title: meta.title || null,
    authorName: meta.authorName || null,
    thumbnailUrl: meta.thumbnailUrl || null,
    providerName: meta.providerName || (provider === 'youtube' ? 'YouTube' : 'TikTok'),
    providerUrl: meta.providerUrl || (provider === 'youtube' ? 'https://www.youtube.com' : 'https://www.tiktok.com'),
    embedUrl: youtubeEmbedUrl || tikTokEmbedUrl || null,
    embedHtml: meta.embedHtml || null
  };
};

/**
 * Purge expired cache entries (best-effort, non-blocking).
 */
const purgeExpiredCache = () => {
  LinkPreviewCache.destroy({
    where: { expiresAt: { [Op.lt]: new Date() } }
  }).catch((err) => {
    console.warn('[link-preview] cache purge error:', err.message);
  });
};

/**
 * POST /api/link-preview
 * Body: { url: string }
 * Returns: normalized preview JSON
 */
const getLinkPreview = async (req, res) => {
  try {
    const { url: rawUrl } = req.body;

    // Validate URL (throws on invalid/disallowed)
    let urlObj, provider;
    try {
      ({ urlObj, provider } = validateAndParseUrl(rawUrl));
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message
      });
    }

    const cacheKey = normalizeUrl(urlObj, provider);

    // Check DB cache (purge expired entries asynchronously)
    purgeExpiredCache();

    const cached = await LinkPreviewCache.findOne({
      where: {
        normalizedUrl: cacheKey,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (cached) {
      // For TikTok entries cached before embedUrl was introduced, derive it from
      // the normalized URL (which preserves the /video/<id> path for standard URLs).
      let resolvedEmbedUrl = cached.embedUrl;
      if (cached.provider === 'tiktok' && !resolvedEmbedUrl) {
        try {
          const cacheUrlObj = new URL(cacheKey);
          const videoId = extractTikTokVideoId(cacheUrlObj);
          if (videoId) {
            resolvedEmbedUrl = buildTikTokEmbedUrl(videoId);
            // Update the cache entry so future hits are correct (fire-and-forget)
            LinkPreviewCache.update(
              { embedUrl: resolvedEmbedUrl },
              { where: { normalizedUrl: cacheKey } }
            ).catch(() => {});
          }
        } catch {
          // ignore – leave resolvedEmbedUrl as null
        }
      }

      if (cached.provider === 'tiktok' && !resolvedEmbedUrl) {
        await LinkPreviewCache.destroy({
          where: { normalizedUrl: cacheKey }
        });
      } else {
        return res.status(200).json({
          success: true,
          data: {
            provider: cached.provider,
            url: rawUrl.trim(),
            title: cached.title,
            authorName: cached.authorName,
            thumbnailUrl: cached.thumbnailUrl,
            providerName: cached.providerName,
            providerUrl: cached.providerUrl,
            embedUrl: resolvedEmbedUrl,
            embedHtml: cached.embedHtml,
            cached: true
          }
        });
      }
    }

    // Fetch fresh preview
    const preview = await buildPreview(urlObj, provider, rawUrl.trim());

    // Upsert into cache
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await LinkPreviewCache.upsert({
      normalizedUrl: cacheKey,
      provider: preview.provider,
      title: preview.title,
      authorName: preview.authorName,
      thumbnailUrl: preview.thumbnailUrl,
      providerName: preview.providerName,
      providerUrl: preview.providerUrl,
      embedUrl: preview.embedUrl,
      embedHtml: preview.embedHtml,
      expiresAt
    });

    return res.status(200).json({
      success: true,
      data: {
        ...preview,
        cached: false
      }
    });
  } catch (error) {
    console.error('[link-preview] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch link preview.'
    });
  }
};

module.exports = {
  getLinkPreview,
  // Exported for testing
  validateAndParseUrl,
  normalizeUrl,
  extractYouTubeVideoId,
  buildYouTubeEmbedUrl,
  extractTikTokVideoId,
  buildTikTokEmbedUrl,
  detectProvider,
  YOUTUBE_HOSTS,
  TIKTOK_HOSTS
};
