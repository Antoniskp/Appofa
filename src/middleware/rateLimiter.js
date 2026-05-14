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
 * Returns true when a user should be exempt from rate limiting based on their
 * verification status or elevated platform role.
 * @param {object|undefined} user - The user object from req.user (populated by auth middleware).
 * @returns {boolean}
 */
const isUserExemptFromLimits = (user) =>
  !!user && (user.isVerified || ['admin', 'moderator', 'editor'].includes(user.role));

/**
 * Skip function for general-purpose limiters (apiLimiter, createLimiter, uploadLimiter).
 * Bypasses rate limiting for:
 *  - Test environment
 *  - Whitelisted IPs
 *  - Verified users and users with elevated roles (admin, moderator, editor)
 *
 * NOTE: req.user must be populated (i.e., auth middleware must run before the limiter)
 * for the user-based exemption to take effect. All routes using these limiters should
 * place optionalAuthMiddleware or authMiddleware before the limiter in the chain.
 * @param {import('express').Request} req
 * @returns {Promise<boolean>}
 */
const skipForVerifiedOrWhitelist = async (req) => {
  if (process.env.NODE_ENV === 'test') return true;
  // Skip for whitelisted IPs
  const rules = await ipAccessService.getIpRulesCache();
  const clientIp = normalizeIp(req.ip) || req.ip;
  if (rules.whitelist.has(clientIp)) return true;
  // Skip for verified users and admins/moderators/editors
  return isUserExemptFromLimits(req.user);
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

// General API rate limiter - 200 requests per 15 minutes.
// Verified users, admins, moderators, and editors are exempt.
// Auth middleware must run before this limiter for the exemption to take effect.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  skip: skipForVerifiedOrWhitelist,
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

// Password reset request limiter - 5 requests per hour per IP.
// Uses a longer 1-hour window (vs the stricter auth limiter) so legitimate users
// who check their spam folder and retry don't get locked out within 15 minutes.
const passwordResetRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skip: skipForWhitelist,
  handler: makeRateLimitHandler(
    'Too many password reset requests from this IP, please try again later.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset attempt limiter - 10 attempts per 15 minutes
const passwordResetAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipForWhitelist,
  handler: makeRateLimitHandler(
    'Too many password reset attempts from this IP, please try again later.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

// Create operation rate limiter - 20 requests per 15 minutes.
// Verified users, admins, moderators, and editors are exempt.
// Auth middleware must run before this limiter for the exemption to take effect.
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 create operations per windowMs
  skip: skipForVerifiedOrWhitelist,
  message: {
    success: false,
    message: 'Too many create requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiter - 10 uploads per 15 minutes.
// Verified users, admins, moderators, and editors are exempt.
// Auth middleware must run before this limiter for the exemption to take effect.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipForVerifiedOrWhitelist,
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
// Also skipped for verified users and admins/moderators/editors.
const authVoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  skip: (req) => !req.user || isUserExemptFromLimits(req.user) || process.env.NODE_ENV === 'test',
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
    // Whitelist takes precedence over blacklist so trusted admin/test IPs
    // are never accidentally denied by auto-block rules.
    if (rules.whitelist.has(clientIp)) return next();
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
  passwordResetRequestLimiter,
  passwordResetAttemptLimiter,
  createLimiter,
  uploadLimiter,
  anonVoteLimiter,
  authVoteLimiter,
  makeRateLimitHandler,
  ipBlockMiddleware,
};
