const express = require('express');
const router = express.Router();
const heroSettingsController = require('../controllers/heroSettingsController');
const authMiddleware = require('../middleware/auth');
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

module.exports = router;
