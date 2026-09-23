const { resolveSession } = require('../services/sessionService');
require('dotenv').config();

module.exports = async (req, res, next) => {
  delete req.user;
  try {
    const user = await resolveSession(req);
    if (user) req.user = user;
    return next();
  } catch {
    return res.status(503).json({ success: false, message: 'Authentication temporarily unavailable.' });
  }
};
