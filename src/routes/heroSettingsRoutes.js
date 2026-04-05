const express = require('express');
const router = express.Router();
const heroSettingsController = require('../controllers/heroSettingsController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrfProtection');

/**
 * @route GET /api/hero-settings
 * @desc Get hero background settings (public)
 */
router.get('/', apiLimiter, heroSettingsController.getHeroSettings);

/**
 * @route PUT /api/hero-settings
 * @desc Update hero background settings (admin only)
 */
router.put('/', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, heroSettingsController.updateHeroSettings);

/**
 * @route GET /api/hero-settings/slides
 * @desc Get all slides (admin) or only active slides (public)
 */
router.get('/slides', apiLimiter, optionalAuthMiddleware, heroSettingsController.getSlides);

/**
 * @route POST /api/hero-settings/slides
 * @desc Create a new slide (admin only)
 */
router.post('/slides', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, heroSettingsController.createSlide);

/**
 * @route PUT /api/hero-settings/slides/:id
 * @desc Update a slide (admin only)
 */
router.put('/slides/:id', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, heroSettingsController.updateSlide);

/**
 * @route DELETE /api/hero-settings/slides/:id
 * @desc Delete a slide (admin only)
 */
router.delete('/slides/:id', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, heroSettingsController.deleteSlide);

/**
 * @route PATCH /api/hero-settings/slides/:id/toggle
 * @desc Toggle slide active/inactive (admin only)
 */
router.patch('/slides/:id/toggle', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, heroSettingsController.toggleSlide);

module.exports = router;
