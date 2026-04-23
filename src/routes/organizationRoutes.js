const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

router.get('/', apiLimiter, optionalAuthMiddleware, organizationController.getOrganizations);
router.get('/:organizationId/members', apiLimiter, optionalAuthMiddleware, organizationController.getMembers);
router.get('/:slug', apiLimiter, optionalAuthMiddleware, organizationController.getOrganizationBySlug);

router.post('/', apiLimiter, createLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, organizationController.createOrganization);
router.put('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, organizationController.updateOrganization);
router.delete('/:id', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, organizationController.deleteOrganization);

module.exports = router;
