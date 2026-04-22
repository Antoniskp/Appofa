const express = require('express');
const { apiLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const csrfProtection = require('../middleware/csrfProtection');
const countryAccessService = require('../services/countryAccessService');

const geoAccessPublicRoutes = express.Router();
const geoAccessAdminRoutes = express.Router();

const VALID_SETTING_KEYS = new Set([
  'unknown_country_action',
  'unknown_country_redirect_path',
  'no_ip_action',
  'no_ip_redirect_path',
]);

const VALID_ACTIONS = new Set(['allow', 'block', 'redirect']);

const normalizeCountryCode = (value) => String(value || '').trim().toUpperCase();

geoAccessPublicRoutes.get('/access-rules', apiLimiter, async (req, res, next) => {
  try {
    const { blockedCountries, settings } = await countryAccessService.getCountryRulesCache();
    return res.json({
      success: true,
      data: {
        blockedCountries: Array.from(blockedCountries),
        unknownCountryAction: settings.unknownCountryAction,
        unknownCountryRedirectPath: settings.unknownCountryRedirectPath,
        noIpAction: settings.noIpAction,
        noIpRedirectPath: settings.noIpRedirectPath,
      },
    });
  } catch (error) {
    return next(error);
  }
});

geoAccessAdminRoutes.get('/rules', apiLimiter, authMiddleware, checkRole('admin'), async (req, res, next) => {
  try {
    const rules = await countryAccessService.listRules();
    return res.json({ success: true, data: rules });
  } catch (error) {
    return next(error);
  }
});

geoAccessAdminRoutes.post('/rules', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, async (req, res, next) => {
  try {
    const countryCode = normalizeCountryCode(req.body?.countryCode);
    const reason = req.body?.reason ? String(req.body.reason).trim() : null;

    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return res.status(400).json({ success: false, message: 'countryCode must be 2 uppercase letters.' });
    }

    const rule = await countryAccessService.addRule(countryCode, reason, req.user.id);
    return res.status(201).json({ success: true, data: rule });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'This country is already blocked.' });
    }
    return next(error);
  }
});

geoAccessAdminRoutes.delete('/rules/:code', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, async (req, res, next) => {
  try {
    const countryCode = normalizeCountryCode(req.params.code);
    const deleted = await countryAccessService.removeRule(countryCode);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Rule not found.' });
    }
    return res.json({ success: true, message: 'Rule removed.' });
  } catch (error) {
    return next(error);
  }
});

geoAccessAdminRoutes.get('/settings', apiLimiter, authMiddleware, checkRole('admin'), async (req, res, next) => {
  try {
    const settings = await countryAccessService.getSettings();
    return res.json({ success: true, data: settings });
  } catch (error) {
    return next(error);
  }
});

geoAccessAdminRoutes.put('/settings', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, async (req, res, next) => {
  try {
    const { key, value } = req.body || {};
    if (!VALID_SETTING_KEYS.has(key)) {
      return res.status(400).json({ success: false, message: 'Invalid setting key.' });
    }

    const stringValue = value == null ? null : String(value).trim();

    if ((key === 'unknown_country_action' || key === 'no_ip_action') && (stringValue == null || !VALID_ACTIONS.has(stringValue))) {
      return res.status(400).json({ success: false, message: 'Invalid action value.' });
    }

    if ((key === 'unknown_country_redirect_path' || key === 'no_ip_redirect_path')
      && (!stringValue || !stringValue.startsWith('/'))) {
      return res.status(400).json({ success: false, message: 'Redirect path must start with /.' });
    }

    const setting = await countryAccessService.updateSetting(key, stringValue);
    return res.json({ success: true, data: setting });
  } catch (error) {
    return next(error);
  }
});

module.exports = {
  geoAccessPublicRoutes,
  geoAccessAdminRoutes,
};
