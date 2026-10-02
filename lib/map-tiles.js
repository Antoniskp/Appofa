// Browser-loaded tiles: preserve normal HTTP caching and send only the site
// origin as the referrer. Keep attribution visible on every map.
export const STANDARD_MAP_TILES = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  maxNativeZoom: 19,
  maxZoom: 20,
  referrerPolicy: 'strict-origin-when-cross-origin',
};
