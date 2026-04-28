const rateLimit = require('express-rate-limit');
const ipAccessService = require('../services/ipAccessService');
const { normalizeIp } = require('../utils/normalizeIp');

const skipForWhitelist = async (req) => {
  if (process.env.NODE_ENV === 'test') return true;
  const rules = await ipAccessService.getIpRulesCache();
  const clientIp = normalizeIp(req.ip) || req.ip;
  return rules.whitelist.has(clientIp);
};

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 100 requests per windowMs
  skip: skipForWhitelist,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication routes - 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register requests per windowMs
  skip: skipForWhitelist,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Create operation rate limiter - 20 requests per 15 minutes
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 create operations per windowMs
  skip: skipForWhitelist,
  message: {
    success: false,
    message: 'Too many create requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiter - 10 uploads per 15 minutes
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipForWhitelist,
  message: {
    success: false,
    message: 'Too many upload requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const ipBlockMiddleware = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'test') return next();
    const rules = await ipAccessService.getIpRulesCache();
    const clientIp = normalizeIp(req.ip) || req.ip;
    if (rules.blacklist.has(clientIp)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  apiLimiter,
  authLimiter,
  createLimiter,
  uploadLimiter,
  ipBlockMiddleware,
};

