const jwt = require('jsonwebtoken');
require('dotenv').config();

// Optional authentication middleware - doesn't fail if no token is provided
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Ensure JWT_SECRET is set in production
      if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production environment');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
      req.user = decoded;
    }
    // If no token, req.user remains undefined - this is expected
    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};

module.exports = optionalAuthMiddleware;
