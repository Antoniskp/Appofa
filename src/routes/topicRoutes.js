const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { apiLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');
const csrfProtection = require('../middleware/csrfProtection');

router.get('/', apiLimiter, optionalAuth, topicController.listTopics);
router.get('/following/me', apiLimiter, authMiddleware, topicController.listFollowedTopics);
router.get('/:slug', apiLimiter, optionalAuth, topicController.getTopic);

router.post('/:slug/follow', apiLimiter, authMiddleware, csrfProtection, topicController.followTopic);
router.delete('/:slug/follow', apiLimiter, authMiddleware, csrfProtection, topicController.unfollowTopic);
router.post('/', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, topicController.createTopic);
router.put('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, topicController.updateTopic);

module.exports = router;
