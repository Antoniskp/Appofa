'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pushController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// All push routes require authentication; rate-limit before auth to prevent DoS
router.use(apiLimiter, authMiddleware);

// Register / refresh a push subscription for this device
router.post('/subscribe', createLimiter, csrfProtection, ctrl.subscribe);

// Remove a push subscription (unsubscribe from push on this device)
router.delete('/subscribe', createLimiter, csrfProtection, ctrl.unsubscribe);

module.exports = router;
