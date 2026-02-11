const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/', createLimiter, optionalAuthMiddleware, messageController.createMessage);

// Admin/Moderator routes
router.get('/', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), messageController.getAllMessages);
router.get('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), messageController.getMessage);
router.put('/:id/status', apiLimiter, authMiddleware, csrfProtection, checkRole('admin', 'moderator'), messageController.updateMessageStatus);
router.put('/:id/respond', apiLimiter, authMiddleware, csrfProtection, checkRole('admin', 'moderator'), messageController.respondToMessage);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), messageController.deleteMessage);

module.exports = router;
