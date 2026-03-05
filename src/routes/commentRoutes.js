const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// GET /api/comments?entityType=&entityId=
router.get('/', apiLimiter, optionalAuthMiddleware, commentController.getComments);

// POST /api/comments
router.post('/', createLimiter, authMiddleware, csrfProtection, commentController.createComment);

// PATCH /api/comments/:id/hide
router.patch('/:id/hide', apiLimiter, authMiddleware, csrfProtection, commentController.hideComment);

// PATCH /api/comments/:id/unhide
router.patch('/:id/unhide', apiLimiter, authMiddleware, csrfProtection, commentController.unhideComment);

// DELETE /api/comments/:id
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, commentController.deleteComment);

module.exports = router;
