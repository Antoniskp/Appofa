const crypto = require('crypto');
const { GeoVisit } = require('../models');

const getCountryNameLocal = (code) => {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || null;
  } catch {
    return null;
  }
};

const trackGeoVisit = async (req, res, next) => {
  try {
    const { path: visitPath, countryCode, ipAddress, locale } = req.body;

    if (!visitPath || typeof visitPath !== 'string') {
      return res.status(400).json({ success: false, message: 'path is required.' });
    }

    const normalizedCode = countryCode
      ? String(countryCode).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || null
      : null;

    const sessionHash = ipAddress
      ? crypto.createHash('sha256').update(String(ipAddress)).digest('hex')
      : null;

    await GeoVisit.create({
      countryCode: normalizedCode || null,
      countryName: getCountryNameLocal(normalizedCode),
      isAuthenticated: false,
      isDiaspora: null,
      sessionHash,
      ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
      path: String(visitPath).slice(0, 500),
      locale: locale ? String(locale).slice(0, 10) : null,
    });

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  trackGeoVisit,
};
