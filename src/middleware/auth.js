const { resolveSession } = require('../services/sessionService');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    req.user = await resolveSession(req);
    if (!req.user) return res.status(401).json({ success: false, message: 'Invalid or expired token. Authentication required.' });
    return next();
  } catch {
    return res.status(503).json({ success: false, message: 'Authentication temporarily unavailable.' });
  }
};
