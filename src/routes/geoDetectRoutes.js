const express = require('express');
const { apiLimiter } = require('../middleware/rateLimiter');
const { normalizeIp } = require('../utils/normalizeIp');

const router = express.Router();

const COUNTRY_NAMES = {
  GR: 'Greece', CY: 'Cyprus', DE: 'Germany', GB: 'United Kingdom',
  US: 'United States', AU: 'Australia', CA: 'Canada', FR: 'France',
  IT: 'Italy', ES: 'Spain', NL: 'Netherlands', SE: 'Sweden',
  NO: 'Norway', DK: 'Denmark', FI: 'Finland', BE: 'Belgium',
  AT: 'Austria', CH: 'Switzerland', PT: 'Portugal', PL: 'Poland',
  RU: 'Russia', TR: 'Turkey', UA: 'Ukraine', AL: 'Albania',
  RS: 'Serbia', BG: 'Bulgaria', RO: 'Romania', HR: 'Croatia',
  MK: 'North Macedonia', ME: 'Montenegro', BA: 'Bosnia', XK: 'Kosovo',
  SI: 'Slovenia', SK: 'Slovakia', CZ: 'Czech Republic', HU: 'Hungary',
  IL: 'Israel', LB: 'Lebanon', EG: 'Egypt', ZA: 'South Africa',
  BR: 'Brazil', AR: 'Argentina', MX: 'Mexico', JP: 'Japan',
  CN: 'China', IN: 'India', KR: 'South Korea', SG: 'Singapore',
  AE: 'United Arab Emirates', SA: 'Saudi Arabia',
};

const INVALID_COUNTRY_CODES = new Set(['XX', 'T1']);

const normalizeCountryCode = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  if (INVALID_COUNTRY_CODES.has(normalized)) return null;
  return normalized;
};

const parseClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const fromForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const candidate = (fromForwarded ? String(fromForwarded).split(',')[0] : null)
    || req.headers['x-real-ip']
    || req.headers['cf-connecting-ip']
    || req.ip
    || req.connection?.remoteAddress
    || null;

  if (!candidate) return null;
  const normalized = normalizeIp(candidate);
  if (!normalized || normalized === '127.0.0.1' || normalized === '::1') return null;
  return normalized;
};

router.get('/detect', apiLimiter, (req, res) => {
  try {
    let countryCode = normalizeCountryCode(
      req.headers['cf-ipcountry']
      || req.headers['x-vercel-ip-country']
      || req.headers['x-country-code']
    );

    if (!countryCode) {
      try {
        // Optional dependency (fallback only)
        const geoip = require('geoip-lite');
        const ip = parseClientIp(req);
        if (ip) {
          const geo = geoip.lookup(ip);
          countryCode = normalizeCountryCode(geo?.country);
        }
      } catch {
        // geoip-lite not installed
      }
    }

    const countryName = countryCode ? (COUNTRY_NAMES[countryCode] || countryCode) : null;
    return res.json({ success: true, data: { countryCode, countryName } });
  } catch {
    return res.json({ success: true, data: { countryCode: null, countryName: null } });
  }
});

module.exports = router;
module.exports.normalizeCountryCode = normalizeCountryCode;
module.exports.parseClientIp = parseClientIp;
