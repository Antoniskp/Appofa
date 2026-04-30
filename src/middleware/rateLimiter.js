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
 * Build a rate-limit handler that returns structured JSON with timing metadata.
 * The frontend can use `retryAfter` (seconds) and `resetTime` (epoch ms) to
 * show an accurate countdown timer to the user.
 */
const makeRateLimitHandler = (message) => (req, res, _next, options) => {
  const now = Date.now();
  const resetMs = req.rateLimit?.resetTime instanceof Date
    ? req.rateLimit.resetTime.getTime()
    : now + options.windowMs;
  const retryAfter = Math.max(1, Math.ceil((resetMs - now) / 1000));
  return res.status(options.statusCode).json({
    success: false,
    message,
    retryAfter,
    resetTime: resetMs,
  });
};

// General API rate limiter - 200 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  skip: skipForWhitelist,
  handler: makeRateLimitHandler('Too many requests from this IP, please try again later.'),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication routes - 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skip: skipForWhitelist,
  handler: makeRateLimitHandler('Too many authentication attempts from this IP, please try again after 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Create operation rate limiter - 20 requests per 15 minutes
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  skip: skipForWhitelist,
  handler: makeRateLimitHandler('Too many create requests from this IP, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiter - 10 uploads per 15 minutes
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipForWhitelist,
  handler: makeRateLimitHandler('Too many upload requests from this IP, please try again later.'),
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
  makeRateLimitHandler,
};

