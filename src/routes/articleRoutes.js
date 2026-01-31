const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Public routes with optional authentication and rate limiting
router.get('/', apiLimiter, optionalAuthMiddleware, articleController.getAllArticles);
router.get('/:id', apiLimiter, optionalAuthMiddleware, articleController.getArticleById);

// Protected routes - require authentication and rate limiting
router.post('/', createLimiter, authMiddleware, articleController.createArticle);

// Update - author can update their own, admin/editor can update all
router.put('/:id', apiLimiter, authMiddleware, articleController.updateArticle);

// Delete - author can delete their own, admin can delete all
router.delete('/:id', apiLimiter, authMiddleware, articleController.deleteArticle);

// Approve news - moderator/admin only
router.post('/:id/approve-news', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), articleController.approveNews);

module.exports = router;
