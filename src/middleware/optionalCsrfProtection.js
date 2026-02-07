const { getCookie } = require('../utils/cookies');
const { CSRF_COOKIE, CSRF_HEADER, ensureCsrfToken } = require('../utils/csrf');

/**
 * Optional CSRF Protection middleware
 * - If user is authenticated, enforce CSRF validation
 * - If user is not authenticated, skip CSRF validation
 */
const optionalCsrfProtection = (req, res, next) => {
  const method = req.method.toUpperCase();

  // Skip CSRF for GET, HEAD, OPTIONS
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  // If no user, skip CSRF (for unauthenticated requests)
  if (!req.user?.id) {
    return next();
  }

  // User is authenticated, enforce CSRF
  const token = getCookie(req, CSRF_COOKIE);
  const headerToken = req.headers[CSRF_HEADER];

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

module.exports = optionalCsrfProtection;
