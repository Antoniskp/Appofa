const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Public routes – optional auth to expose myVote
router.get('/', apiLimiter, optionalAuthMiddleware, suggestionController.getSuggestions);
router.get('/:id', apiLimiter, optionalAuthMiddleware, suggestionController.getSuggestionById);
router.get('/:id/solutions', apiLimiter, optionalAuthMiddleware, suggestionController.getSolutions);

// Protected routes – auth required
router.post('/', createLimiter, authMiddleware, csrfProtection, suggestionController.createSuggestion);
router.patch('/:id', apiLimiter, authMiddleware, csrfProtection, suggestionController.updateSuggestion);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, suggestionController.deleteSuggestion);
router.post('/:id/solutions', createLimiter, authMiddleware, csrfProtection, suggestionController.createSolution);
router.post('/:id/vote', apiLimiter, authMiddleware, csrfProtection, suggestionController.voteSuggestion);

module.exports = router;
