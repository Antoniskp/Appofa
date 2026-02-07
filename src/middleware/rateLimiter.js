const rateLimit = require('express-rate-limit');

const isTestEnv = process.env.NODE_ENV === 'test';

// General API rate limiter - 100 requests per 15 minutes (disabled in test)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 0 : 100, // Disable in test, 100 in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: () => isTestEnv, // Skip rate limiting in test environment
});

// Stricter rate limiter for authentication routes - 5 requests per 15 minutes (disabled in test)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 0 : 5, // Disable in test, 5 in production
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: () => isTestEnv, // Skip rate limiting in test environment
});

// Create operation rate limiter - 20 requests per 15 minutes (disabled in test)
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 0 : 20, // Disable in test, 20 in production
  message: {
    success: false,
    message: 'Too many create requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv, // Skip rate limiting in test environment
});

module.exports = {
  apiLimiter,
  authLimiter,
  createLimiter
};
