const rateLimit = require('express-rate-limit');
const ipAccessService = require('../services/ipAccessService');
const { normalizeIp } = require('../utils/normalizeIp');

const skipForWhitelist = async (req) => {
  if (process.env.NODE_ENV === 'test') return true;
  const rules = await ipAccessService.getIpRulesCache();
  const clientIp = normalizeIp(req.ip) || req.ip;
  return rules.whitelist.has(clientIp);
};

/**
 * Creates a structured 429 handler for rate limiters.
 * Returns `retryAfter` (seconds) and `resetTime` (epoch ms) alongside the error message.
 * @param {string} message - Human-readable error message
 * @returns {Function} express-rate-limit handler
 */
const makeRateLimitHandler = (message) => (req, res) => {
  const info = req.rateLimit;
  const resetTime =
    info?.resetTime instanceof Date
      ? info.resetTime.getTime()
      : Date.now() + (info?.windowMs ?? 60 * 60 * 1000);
  const retryAfter = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
  return res.status(429).json({ success: false, message, retryAfter, resetTime });
};

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
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

// Vote rate limiter for anonymous users - 10 votes per hour.
// Skipped for authenticated users (req.user must be set before this middleware runs).
const anonVoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  skip: (req) => !!req.user || process.env.NODE_ENV === 'test',
  handler: makeRateLimitHandler(
    'Too many votes. Create an account or sign in for higher limits.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

// Vote rate limiter for authenticated users - 50 votes per hour.
// Skipped for unauthenticated users (handled by anonVoteLimiter).
const authVoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  skip: (req) => !req.user || process.env.NODE_ENV === 'test',
  handler: makeRateLimitHandler(
    'Too many votes from this account, please try again later.'
  ),
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
  anonVoteLimiter,
  authVoteLimiter,
  makeRateLimitHandler,
  ipBlockMiddleware,
};

