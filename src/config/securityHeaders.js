const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
const corsOptions = { origin: frontendUrl, credentials: true };

const helmetConfig = {
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "connect-src": ["'self'", frontendUrl],
      "frame-ancestors": ["'self'"],
      "img-src": ["'self'", "data:"],
      "script-src": ["'self'"],
      "style-src": ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'no-referrer' }
};

module.exports = {
  helmetConfig,
  frontendUrl,
  corsOptions
};
