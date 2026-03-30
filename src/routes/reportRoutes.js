const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Public: submit report
router.post('/', createLimiter, optionalAuthMiddleware, csrfProtection, reportController.submitReport);

// Admin/Moderator: list reports
router.get('/', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), reportController.getReports);

// Admin/Moderator: reports by content (must be before /:id)
router.get('/content/:contentType/:contentId', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), reportController.getReportsByContent);

// Admin/Moderator: get by id
router.get('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), reportController.getReportById);

// Admin/Moderator: review
router.post('/:id/review', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, reportController.reviewReport);

module.exports = router;
