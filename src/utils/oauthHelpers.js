const crypto = require('crypto');

/**
 * OAuth state management for CSRF protection
 */
const oauthStates = new Map();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now > data.expiresAt) {
      oauthStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

/**
 * Generate a secure random state token
 */
function generateState(userId = null, mode = 'login') {
  const state = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
  
  oauthStates.set(state, {
    userId,
    mode, // 'login' or 'link'
    expiresAt
  });
  
  return state;
}

/**
 * Validate and consume a state token
 */
function validateState(state) {
  const data = oauthStates.get(state);
  
  if (!data) {
    return null;
  }
  
  if (Date.now() > data.expiresAt) {
    oauthStates.delete(state);
    return null;
  }
  
  // Consume the state (one-time use)
  oauthStates.delete(state);
  
  return data;
}

/**
 * Check if OAuth provider is configured
 */
function isOAuthConfigured(provider) {
  switch (provider) {
    case 'github':
      return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    case 'google':
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case 'facebook':
      return !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
    default:
      return false;
  }
}

module.exports = {
  generateState,
  validateState,
  isOAuthConfigured
};
