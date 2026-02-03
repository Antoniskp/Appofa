const { getCookie } = require('../utils/cookies');
const { CSRF_COOKIE, CSRF_HEADER, ensureCsrfToken } = require('../utils/csrf');

const csrfProtection = (req, res, next) => {
  const token = getCookie(req, CSRF_COOKIE);
  const headerToken = req.headers[CSRF_HEADER];
  const method = req.method.toUpperCase();

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

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

module.exports = csrfProtection;
