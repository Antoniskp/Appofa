const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');

router.get('/', apiLimiter, authMiddleware, bookmarkController.list);
router.get('/status', apiLimiter, authMiddleware, bookmarkController.getStatus);
router.post('/toggle', apiLimiter, authMiddleware, csrfProtection, bookmarkController.toggle);

module.exports = router;
