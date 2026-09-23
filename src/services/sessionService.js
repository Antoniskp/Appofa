const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getCookie } = require('../utils/cookies');

// Cache only within one HTTP request, never across requests or security changes.
const resolvedSession = Symbol('resolvedSession');
async function resolveSession(req) {
  if (!req[resolvedSession]) {
    req[resolvedSession] = (async () => {
      const token = req.headers.authorization?.split(' ')[1] || getCookie(req, 'auth_token');
      if (!token || !process.env.JWT_SECRET) return null;
      let claims;
      try {
        claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      } catch {
        return null;
      }
      if (!Number.isInteger(claims.id) || claims.id < 1) return null;
      const user = await User.findByPk(claims.id, {
        attributes: ['id', 'username', 'email', 'role', 'isVerified', 'emailVerified', 'sessionVersion'],
      });
      if (!user || (claims.sessionVersion ?? '0') !== user.sessionVersion) return null;
      return {
        id: user.id, username: user.username, email: user.email, role: user.role,
        isVerified: Boolean(user.isVerified), emailVerified: Boolean(user.emailVerified),
      };
    })();
  }
  return req[resolvedSession];
}

module.exports = { resolveSession };
