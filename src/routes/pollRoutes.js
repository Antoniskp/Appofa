const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const optionalCsrfProtection = require('../middleware/optionalCsrfProtection');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Public routes (with optional auth for personalization)
router.get('/', apiLimiter, optionalAuthMiddleware, pollController.getAllPolls);
router.get('/:id', apiLimiter, optionalAuthMiddleware, pollController.getPollById);
router.get('/:id/results', apiLimiter, pollController.getPollResults);

// Protected routes (require authentication)
router.post('/', createLimiter, authMiddleware, csrfProtection, pollController.createPoll);
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, pollController.updatePoll);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, pollController.deletePoll);

// Voting (optionally authenticated based on poll settings)
router.post('/:id/vote', createLimiter, optionalAuthMiddleware, optionalCsrfProtection, pollController.vote);

// Additional options
router.post('/:id/options', createLimiter, authMiddleware, csrfProtection, pollController.addPollOption);

module.exports = router;
