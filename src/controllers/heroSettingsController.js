const { randomUUID } = require('crypto');
const HeroSettings = require('../models/HeroSettings');

const DEFAULT_SETTINGS = {
  backgroundImageUrl: '',
  backgroundColor: '#1a2a3a',
  counterEnabled: true,
  slides: [
    {
      id: 'default-slide-1',
      title: 'Αποφάσεις που ξεκινούν από εσένα.',
      subtitle: 'Συμμετείχε σε ανοιχτές ψηφοφορίες, κατέθεσε προτάσεις και επηρέασε τις εξελίξεις στην περιοχή σου με διαφάνεια και πραγματικό αντίκτυπο.',
      linkUrl: '',
      linkText: '',
      isActive: true,
    },
  ],
};

function generateId() {
  return randomUUID();
}

/**
 * Strip any legacy `order` field from slides.
 * Array position is the canonical order — no `order` property needed.
 */
function cleanSlides(slides = []) {
  return slides.map(({ order: _order, ...rest }) => rest);
}

async function getOrCreateSettings() {
  let settings = await HeroSettings.findOne({ order: [['id', 'ASC']] });
  if (!settings) {
    settings = await HeroSettings.create({
      backgroundImageUrl: DEFAULT_SETTINGS.backgroundImageUrl,
      backgroundColor: DEFAULT_SETTINGS.backgroundColor,
      counterEnabled: DEFAULT_SETTINGS.counterEnabled,
      slides: DEFAULT_SETTINGS.slides,
    });
  }
  return settings;
}

async function deduplicateHeroSettings() {
  const all = await HeroSettings.findAll({ order: [['id', 'ASC']] });
  if (all.length > 1) {
    const idsToDelete = all.slice(1).map((row) => row.id);
    await HeroSettings.destroy({ where: { id: idsToDelete } });
    console.log(`[HeroSettings] Removed ${idsToDelete.length} duplicate row(s).`);
  }
}

/** Persist slides array and return the cleaned version. */
async function saveSlides(settings, slides) {
  const cleaned = cleanSlides(slides);
  settings.slides = cleaned;
  settings.changed('slides', true);
  await settings.save({ fields: ['slides', 'updatedAt'] });
  return cleaned;
}

function isValidUrl(str) {
  if (str.startsWith('/')) {
    return !str.startsWith('//');
  }
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const getHeroSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      success: true,
      data: {
        backgroundImageUrl: settings.backgroundImageUrl,
        backgroundColor: settings.backgroundColor,
        counterEnabled: settings.counterEnabled,
        slides: cleanSlides(settings.slides),
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to read hero settings.' });
  }
};

const updateHeroSettings = async (req, res) => {
  try {
    const { backgroundImageUrl, backgroundColor, counterEnabled } = req.body;

    if (backgroundImageUrl !== undefined && typeof backgroundImageUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'backgroundImageUrl must be a string.' });
    }
    if (backgroundImageUrl && backgroundImageUrl.trim() && !/^https?:\/\//i.test(backgroundImageUrl.trim())) {
      return res.status(400).json({ success: false, message: 'backgroundImageUrl must be a valid http or https URL.' });
    }
    if (backgroundColor !== undefined) {
      if (typeof backgroundColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(backgroundColor)) {
        return res.status(400).json({ success: false, message: 'backgroundColor must be a valid hex color (e.g. #1a2a3a).' });
      }
    }
    if (counterEnabled !== undefined && typeof counterEnabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'counterEnabled must be a boolean.' });
    }

    const settings = await getOrCreateSettings();

    if (backgroundImageUrl !== undefined) {
      settings.backgroundImageUrl = backgroundImageUrl.trim();
    }
    if (backgroundColor !== undefined) {
      settings.backgroundColor = backgroundColor;
    }
    if (counterEnabled !== undefined) {
      settings.counterEnabled = counterEnabled;
    }

    await settings.save({ fields: ['backgroundImageUrl', 'backgroundColor', 'counterEnabled', 'updatedAt'] });

    return res.json({
      success: true,
      data: {
        backgroundImageUrl: settings.backgroundImageUrl,
        backgroundColor: settings.backgroundColor,
        counterEnabled: settings.counterEnabled,
        slides: cleanSlides(settings.slides),
      },
      message: 'Hero settings updated.',
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update hero settings.' });
  }
};

// GET /api/hero-settings/slides
// Admin: returns all slides; public: returns only active slides (array order = display order)
const getSlides = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const isAdmin = req.user && req.user.role === 'admin';
    let slides = cleanSlides(settings.slides || []);
    if (!isAdmin) {
      slides = slides.filter((s) => s.isActive);
    }
    return res.json({ success: true, data: slides });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to read slides.' });
  }
};

// POST /api/hero-settings/slides — new slide is appended at end
const createSlide = async (req, res) => {
  try {
    const { title, subtitle, linkUrl, linkText, isActive } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required and must be a non-empty string.' });
    }
    if (!subtitle || typeof subtitle !== 'string' || !subtitle.trim()) {
      return res.status(400).json({ success: false, message: 'subtitle is required and must be a non-empty string.' });
    }
    if (linkUrl && linkUrl.trim() && !isValidUrl(linkUrl.trim())) {
      return res.status(400).json({ success: false, message: 'linkUrl must be a valid http or https URL.' });
    }
    if (linkText !== undefined && typeof linkText !== 'string') {
      return res.status(400).json({ success: false, message: 'linkText must be a string.' });
    }

    const settings = await getOrCreateSettings();
    const slides = cleanSlides(settings.slides || []);

    const newSlide = {
      id: generateId(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      linkUrl: (linkUrl && linkUrl.trim()) ? linkUrl.trim() : '',
      linkText: (linkText && linkText.trim()) ? linkText.trim() : '',
      isActive: typeof isActive === 'boolean' ? isActive : true,
    };

    const saved = await saveSlides(settings, [...slides, newSlide]);
    return res.status(201).json({ success: true, data: saved, message: 'Slide created.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create slide.' });
  }
};

// PUT /api/hero-settings/slides/:id
const updateSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, linkUrl, linkText, isActive } = req.body;

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ success: false, message: 'title must be a non-empty string.' });
    }
    if (subtitle !== undefined && (typeof subtitle !== 'string' || !subtitle.trim())) {
      return res.status(400).json({ success: false, message: 'subtitle must be a non-empty string.' });
    }
    if (linkUrl && linkUrl.trim() && !isValidUrl(linkUrl.trim())) {
      return res.status(400).json({ success: false, message: 'linkUrl must be a valid http or https URL.' });
    }
    if (linkText !== undefined && typeof linkText !== 'string') {
      return res.status(400).json({ success: false, message: 'linkText must be a string.' });
    }

    const settings = await getOrCreateSettings();
    const slides = cleanSlides(settings.slides || []);
    const idx = slides.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Slide not found.' });
    }

    const existing = slides[idx];
    slides[idx] = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      subtitle: subtitle !== undefined ? subtitle.trim() : existing.subtitle,
      linkUrl: linkUrl !== undefined ? (linkUrl.trim() || '') : existing.linkUrl,
      linkText: linkText !== undefined ? (linkText.trim() || '') : existing.linkText,
      isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
    };

    const saved = await saveSlides(settings, slides);
    return res.json({ success: true, data: saved, message: 'Slide updated.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update slide.' });
  }
};

// DELETE /api/hero-settings/slides/:id
const deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = await getOrCreateSettings();
    const slides = cleanSlides(settings.slides || []);
    const idx = slides.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Slide not found.' });
    }
    const saved = await saveSlides(settings, slides.filter((s) => s.id !== id));
    return res.json({ success: true, data: saved, message: 'Slide deleted.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to delete slide.' });
  }
};

// PATCH /api/hero-settings/slides/reorder
// Accepts { ids: string[] } — listed slide ids are moved first; unlisted slides are appended.
const reorderSlides = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids must be a non-empty array of slide id strings.' });
    }
    for (const id of ids) {
      if (typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'Each id must be a string.' });
      }
    }

    const settings = await getOrCreateSettings();
    const slides = cleanSlides(settings.slides || []);

    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      return res.status(400).json({ success: false, message: 'Duplicate slide ids are not allowed.' });
    }
    const slideMap = new Map(slides.map((s) => [s.id, s]));
    for (const id of ids) {
      if (!slideMap.has(id)) {
        return res.status(400).json({ success: false, message: `Slide with id ${id} does not exist.` });
      }
    }

    const listed = ids.map((id) => slideMap.get(id));
    const unlisted = slides.filter((s) => !uniqueIds.has(s.id));
    const reordered = [...listed, ...unlisted];
    const saved = await saveSlides(settings, reordered);
    return res.json({ success: true, data: saved, message: 'Slides reordered.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to reorder slides.' });
  }
};

// PATCH /api/hero-settings/slides/:id/toggle
const toggleSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = await getOrCreateSettings();
    const slides = cleanSlides(settings.slides || []);
    const idx = slides.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Slide not found.' });
    }
    slides[idx] = { ...slides[idx], isActive: !slides[idx].isActive };
    const saved = await saveSlides(settings, slides);
    return res.json({ success: true, data: saved, message: `Slide ${slides[idx].isActive ? 'activated' : 'deactivated'}.` });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to toggle slide.' });
  }
};

module.exports = { getHeroSettings, updateHeroSettings, getSlides, createSlide, updateSlide, deleteSlide, toggleSlide, reorderSlides, deduplicateHeroSettings };
