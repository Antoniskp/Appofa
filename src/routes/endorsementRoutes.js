const express = require('express');
const router = express.Router();
const endorsementController = require('../controllers/endorsementController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public routes
router.get('/topics', apiLimiter, endorsementController.topics);
router.get('/leaderboard', apiLimiter, endorsementController.leaderboard);
router.get('/status', apiLimiter, optionalAuthMiddleware, endorsementController.status);

// Authenticated routes
router.post('/', apiLimiter, authMiddleware, csrfProtection, endorsementController.create);
router.delete('/', apiLimiter, authMiddleware, csrfProtection, endorsementController.remove);

module.exports = router;
