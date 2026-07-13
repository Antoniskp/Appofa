const HomepageSettings = require('../models/HomepageSettings');

const DEFAULT_MANIFEST_SECTION = { enabled: true, audience: 'all' };
const DEFAULT_FEATURED_POLL = { enabled: false, audience: 'all', pollId: null };

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

function normalizeFeaturedPoll(input = {}) {
  let pollId = null;
  if (input.pollId !== undefined && input.pollId !== null && input.pollId !== '') {
    const parsed = Number(input.pollId);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return { error: 'featuredPoll.pollId must be a positive integer or null.' };
    }
    pollId = parsed;
  }

  return {
    value: {
      enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULT_FEATURED_POLL.enabled,
      audience: sanitizeAudience(input.audience, DEFAULT_FEATURED_POLL.audience),
      pollId,
    },
  };
}

async function getOrCreateSettings() {
  let settings = await HomepageSettings.findOne();
  if (!settings) {
    settings = await HomepageSettings.create({
      manifestSection: DEFAULT_MANIFEST_SECTION,
      featuredPoll: DEFAULT_FEATURED_POLL,
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
        featuredPoll: settings.featuredPoll,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to read homepage settings.' });
  }
};

const updateHomepageSettings = async (req, res) => {
  try {
    const { manifestSection, featuredPoll } = req.body || {};

    if (manifestSection !== undefined && (typeof manifestSection !== 'object' || manifestSection === null || Array.isArray(manifestSection))) {
      return res.status(400).json({ success: false, message: 'manifestSection must be an object.' });
    }
    if (featuredPoll !== undefined && (typeof featuredPoll !== 'object' || featuredPoll === null || Array.isArray(featuredPoll))) {
      return res.status(400).json({ success: false, message: 'featuredPoll must be an object.' });
    }

    const settings = await getOrCreateSettings();
    const fields = ['updatedAt'];

    if (manifestSection !== undefined) {
      settings.manifestSection = normalizeManifestSection(manifestSection);
      fields.push('manifestSection');
    }

    if (featuredPoll !== undefined) {
      const normalizedFeaturedPoll = normalizeFeaturedPoll(featuredPoll);
      if (normalizedFeaturedPoll.error) {
        return res.status(400).json({ success: false, message: normalizedFeaturedPoll.error });
      }
      settings.featuredPoll = normalizedFeaturedPoll.value;
      fields.push('featuredPoll');
    }

    await settings.save({ fields });

    return res.json({
      success: true,
      data: {
        manifestSection: settings.manifestSection,
        featuredPoll: settings.featuredPoll,
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
