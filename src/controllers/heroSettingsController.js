const { randomUUID } = require('crypto');
const HeroSettings = require('../models/HeroSettings');

const DEFAULT_SETTINGS = {
  backgroundImageUrl: '',
  backgroundColor: '#1a2a3a',
  slides: [
    {
      id: 'default-slide-1',
      title: 'Αποφάσεις που ξεκινούν από εσένα.',
      subtitle: 'Συμμετείχε σε ανοιχτές ψηφοφορίες, κατέθεσε προτάσεις και επηρέασε τις εξελίξεις στην περιοχή σου με διαφάνεια και πραγματικό αντίκτυπο.',
      linkUrl: '',
      linkText: '',
      isActive: true,
      order: 1,
    },
  ],
};

function generateId() {
  return randomUUID();
}

function normalizeSlidesOrder(slides = []) {
  return [...slides]
    .map((slide, index) => ({ ...slide, _originalIndex: index }))
    .sort((a, b) => {
      const aOrder = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
      const bOrder = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a._originalIndex - b._originalIndex;
    })
    .map((slide, index) => {
      const normalizedSlide = { ...slide };
      delete normalizedSlide._originalIndex;
      return { ...normalizedSlide, order: index + 1 };
    });
}

async function getOrCreateSettings() {
  let settings = await HeroSettings.findOne();
  if (!settings) {
    settings = await HeroSettings.create({
      backgroundImageUrl: DEFAULT_SETTINGS.backgroundImageUrl,
      backgroundColor: DEFAULT_SETTINGS.backgroundColor,
      slides: DEFAULT_SETTINGS.slides,
    });
  }
  return settings;
}

function isValidUrl(str) {
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
        slides: settings.slides,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to read hero settings.' });
  }
};

const updateHeroSettings = async (req, res) => {
  try {
    const { backgroundImageUrl, backgroundColor } = req.body;

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

    const settings = await getOrCreateSettings();

    if (backgroundImageUrl !== undefined) {
      settings.backgroundImageUrl = backgroundImageUrl.trim();
    }
    if (backgroundColor !== undefined) {
      settings.backgroundColor = backgroundColor;
    }

    await settings.save({ fields: ['backgroundImageUrl', 'backgroundColor', 'updatedAt'] });

    return res.json({
      success: true,
      data: {
        backgroundImageUrl: settings.backgroundImageUrl,
        backgroundColor: settings.backgroundColor,
        slides: settings.slides,
      },
      message: 'Hero settings updated.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update hero settings.' });
  }
};

// GET /api/hero-settings/slides
// Admin: returns all slides; public: returns only active slides sorted by order
const getSlides = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const isAdmin = req.user && req.user.role === 'admin';
    let slides = normalizeSlidesOrder(settings.slides || []);
    if (!isAdmin) {
      slides = slides.filter((s) => s.isActive);
    }
    return res.json({ success: true, data: slides });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to read slides.' });
  }
};

// POST /api/hero-settings/slides
const createSlide = async (req, res) => {
  try {
    const { title, subtitle, linkUrl, linkText, isActive, order } = req.body;

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
    const slides = normalizeSlidesOrder(settings.slides || []);
    const resolvedOrder = typeof order === 'number' ? order : slides.length + 1;

    const newSlide = {
      id: generateId(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      linkUrl: (linkUrl && linkUrl.trim()) ? linkUrl.trim() : '',
      linkText: (linkText && linkText.trim()) ? linkText.trim() : '',
      isActive: typeof isActive === 'boolean' ? isActive : true,
      order: resolvedOrder,
    };

    settings.slides = normalizeSlidesOrder([...slides, newSlide]);
    settings.changed('slides', true);
    await settings.save({ fields: ['slides', 'updatedAt'] });

    const persistedSlide = settings.slides.find((slide) => slide.id === newSlide.id) || newSlide;
    return res.status(201).json({ success: true, data: persistedSlide, message: 'Slide created.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create slide.' });
  }
};

// PUT /api/hero-settings/slides/:id
const updateSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, linkUrl, linkText, isActive, order } = req.body;

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
    const slides = normalizeSlidesOrder(settings.slides || []);
    const idx = slides.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Slide not found.' });
    }

    const existing = slides[idx];
    const updatedSlide = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      subtitle: subtitle !== undefined ? subtitle.trim() : existing.subtitle,
      linkUrl: linkUrl !== undefined ? (linkUrl.trim() || '') : existing.linkUrl,
      linkText: linkText !== undefined ? (linkText.trim() || '') : existing.linkText,
      isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
      order: typeof order === 'number' ? order : existing.order,
    };

    const updatedSlides = [...slides];
    updatedSlides[idx] = updatedSlide;
    settings.slides = normalizeSlidesOrder(updatedSlides);
    settings.changed('slides', true);
    await settings.save({ fields: ['slides', 'updatedAt'] });

    return res.json({ success: true, data: updatedSlide, message: 'Slide updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update slide.' });
  }
};

// DELETE /api/hero-settings/slides/:id
const deleteSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = await getOrCreateSettings();
    const slides = normalizeSlidesOrder(settings.slides || []);
    const idx = slides.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Slide not found.' });
    }
    settings.slides = normalizeSlidesOrder(slides.filter((s) => s.id !== id));
    settings.changed('slides', true);
    await settings.save({ fields: ['slides', 'updatedAt'] });
    return res.json({ success: true, message: 'Slide deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete slide.' });
  }
};

// PATCH /api/hero-settings/slides/reorder
const reorderSlides = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'updates must be a non-empty array.' });
    }
    for (const entry of updates) {
      if (typeof entry.id !== 'string' || typeof entry.order !== 'number') {
        return res.status(400).json({ success: false, message: 'Each update must have a string id and a number order.' });
      }
    }

    const settings = await getOrCreateSettings();
    const slides = normalizeSlidesOrder(settings.slides || []);

    const uniqueIds = new Set(updates.map((u) => u.id));
    if (uniqueIds.size !== updates.length) {
      return res.status(400).json({ success: false, message: 'Duplicate slide ids are not allowed in updates.' });
    }
    if (updates.length !== slides.length) {
      return res.status(400).json({ success: false, message: 'updates must include every existing slide exactly once.' });
    }

    const existingIds = new Set(slides.map((slide) => slide.id));
    for (const id of uniqueIds) {
      if (!existingIds.has(id)) {
        return res.status(400).json({ success: false, message: `Slide with id ${id} does not exist.` });
      }
    }

    const orderMap = new Map(updates.map((u) => [u.id, u.order]));
    const reorderedSlides = [...slides].sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));
    const updatedSlides = normalizeSlidesOrder(reorderedSlides);

    settings.slides = updatedSlides;
    settings.changed('slides', true);
    await settings.save({ fields: ['slides', 'updatedAt'] });

    return res.json({ success: true, data: updatedSlides, message: 'Slides reordered.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reorder slides.' });
  }
};

// PATCH /api/hero-settings/slides/:id/toggle
const toggleSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = await getOrCreateSettings();
    const slides = normalizeSlidesOrder(settings.slides || []);
    const idx = slides.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Slide not found.' });
    }
    const updatedSlides = [...slides];
    updatedSlides[idx] = { ...updatedSlides[idx], isActive: !updatedSlides[idx].isActive };
    settings.slides = normalizeSlidesOrder(updatedSlides);
    settings.changed('slides', true);
    await settings.save({ fields: ['slides', 'updatedAt'] });
    return res.json({ success: true, data: updatedSlides[idx], message: `Slide ${updatedSlides[idx].isActive ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle slide.' });
  }
};

module.exports = { getHeroSettings, updateHeroSettings, getSlides, createSlide, updateSlide, deleteSlide, toggleSlide, reorderSlides };
