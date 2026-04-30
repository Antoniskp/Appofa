const { LocationSection, Location, User } = require('../models');
const { getDescendantLocationIds } = require('../utils/locationUtils');

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validate that a string is an https:// URL.
 * Returns true for empty/null (optional fields).
 */
const isValidHttpsUrl = (url) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate section content against the expected shape for each type.
 * Returns null on success or a descriptive error string.
 */
const validateContent = (type, content) => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return 'content must be a JSON object';
  }

  switch (type) {
    case 'official_links': {
      const links = content.links;
      if (!Array.isArray(links)) return 'official_links content must have a "links" array';
      for (const item of links) {
        if (!item.label || typeof item.label !== 'string') return 'Each link must have a string "label"';
        if (!item.url || typeof item.url !== 'string') return 'Each link must have a string "url"';
        if (!isValidHttpsUrl(item.url)) return `Link URL must start with https://: "${item.url}"`;
      }
      break;
    }

    case 'contacts': {
      const phones = content.phones || [];
      const emails = content.emails || [];
      if (!Array.isArray(phones)) return '"phones" must be an array';
      if (!Array.isArray(emails)) return '"emails" must be an array';
      for (const p of phones) {
        if (!p.label || typeof p.label !== 'string') return 'Each phone must have a string "label"';
        if (!p.value || typeof p.value !== 'string') return 'Each phone must have a string "value"';
      }
      for (const e of emails) {
        if (!e.label || typeof e.label !== 'string') return 'Each email must have a string "label"';
        if (!e.value || typeof e.value !== 'string') return 'Each email must have a string "value"';
      }
      break;
    }

    case 'webcams': {
      const webcams = content.webcams;
      if (!Array.isArray(webcams)) return 'webcams content must have a "webcams" array';
      const validEmbedTypes = ['iframe', 'image', 'link'];
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
      for (const cam of webcams) {
        if (!cam.label || typeof cam.label !== 'string') return 'Each webcam must have a string "label"';
        if (!cam.url || typeof cam.url !== 'string') return 'Each webcam must have a string "url"';
        if (!isValidHttpsUrl(cam.url)) return `Webcam URL must start with https://: "${cam.url}"`;
        if (cam.embedType && !validEmbedTypes.includes(cam.embedType)) {
          return `Webcam embedType must be one of: ${validEmbedTypes.join(', ')}`;
        }
        // Auto-detect embedType from URL if not explicitly set to 'iframe'
        if (!cam.embedType || cam.embedType === 'link') {
          cam.embedType = imageExtensions.test(cam.url.split('?')[0]) ? 'image' : 'link';
        }
      }
      break;
    }

    case 'announcements': {
      const items = content.items;
      if (!Array.isArray(items)) return 'announcements content must have an "items" array';
      for (const ann of items) {
        if (!ann.title || typeof ann.title !== 'string') return 'Each announcement must have a string "title"';
        if (ann.linkUrl && !isValidHttpsUrl(ann.linkUrl)) {
          return `Announcement linkUrl must start with https://: "${ann.linkUrl}"`;
        }
        if (ann.startsAt && isNaN(Date.parse(ann.startsAt))) {
          return `Announcement startsAt must be a valid ISO date string`;
        }
        if (ann.endsAt && isNaN(Date.parse(ann.endsAt))) {
          return `Announcement endsAt must be a valid ISO date string`;
        }
      }
      break;
    }

    case 'news_sources': {
      const sources = content.sources;
      if (!Array.isArray(sources) || sources.length === 0) return 'news_sources content must have a non-empty "sources" array';
      for (const source of sources) {
        if (!source.name || typeof source.name !== 'string') return 'Each source must have a string "name"';
        if (!source.url || typeof source.url !== 'string') return 'Each source must have a string "url"';
        if (!isValidHttpsUrl(source.url)) return `Source URL must start with https://: "${source.url}"`;
      }
      break;
    }

    default:
      return `Unknown section type: "${type}"`;
  }

  return null;
};

// ---------------------------------------------------------------------------
// Controller functions
// ---------------------------------------------------------------------------

/**
 * GET /api/locations/:locationId/sections
 * Public: returns only published sections.
 * Moderator/Admin (when authenticated & authorised): returns all sections.
 */
exports.getSections = async (req, res) => {
  try {
    const { locationId } = req.params;
    const isModerator = req.user && ['admin', 'moderator'].includes(req.user.role);

    const location = await Location.findByPk(locationId);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const scopeError = await ensureModeratorWithinScope(req, locationId);
    if (scopeError) {
      return res.status(scopeError.status).json({ success: false, message: scopeError.message });
    }

    const where = { locationId };
    if (!isModerator) {
      where.isPublished = true;
    }

    const sections = await LocationSection.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    });

    return res.status(200).json({ success: true, sections });
  } catch (err) {
    console.error('getSections error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /api/locations/:locationId/sections
 * Moderator/Admin only.
 */
exports.createSection = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { type, title, content, isPublished, sortOrder } = req.body;

    const location = await Location.findByPk(locationId);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const scopeError = await ensureModeratorWithinScope(req, locationId);
    if (scopeError) {
      return res.status(scopeError.status).json({ success: false, message: scopeError.message });
    }

    if (!type || !LocationSection.SECTION_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section type. Must be one of: ${LocationSection.SECTION_TYPES.join(', ')}`
      });
    }

    const contentError = validateContent(type, content);
    if (contentError) {
      return res.status(400).json({ success: false, message: contentError });
    }

    // For news_sources, enforce a single section per location by merging into the existing one
    if (type === 'news_sources') {
      const existing = await LocationSection.findOne({ where: { locationId, type: 'news_sources' } });
      if (existing) {
        const existingSources = existing.content?.sources || [];
        const newSources = content.sources || [];
        existing.content = { sources: [...existingSources, ...newSources] };
        existing.updatedByUserId = req.user.id;
        await existing.save();
        return res.status(200).json({ success: true, section: existing });
      }
    }

    // Default sortOrder to end of list
    let order = sortOrder;
    if (order === undefined || order === null) {
      const max = await LocationSection.max('sortOrder', { where: { locationId } });
      order = (max || 0) + 1;
    }

    const section = await LocationSection.create({
      locationId,
      type,
      title: title || null,
      content,
      isPublished: isPublished === true,
      sortOrder: order,
      createdByUserId: req.user.id,
      updatedByUserId: req.user.id
    });

    return res.status(201).json({ success: true, section });
  } catch (err) {
    console.error('createSection error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/locations/:locationId/sections/:id
 * Moderator/Admin only.
 */
exports.updateSection = async (req, res) => {
  try {
    const { locationId, id } = req.params;
    const { title, content, isPublished, sortOrder } = req.body;

    const scopeError = await ensureModeratorWithinScope(req, locationId);
    if (scopeError) {
      return res.status(scopeError.status).json({ success: false, message: scopeError.message });
    }

    const section = await LocationSection.findOne({
      where: { id, locationId }
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    if (content !== undefined) {
      const contentError = validateContent(section.type, content);
      if (contentError) {
        return res.status(400).json({ success: false, message: contentError });
      }
      section.content = content;
    }

    if (title !== undefined) section.title = title || null;
    if (isPublished !== undefined) section.isPublished = isPublished === true;
    if (sortOrder !== undefined) section.sortOrder = sortOrder;
    section.updatedByUserId = req.user.id;

    await section.save();

    return res.status(200).json({ success: true, section });
  } catch (err) {
    console.error('updateSection error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * DELETE /api/locations/:locationId/sections/:id
 * Moderator/Admin only.
 */
exports.deleteSection = async (req, res) => {
  try {
    const { locationId, id } = req.params;

    const scopeError = await ensureModeratorWithinScope(req, locationId);
    if (scopeError) {
      return res.status(scopeError.status).json({ success: false, message: scopeError.message });
    }

    const section = await LocationSection.findOne({ where: { id, locationId } });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    await section.destroy();
    return res.status(200).json({ success: true, message: 'Section deleted' });
  } catch (err) {
    console.error('deleteSection error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /api/locations/:locationId/sections/reorder
 * Moderator/Admin only.
 * Body: { order: [{ id, sortOrder }, ...] }
 */
exports.reorderSections = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: '"order" must be an array' });
    }

    for (const item of order) {
      if (!item.id || item.sortOrder === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have "id" and "sortOrder"'
        });
      }
      await LocationSection.update(
        { sortOrder: item.sortOrder, updatedByUserId: req.user.id },
        { where: { id: item.id, locationId } }
      );
    }

    return res.status(200).json({ success: true, message: 'Sections reordered' });
  } catch (err) {
    console.error('reorderSections error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Export validateContent for use in tests
exports.validateContent = validateContent;
exports.isValidHttpsUrl = isValidHttpsUrl;
const ensureModeratorWithinScope = async (req, locationId) => {
  if (!(req.user && req.user.role === 'moderator')) return null;
  const actor = await User.findByPk(req.user.id, { attributes: ['id', 'moderatorLocationId'] });
  if (!actor || !actor.moderatorLocationId) {
    return { success: false, status: 403, message: 'Moderator must have an assigned location.' };
  }
  const allowedIds = await getDescendantLocationIds(actor.moderatorLocationId, true);
  const allowedIdSet = new Set(allowedIds.map(Number));
  if (!allowedIdSet.has(Number(locationId))) {
    return { success: false, status: 403, message: 'Forbidden: location outside your scope.' };
  }
  return null;
};
