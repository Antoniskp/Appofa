const HomepageSettings = require('../models/HomepageSettings');

const DEFAULT_MANIFEST_SECTION = { enabled: true, audience: 'all' };
const DEFAULT_INFO_SECTION = {
  enabled: false,
  audience: 'guest',
  bannerText: 'Ψήφισε ελεύθερα · Ανώνυμα',
  subText: 'Πριν γράψεις, καλό θα είναι να γνωρίζεις αυτά',
  experimentalNotice: true,
  quickLinks: [],
  roadmap: [],
  done: [],
};

function sanitizeAudience(audience, fallback) {
  if (typeof audience !== 'string') return fallback;
  return ['all', 'guest', 'registered'].includes(audience) ? audience : fallback;
}

function sanitizeQuickLinks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      icon: typeof item.icon === 'string' ? item.icon.trim() : '',
      text: typeof item.text === 'string' ? item.text.trim() : '',
      href: typeof item.href === 'string' ? item.href.trim() : '',
    }))
    .filter((item) => item.text && item.href);
}

function sanitizeStringList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeManifestSection(input = {}) {
  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULT_MANIFEST_SECTION.enabled,
    audience: sanitizeAudience(input.audience, DEFAULT_MANIFEST_SECTION.audience),
  };
}

function normalizeInfoSection(input = {}) {
  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULT_INFO_SECTION.enabled,
    audience: sanitizeAudience(input.audience, DEFAULT_INFO_SECTION.audience),
    bannerText: typeof input.bannerText === 'string' ? input.bannerText.trim() : DEFAULT_INFO_SECTION.bannerText,
    subText: typeof input.subText === 'string' ? input.subText.trim() : DEFAULT_INFO_SECTION.subText,
    experimentalNotice: typeof input.experimentalNotice === 'boolean'
      ? input.experimentalNotice
      : DEFAULT_INFO_SECTION.experimentalNotice,
    quickLinks: sanitizeQuickLinks(input.quickLinks),
    roadmap: sanitizeStringList(input.roadmap),
    done: sanitizeStringList(input.done),
  };
}

async function getOrCreateSettings() {
  let settings = await HomepageSettings.findOne();
  if (!settings) {
    settings = await HomepageSettings.create({
      manifestSection: DEFAULT_MANIFEST_SECTION,
      infoSection: DEFAULT_INFO_SECTION,
    });
  }
  return settings;
}

const getHomepageSettings = async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      success: true,
      data: {
        manifestSection: settings.manifestSection,
        infoSection: settings.infoSection,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to read homepage settings.' });
  }
};

const updateHomepageSettings = async (req, res) => {
  try {
    const { manifestSection, infoSection } = req.body || {};

    if (manifestSection !== undefined && (typeof manifestSection !== 'object' || manifestSection === null || Array.isArray(manifestSection))) {
      return res.status(400).json({ success: false, message: 'manifestSection must be an object.' });
    }

    if (infoSection !== undefined && (typeof infoSection !== 'object' || infoSection === null || Array.isArray(infoSection))) {
      return res.status(400).json({ success: false, message: 'infoSection must be an object.' });
    }

    const settings = await getOrCreateSettings();

    if (manifestSection !== undefined) {
      settings.manifestSection = normalizeManifestSection(manifestSection);
    }

    if (infoSection !== undefined) {
      settings.infoSection = normalizeInfoSection(infoSection);
    }

    await settings.save({ fields: ['manifestSection', 'infoSection', 'updatedAt'] });

    return res.json({
      success: true,
      data: {
        manifestSection: settings.manifestSection,
        infoSection: settings.infoSection,
      },
      message: 'Homepage settings updated.',
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update homepage settings.' });
  }
};

module.exports = {
  getHomepageSettings,
  updateHomepageSettings,
};
