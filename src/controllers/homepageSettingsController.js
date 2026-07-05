const HomepageSettings = require('../models/HomepageSettings');

const DEFAULT_MANIFEST_SECTION = { enabled: true, audience: 'all' };

function sanitizeAudience(audience, fallback) {
  if (typeof audience !== 'string') return fallback;
  return ['all', 'guest', 'registered'].includes(audience) ? audience : fallback;
}

function normalizeManifestSection(input = {}) {
  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULT_MANIFEST_SECTION.enabled,
    audience: sanitizeAudience(input.audience, DEFAULT_MANIFEST_SECTION.audience),
  };
}

async function getOrCreateSettings() {
  let settings = await HomepageSettings.findOne();
  if (!settings) {
    settings = await HomepageSettings.create({
      manifestSection: DEFAULT_MANIFEST_SECTION,
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
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to read homepage settings.' });
  }
};

const updateHomepageSettings = async (req, res) => {
  try {
    const { manifestSection } = req.body || {};

    if (manifestSection !== undefined && (typeof manifestSection !== 'object' || manifestSection === null || Array.isArray(manifestSection))) {
      return res.status(400).json({ success: false, message: 'manifestSection must be an object.' });
    }

    const settings = await getOrCreateSettings();

    if (manifestSection !== undefined) {
      settings.manifestSection = normalizeManifestSection(manifestSection);
    }

    await settings.save({ fields: ['manifestSection', 'updatedAt'] });

    return res.json({
      success: true,
      data: {
        manifestSection: settings.manifestSection,
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
