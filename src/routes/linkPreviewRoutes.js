const express = require('express');
const router = express.Router();
const { getLinkPreview } = require('../controllers/linkPreviewController');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const { apiLimiter } = require('../middleware/rateLimiter');

// POST /api/link-preview
// Optional auth; rate-limited.
// Body: { url: string }
router.post('/', apiLimiter, optionalAuthMiddleware, getLinkPreview);

module.exports = router;
