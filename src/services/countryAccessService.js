const { CountryAccessRule, GeoAccessSetting, User } = require('../models');

const CACHE_TTL = 60 * 1000;

const DEFAULT_SETTINGS = {
  unknownCountryAction: 'allow',
  unknownCountryRedirectPath: '/unknown-country',
  noIpAction: 'allow',
  noIpRedirectPath: '/unknown-country',
};

let cache = null;
let cacheExpiry = 0;

const normalizeAction = (value) => {
  if (value === 'block' || value === 'redirect' || value === 'allow') return value;
  return 'allow';
};

const normalizeRedirectPath = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) return fallback;
  return trimmed || fallback;
};

async function getCountryRulesCache() {
  if (cache && Date.now() < cacheExpiry) return cache;

  const [rules, settingsRows] = await Promise.all([
    CountryAccessRule.findAll({ attributes: ['countryCode'] }),
    GeoAccessSetting.findAll({ attributes: ['key', 'value'] }),
  ]);

  const blockedCountries = new Set(
    rules
      .map((rule) => String(rule.countryCode || '').trim().toUpperCase())
      .filter((code) => /^[A-Z]{2}$/.test(code))
  );

  const rawSettings = {};
  for (const row of settingsRows) {
    rawSettings[row.key] = row.value;
  }

  cache = {
    blockedCountries,
    settings: {
      unknownCountryAction: normalizeAction(rawSettings.unknown_country_action),
      unknownCountryRedirectPath: normalizeRedirectPath(
        rawSettings.unknown_country_redirect_path,
        DEFAULT_SETTINGS.unknownCountryRedirectPath
      ),
      noIpAction: normalizeAction(rawSettings.no_ip_action),
      noIpRedirectPath: normalizeRedirectPath(
        rawSettings.no_ip_redirect_path,
        DEFAULT_SETTINGS.noIpRedirectPath
      ),
    },
  };
  cacheExpiry = Date.now() + CACHE_TTL;
  return cache;
}

function invalidateCache() {
  cache = null;
  cacheExpiry = 0;
}

async function listRules() {
  return CountryAccessRule.findAll({
    include: [{ model: User, as: 'createdBy', attributes: ['id', 'username'] }],
    order: [['createdAt', 'DESC']],
  });
}

async function addRule(countryCode, reason, userId) {
  const normalizedCode = String(countryCode || '').trim().toUpperCase();
  const rule = await CountryAccessRule.create({
    countryCode: normalizedCode,
    reason: reason || null,
    createdByUserId: userId || null,
  });
  invalidateCache();
  return rule;
}

async function removeRule(countryCode) {
  const normalizedCode = String(countryCode || '').trim().toUpperCase();
  const deleted = await CountryAccessRule.destroy({
    where: { countryCode: normalizedCode },
  });
  invalidateCache();
  return deleted;
}

async function getSettings() {
  return GeoAccessSetting.findAll({
    order: [['key', 'ASC']],
  });
}

async function updateSetting(key, value) {
  const [setting] = await GeoAccessSetting.findOrCreate({
    where: { key },
    defaults: { value: value ?? null },
  });

  if (!setting.isNewRecord) {
    setting.value = value ?? null;
    await setting.save();
  }

  invalidateCache();
  return setting;
}

module.exports = {
  DEFAULT_SETTINGS,
  getCountryRulesCache,
  listRules,
  addRule,
  removeRule,
  getSettings,
  updateSetting,
  invalidateCache,
};
