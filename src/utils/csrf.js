const crypto = require('crypto');

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_TTL_MS = 2 * 60 * 60 * 1000;

const csrfTokens = new Map();

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(token);
    }
  }
}, 10 * 60 * 1000);

/**
 * NOTE: In-memory CSRF storage is suitable for single-instance deployments.
 * Tokens are lost on restart and won't work across multiple instances; use shared storage (e.g., Redis) for multi-instance setups.
 */

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const storeCsrfToken = (token, userId) => {
  csrfTokens.set(token, {
    userId,
    expiresAt: Date.now() + CSRF_TTL_MS
  });
};

const isTokenValidForUser = (entry, userId) => {
  if (entry.userId === null || entry.userId === undefined) {
    return userId === null || userId === undefined;
  }
  return entry.userId === userId;
};

const ensureCsrfToken = (token, userId) => {
  const entry = csrfTokens.get(token);
  if (!entry) {
    return false;
  }

  if (Date.now() > entry.expiresAt) {
    csrfTokens.delete(token);
    return false;
  }

  if (!isTokenValidForUser(entry, userId)) {
    return false;
  }

  return true;
};

module.exports = {
  CSRF_COOKIE,
  CSRF_HEADER,
  clearCsrfInterval: () => clearInterval(cleanupInterval),
  generateCsrfToken,
  storeCsrfToken,
  ensureCsrfToken
};
