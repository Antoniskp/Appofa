const express = require('express');
const router = express.Router();
const videoPinController = require('../controllers/videoPinController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');

router.get('/', optionalAuthMiddleware, apiLimiter, videoPinController.getVideoPins);
router.post('/', apiLimiter, authMiddleware, csrfProtection, videoPinController.createVideoPin);
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, videoPinController.updateVideoPin);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, videoPinController.deleteVideoPin);

module.exports = router;
