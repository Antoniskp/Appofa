const express = require('express');
const router = express.Router();
const homepageSettingsController = require('../controllers/homepageSettingsController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrfProtection');

router.get('/', apiLimiter, homepageSettingsController.getHomepageSettings);
router.put('/', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, homepageSettingsController.updateHomepageSettings);

module.exports = router;
