const express = require('express');
const router = express.Router();
const personRemovalRequestController = require('../controllers/personRemovalRequestController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Public: submit removal request
router.post('/', createLimiter, optionalAuthMiddleware, csrfProtection, personRemovalRequestController.submitRemovalRequest);

// Admin/Moderator: list requests
router.get('/', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), personRemovalRequestController.getRemovalRequests);

// Admin/Moderator: get by id
router.get('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), personRemovalRequestController.getRemovalRequestById);

// Admin/Moderator: review (approve/reject)
router.post('/:id/review', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personRemovalRequestController.reviewRemovalRequest);

module.exports = router;
