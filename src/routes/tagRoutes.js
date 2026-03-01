const express = require('express');
const router = express.Router();
const { getSuggestions } = require('../controllers/tagController');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public – no auth required
router.get('/suggestions', apiLimiter, getSuggestions);

module.exports = router;
