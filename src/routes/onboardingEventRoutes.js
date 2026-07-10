'use strict';

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createLimiter } = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrfProtection');
const controller = require('../controllers/onboardingEventController');

/**
 * POST /api/onboarding/events
 * Record a single onboarding funnel milestone for the authenticated user.
 */
router.post('/events', createLimiter, authMiddleware, csrfProtection, controller.recordEvent);

module.exports = router;
