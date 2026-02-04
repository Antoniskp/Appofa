const jwt = require('jsonwebtoken');
require('dotenv').config();

const { getCookie } = require('../utils/cookies');

const authMiddleware = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization?.split(' ')[1];
    const cookieToken = getCookie(req, 'auth_token');
    const token = bearerToken || cookieToken;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Authentication required.' 
      });
    }

    // Ensure JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET must be configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

module.exports = authMiddleware;
