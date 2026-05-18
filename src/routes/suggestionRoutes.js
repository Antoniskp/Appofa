const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, createLimiter, anonVoteLimiter, authVoteLimiter } = require('../middleware/rateLimiter');
const { getCookie } = require('../utils/cookies');
const { CSRF_COOKIE, CSRF_HEADER, ensureCsrfToken } = require('../utils/csrf');

// Optional CSRF — required for authenticated users, optional (but validated if present)
// for unauthenticated users. Matches the pattern used in pollRoutes.js.
const optionalCsrfProtection = (req, res, next) => {
  const token = getCookie(req, CSRF_COOKIE);
  const headerToken = req.headers[CSRF_HEADER];
  const method = req.method.toUpperCase();

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  if (!req.user) {
    if (token && headerToken) {
      if (token !== headerToken || !ensureCsrfToken(token, null)) {
        return res.status(403).json({ success: false, message: 'Invalid CSRF token.' });
      }
    }
    return next();
  }

  if (!token || !headerToken || token !== headerToken) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token.' });
  }

  if (!ensureCsrfToken(token, req.user.id)) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token.' });
  }

  return next();
};

// Public routes – optional auth to expose myVote
router.get('/', optionalAuthMiddleware, apiLimiter, suggestionController.getSuggestions);
router.get('/category-counts', apiLimiter, suggestionController.getCategoryCounts);
router.get('/:id', optionalAuthMiddleware, apiLimiter, suggestionController.getSuggestionById);
router.get('/:id/solutions', optionalAuthMiddleware, apiLimiter, suggestionController.getSolutions);

// Protected routes – auth required
router.post('/', createLimiter, authMiddleware, csrfProtection, suggestionController.createSuggestion);
router.patch('/:id', apiLimiter, authMiddleware, csrfProtection, suggestionController.updateSuggestion);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, suggestionController.deleteSuggestion);
router.post('/:id/solutions', createLimiter, authMiddleware, csrfProtection, suggestionController.createSolution);

// Vote route — optionalAuth runs first so limiters can inspect req.user.
// Anonymous voting is allowed when the suggestion's voteRestriction is 'anyone'.
router.post('/:id/vote', optionalAuthMiddleware, apiLimiter, anonVoteLimiter, authVoteLimiter, optionalCsrfProtection, suggestionController.voteSuggestion);

module.exports = router;
