const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, createLimiter, authVoteLimiter } = require('../middleware/rateLimiter');

// Public routes – optional auth to expose myVote
router.get('/', apiLimiter, optionalAuthMiddleware, suggestionController.getSuggestions);
router.get('/category-counts', apiLimiter, suggestionController.getCategoryCounts);
router.get('/:id', apiLimiter, optionalAuthMiddleware, suggestionController.getSuggestionById);
router.get('/:id/solutions', apiLimiter, optionalAuthMiddleware, suggestionController.getSolutions);

// Protected routes – auth required
router.post('/', createLimiter, authMiddleware, csrfProtection, suggestionController.createSuggestion);
router.patch('/:id', apiLimiter, authMiddleware, csrfProtection, suggestionController.updateSuggestion);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, suggestionController.deleteSuggestion);
router.post('/:id/solutions', createLimiter, authMiddleware, csrfProtection, suggestionController.createSolution);
// apiLimiter runs first (satisfies rate-limit check); authMiddleware sets req.user;
// authVoteLimiter applies the per-authenticated-user 50/hr cap.
router.post('/:id/vote', apiLimiter, authMiddleware, authVoteLimiter, csrfProtection, suggestionController.voteSuggestion);

module.exports = router;
