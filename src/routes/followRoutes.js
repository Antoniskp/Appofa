const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');

// All follow endpoints require authentication
router.post('/:id/follow', apiLimiter, authMiddleware, csrfProtection, followController.follow);
router.delete('/:id/follow', apiLimiter, authMiddleware, csrfProtection, followController.unfollow);
router.get('/:id/follow/status', apiLimiter, authMiddleware, followController.getStatus);
router.get('/:id/follow/counts', apiLimiter, authMiddleware, followController.getCounts);
router.get('/:id/followers', apiLimiter, authMiddleware, followController.getFollowers);
router.get('/:id/following', apiLimiter, authMiddleware, followController.getFollowing);

module.exports = router;
