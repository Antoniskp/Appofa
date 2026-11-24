export function extractTikTokVideoId(embedUrl, sourceUrl) {
  if (embedUrl) {
    const match = embedUrl.match(/\/embed\/v2\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  if (sourceUrl) {
    const match = sourceUrl.match(/\/(?:video|photo)\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  return null;
}

export function buildTikTokEmbedUrl(videoId) {
  return `https://www.tiktok.com/embed/v2/${encodeURIComponent(videoId)}`;
}

export function buildTikTokCreatorEmbedUrl(handle, locale) {
  // TikTok's Creator Profile Embed uses this frame for its avatar and metrics.
  const url = new URL(`https://www.tiktok.com/embed/@${encodeURIComponent(handle)}`);
  url.searchParams.set('lang', locale);
  return url.href;
}
