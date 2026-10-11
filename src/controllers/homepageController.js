'use strict';

const { buildHomepagePayload, HOMEPAGE_SECTIONS } = require('../services/homepageService');

const getHomepagePayload = async (req, res) => {
  const locationId = req.query.locationId ? Number(req.query.locationId) : null;
  if (locationId !== null && (!Number.isSafeInteger(locationId) || locationId < 1)) {
    return res.status(400).json({ success: false, message: 'Invalid location ID.' });
  }
  const requested = req.query.sections;
  if (requested !== undefined && (typeof requested !== 'string' || !requested || requested.split(',').some(section => !HOMEPAGE_SECTIONS.includes(section)))) {
    return res.status(400).json({ success: false, message: 'Invalid homepage sections.' });
  }
  const sections = requested ? [...new Set(requested.split(','))] : HOMEPAGE_SECTIONS;
  try {
    const payload = await buildHomepagePayload(req, sections);
    res.set('Cache-Control', 'private, no-store');
    return res.json({ success: true, ...payload });
  } catch (error) {
    console.error('Homepage payload error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load homepage payload.' });
  }
};

module.exports = { getHomepagePayload };
