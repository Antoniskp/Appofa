const crypto = require('crypto');
const { GeoVisit } = require('../models');
const { getCookie } = require('../utils/cookies');

let geoip = null;
try {
  // Optional dependency: fallback country detection when CF-IPCountry is unavailable
  geoip = require('geoip-lite');
} catch {
  geoip = null;
}

const SKIP_PATH_PREFIXES = ['/api/', '/_next/', '/favicon', '/health'];

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || '';
};

const getCountryName = (countryCode) => {
  if (!countryCode) return null;
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(countryCode) || null;
  } catch {
    return null;
  }
};

const normalizeIpForLookup = (ip) => {
  if (!ip) return ip;
  const mapped = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (mapped) return mapped[1];
  return ip;
};

const detectCountry = (req) => {
  const cfCountryHeader = req.headers['cf-ipcountry'];
  if (typeof cfCountryHeader === 'string') {
    const normalized = cfCountryHeader.trim().toUpperCase();
    if (normalized && normalized !== 'XX' && normalized !== 'T1') {
      return {
        countryCode: normalized,
        countryName: getCountryName(normalized),
      };
    }
  }

  const forwardedCountryHeader = req.headers['x-detected-country'];
  if (typeof forwardedCountryHeader === 'string') {
    const normalized = forwardedCountryHeader.trim().toUpperCase();
    if (normalized && normalized !== 'XX' && normalized !== 'T1') {
      return {
        countryCode: normalized,
        countryName: getCountryName(normalized),
      };
    }
  }

  if (!geoip) {
    return { countryCode: null, countryName: null };
  }

  const rawIp = getClientIp(req);
  const lookupIp = normalizeIpForLookup(rawIp);
  const geoResult = geoip.lookup(lookupIp);
  if (!geoResult?.country) {
    return { countryCode: null, countryName: null };
  }

  return {
    countryCode: geoResult.country,
    countryName: getCountryName(geoResult.country),
  };
};

const sanitizePath = (rawPath) => {
  if (typeof rawPath !== 'string' || !rawPath) {
    return null;
  }

  let decoded = rawPath;
  try {
    for (let i = 0; i < 10; i += 1) {
      const nextDecoded = decodeURIComponent(decoded);
      if (nextDecoded === decoded) {
        break;
      }
      decoded = nextDecoded;
    }
  } catch {
    return null;
  }

  if (decoded.includes('..')) {
    console.warn('geoTrackMiddleware: suspicious path discarded:', rawPath);
    return null;
  }

  return rawPath.slice(0, 500) || null;
};

const geoTrackMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const requestPath = req.path || req.originalUrl || '';
  if (SKIP_PATH_PREFIXES.some((prefix) => requestPath.startsWith(prefix))) {
    return next();
  }

  const ip = getClientIp(req);
  const normalizedIp = normalizeIpForLookup(ip);
  const userAgent = req.headers['user-agent'] || '';
  const sessionHash = crypto
    .createHash('sha256')
    .update(`${ip}|${userAgent}`)
    .digest('hex');

  const { countryCode, countryName } = detectCountry(req);
  const token = getCookie(req, 'token');
  const locale = getCookie(req, 'NEXT_LOCALE') || null;

  GeoVisit.create({
    countryCode,
    countryName,
    // Intentionally non-blocking analytics: only token presence is checked here.
    isAuthenticated: Boolean(token && token.trim()),
    isDiaspora: null,
    sessionHash,
    ipAddress: normalizedIp || null,
    path: sanitizePath(requestPath),
    locale,
  }).catch((err) => {
    console.error('GeoVisit tracking failed:', err?.message || err);
  });

  return next();
};

module.exports = {
  geoTrackMiddleware,
};
