const ipAccessService = require('../services/ipAccessService');

const EXACT_SUSPICIOUS_PATHS = new Set([
  '/wp-config.php',
  '/wp-login.php',
  '/.htaccess',
  '/config.yaml',
  '/config.yml',
  '/.config.yaml',
  '/.config.json',
  '/config.json',
  '/config.old',
  '/config',
  '/xmlrpc.php',
  '/phpinfo.php',
  '/shell.php',
  '/cmd.php',
  '/c99.php',
  '/admin.php',
  '/backup.sql',
  '/dump.sql',
  '/database.sql',
]);

const PREFIX_SUSPICIOUS_PATHS = ['/.git/'];
const ENV_PATH_REGEX = /(^|\/)\.env(?:[._~].*)?$/i;

const normalizePath = (requestPath = '') => {
  const path = String(requestPath || '').split('?')[0].split('#')[0];
  return path || '/';
};

const isSuspiciousPath = (requestPath) => {
  const path = normalizePath(requestPath);

  if (ENV_PATH_REGEX.test(path)) return true;
  if (EXACT_SUSPICIOUS_PATHS.has(path)) return true;
  if (PREFIX_SUSPICIOUS_PATHS.some((prefix) => path.startsWith(prefix))) return true;

  return false;
};

const suspiciousPathMiddleware = async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();

  const requestPath = req.path || String(req.originalUrl || '').split('?')[0] || '';
  if (!isSuspiciousPath(requestPath)) return next();

  try {
    await ipAccessService.addRule(req.ip, 'blacklist', 'Auto-blocked: scanner probe');
  } catch {
    // Intentionally swallow DB errors and still deny suspicious requests.
  }

  return res.status(403).json({ success: false, message: 'Access denied.' });
};

module.exports = {
  isSuspiciousPath,
  suspiciousPathMiddleware,
};
