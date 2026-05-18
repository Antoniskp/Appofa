const express = require('express');
const router = express.Router();

const civicQuestionController = require('../controllers/civicQuestionController');
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

router.get('/', optionalAuthMiddleware, apiLimiter, civicQuestionController.listCivicQuestions);
router.get('/:id', optionalAuthMiddleware, apiLimiter, civicQuestionController.getCivicQuestionById);
router.get('/:id/results', optionalAuthMiddleware, apiLimiter, civicQuestionController.getCivicQuestionResults);

router.post('/', createLimiter, authMiddleware, csrfProtection, civicQuestionController.createCivicQuestion);
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, civicQuestionController.updateCivicQuestion);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, civicQuestionController.deleteCivicQuestion);

// Vote route — optionalAuth runs first so limiters can inspect req.user.
// Anonymous voting is allowed when the question's voteRestriction is 'anyone'.
router.post('/:id/vote', optionalAuthMiddleware, apiLimiter, anonVoteLimiter, authVoteLimiter, optionalCsrfProtection, civicQuestionController.voteCivicQuestion);

module.exports = router;
