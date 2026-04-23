const countryAccessService = require('../services/countryAccessService');

const SKIP_PATH_PREFIXES = ['/api/health', '/_next', '/favicon'];

const normalizeCountryCode = (value) => {
  if (!value) return null;
  const code = String(value).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'T1') {
    return null;
  }
  return code;
};

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || '';
};

const detectCountryCode = (req) => {
  const cfCountry = normalizeCountryCode(req.headers['cf-ipcountry']);
  if (cfCountry) return cfCountry;
  const vercelCountry = normalizeCountryCode(req.headers['x-vercel-ip-country']);
  if (vercelCountry) return vercelCountry;
  const genericCountry = normalizeCountryCode(req.headers['x-country-code']);
  if (genericCountry) return genericCountry;
  return normalizeCountryCode(req.headers['x-detected-country']);
};

const countryBlockMiddleware = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'test') return next();

    const requestPath = req.path || req.originalUrl || '';
    if (SKIP_PATH_PREFIXES.some((prefix) => requestPath.startsWith(prefix))) {
      return next();
    }

    const countryCode = detectCountryCode(req);
    const hasIp = Boolean(getClientIp(req));
    const { blockedCountries, blockedCountriesRedirects, settings } = await countryAccessService.getCountryRulesCache();

    if (countryCode && blockedCountries.has(countryCode)) {
      const redirectPath = blockedCountriesRedirects?.get(countryCode);
      if (redirectPath) {
        return res.redirect(302, redirectPath);
      }
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (!countryCode) {
      const action = hasIp ? settings.unknownCountryAction : settings.noIpAction;
      if (action === 'block') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = countryBlockMiddleware;
