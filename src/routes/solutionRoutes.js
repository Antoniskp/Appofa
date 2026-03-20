const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');

// Vote on a solution (auth required)
router.post('/:id/vote', apiLimiter, authMiddleware, csrfProtection, suggestionController.voteSolution);

module.exports = router;
