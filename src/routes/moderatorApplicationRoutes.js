const express = require('express');
const router = express.Router();
const moderatorApplicationController = require('../controllers/moderatorApplicationController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Submit a new moderator application (authenticated users only)
router.post('/', createLimiter, authMiddleware, csrfProtection, moderatorApplicationController.createApplication);

// Submit a contact message (optional authentication)
router.post('/contact', createLimiter, optionalAuthMiddleware, csrfProtection, moderatorApplicationController.createContactMessage);

// Get all applications (admin only)
router.get('/', apiLimiter, authMiddleware, checkRole('admin'), moderatorApplicationController.getAllApplications);

// Update application status (admin only)
router.put('/:id/status', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), moderatorApplicationController.updateApplicationStatus);

module.exports = router;
