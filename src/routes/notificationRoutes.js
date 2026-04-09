const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');

// All notification routes require authentication; rate-limit before auth to prevent DoS
router.use(apiLimiter, authMiddleware);

router.get('/',             ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/read-all',     csrfProtection, ctrl.markAllAsRead);
router.put('/:id/read',     csrfProtection, ctrl.markAsRead);
router.delete('/:id',       csrfProtection, ctrl.deleteNotification);

module.exports = router;
