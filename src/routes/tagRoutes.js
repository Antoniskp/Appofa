const express = require('express');
const router = express.Router();
const { getSuggestions, getTopics, getTopicBySlug } = require('../controllers/tagController');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public – no auth required
router.get('/suggestions', apiLimiter, getSuggestions);
router.get('/topics', apiLimiter, getTopics);
router.get('/topics/:slug', apiLimiter, getTopicBySlug);

module.exports = router;
