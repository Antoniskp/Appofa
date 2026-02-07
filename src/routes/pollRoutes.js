const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');
const rateLimit = require('express-rate-limit');
const { getCookie } = require('../utils/cookies');
const { CSRF_COOKIE, CSRF_HEADER, ensureCsrfToken } = require('../utils/csrf');

// Vote rate limiter - 10 votes per hour for unauthenticated users
const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 votes per hour
  message: {
    success: false,
    message: 'Too many votes from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for authenticated users
  skip: (req) => !!req.user
});

// Optional CSRF protection - works for both authenticated and unauthenticated users
const optionalCsrfProtection = (req, res, next) => {
  const token = getCookie(req, CSRF_COOKIE);
  const headerToken = req.headers[CSRF_HEADER];
  const method = req.method.toUpperCase();

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  // For unauthenticated users, allow requests without CSRF if no token is present
  // But if token is present, it must be valid
  if (!req.user) {
    if (token && headerToken) {
      // Validate CSRF for unauthenticated user
      if (token !== headerToken || !ensureCsrfToken(token, null)) {
        return res.status(403).json({
          success: false,
          message: 'Invalid CSRF token.'
        });
      }
    }
    return next();
  }

  // For authenticated users, CSRF is required
  if (!token || !headerToken || token !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token.'
    });
  }

  if (!ensureCsrfToken(token, req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token.'
    });
  }

  return next();
};

// Public routes with optional authentication
router.get('/', apiLimiter, optionalAuthMiddleware, pollController.getAllPolls);
router.get('/:id', apiLimiter, optionalAuthMiddleware, pollController.getPollById);
router.get('/:id/results', apiLimiter, optionalAuthMiddleware, pollController.getResults);

// Voting route - public or authenticated based on poll settings
router.post('/:id/vote', voteLimiter, optionalAuthMiddleware, optionalCsrfProtection, pollController.votePoll);

// Protected routes - require authentication
router.post('/', createLimiter, authMiddleware, csrfProtection, pollController.createPoll);
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, pollController.updatePoll);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, pollController.deletePoll);
router.post('/:id/options', apiLimiter, authMiddleware, csrfProtection, pollController.addPollOption);

module.exports = router;
