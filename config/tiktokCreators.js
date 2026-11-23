const TIKTOK_CREATOR_CATEGORIES = [
  'politics', 'beauty', 'sports', 'gaming', 'local-news', 'comedy',
  'education', 'food', 'music', 'travel', 'lifestyle', 'other',
];
const TIKTOK_CREATOR_LOCATION_TYPES = ['country', 'prefecture', 'electoral_district', 'municipality'];

const TIKTOK_PROFILE_HOSTS = new Set(['tiktok.com', 'www.tiktok.com', 'm.tiktok.com']);
const TIKTOK_HANDLE = /^[a-z0-9._]{1,24}(?<!\.)$/i;

function normalizeTikTokHandle(value) {
  if (typeof value !== 'string') return null;
  const handle = value.trim().replace(/^@/, '').toLowerCase();
  return TIKTOK_HANDLE.test(handle) ? handle : null;
}

function getTikTokProfileHandle(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !TIKTOK_PROFILE_HOSTS.has(url.hostname) || url.username || url.password || url.port) {
      return null;
    }
    const match = url.pathname.match(/^\/@([^/]+)\/?$/);
    return match ? normalizeTikTokHandle(decodeURIComponent(match[1])) : null;
  } catch {
    return normalizeTikTokHandle(value);
  }
}

function tikTokProfileUrl(handle) {
  return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
}

module.exports = { TIKTOK_CREATOR_CATEGORIES, TIKTOK_CREATOR_LOCATION_TYPES, normalizeTikTokHandle, getTikTokProfileHandle, tikTokProfileUrl };
