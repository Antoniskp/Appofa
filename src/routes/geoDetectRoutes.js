const express = require('express');
const { apiLimiter } = require('../middleware/rateLimiter');
const { trackGeoVisit } = require('./geoStatsRoutes');

const router = express.Router();

router.post('/track', apiLimiter, trackGeoVisit);

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

router.get('/detect', apiLimiter, (req, res) => {
  try {
    let countryCode = req.headers['cf-ipcountry'] || null;
    if (countryCode === 'XX' || countryCode === 'T1') countryCode = null;

    if (!countryCode) {
      try {
        // Optional dependency (fallback only)
        const geoip = require('geoip-lite');
        const ip = req.ip || req.connection?.remoteAddress;
        if (ip) {
          const geo = geoip.lookup(ip);
          if (geo?.country) countryCode = geo.country;
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
