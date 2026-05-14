const { validateWorkerToken, isValidWorkerTokenFormat } = require('../services/workerTokenService');

const workerAuthMiddleware = async (req, res, next) => {
  try {
    const rawHeader = req.headers['x-worker-token'];
    const token = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!token || typeof token !== 'string') {
      return res.status(401).json({ success: false, message: 'Worker authentication token is required.' });
    }

    if (!isValidWorkerTokenFormat(token)) {
      return res.status(401).json({ success: false, message: 'Invalid worker token format.' });
    }

    const dbResult = await validateWorkerToken(token);
    if (dbResult.valid) {
      req.workerAuth = {
        source: dbResult.source,
        tokenId: dbResult.tokenId,
      };
      return next();
    }

    const envToken = (process.env.WORKER_TOKEN || '').trim();
    if (envToken && token === envToken) {
      req.workerAuth = { source: 'env' };
      return next();
    }

    return res.status(401).json({ success: false, message: 'Invalid worker authentication token.' });
  } catch {
    return res.status(500).json({ success: false, message: 'Worker authentication failed.' });
  }
};

module.exports = workerAuthMiddleware;
