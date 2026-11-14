// Explicit searches only (never autocomplete). Public Nominatim requires caching,
// an identifying User-Agent, and at most one upstream request per second.
// Policy: https://operations.osmfoundation.org/policies/nominatim/
const cache = new Map();
let nextRequestAt = 0;

exports.search = async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 3 || q.length > 200) return res.status(400).json({ success: false, message: 'Enter an address between 3 and 200 characters.' });
  const locationId = Number(req.query.locationId);
  if (!Number.isSafeInteger(locationId) || locationId < 1) return res.status(400).json({ success: false, message: 'A valid location is required.' });
  try {
    const { Location } = require('../models');
    const location = await Location.findByPk(locationId, { attributes: ['name', 'name_local'] });
    if (!location) return res.status(404).json({ success: false, message: 'Location not found.' });
    const query = `${q}, ${location.name_local || location.name}`;
    const key = query.toLocaleLowerCase();
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return res.json({ success: true, data: cached.data });
    if (Date.now() < nextRequestAt) {
      res.set('Retry-After', '2');
      return res.status(429).json({ success: false, message: 'Please wait a moment before searching again.' });
    }
    nextRequestAt = Date.now() + 1100;
    const url = new URL(process.env.MAP_GEOCODING_URL || 'https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '5');
    const response = await fetch(url, {
      headers: { 'User-Agent': process.env.MAP_GEOCODING_USER_AGENT || 'Appofasi/1.0 (+https://appofasi.gr)', 'Accept-Language': 'el,en' },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const results = await response.json();
    const data = (Array.isArray(results) ? results : []).filter(item => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)))
      .map(item => ({ label: String(item.display_name || ''), lat: Number(item.lat), lng: Number(item.lon) }));
    if (cache.size >= 300) cache.delete(cache.keys().next().value);
    cache.set(key, { data, expires: Date.now() + 86400000 });
    return res.json({ success: true, data });
  } catch {
    return res.status(503).json({ success: false, message: 'Address search is temporarily unavailable.' });
  }
};
