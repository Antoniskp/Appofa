const express = require('express');
const homepageController = require('../controllers/homepageController');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', optionalAuthMiddleware, apiLimiter, homepageController.getHomepagePayload);

module.exports = router;
