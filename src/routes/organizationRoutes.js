const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

router.get('/', apiLimiter, optionalAuthMiddleware, organizationController.getOrganizations);
// Specific routes must be defined before parameterized routes to prevent path matching conflicts.
router.get('/:id/members/pending', apiLimiter, authMiddleware, organizationController.getPendingMembers);
router.get('/:id/members', apiLimiter, optionalAuthMiddleware, organizationController.getMembers);
router.get('/:id/polls', apiLimiter, optionalAuthMiddleware, organizationController.getOrgPolls);
router.post('/:id/polls', apiLimiter, authMiddleware, csrfProtection, organizationController.createOrgPoll);
router.get('/:id/suggestions', apiLimiter, optionalAuthMiddleware, organizationController.getOrgSuggestions);
router.post('/:id/suggestions', apiLimiter, authMiddleware, csrfProtection, organizationController.createOrgSuggestion);
router.get('/:slug', apiLimiter, optionalAuthMiddleware, organizationController.getOrganizationBySlug);

router.post('/', apiLimiter, createLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, organizationController.createOrganization);
router.post('/:id/join', apiLimiter, authMiddleware, csrfProtection, organizationController.joinOrganization);
router.delete('/:id/leave', apiLimiter, authMiddleware, csrfProtection, organizationController.leaveOrganization);
router.post('/:id/members/invite', apiLimiter, authMiddleware, csrfProtection, organizationController.inviteMember);
router.patch('/:id/members/:userId/approve', apiLimiter, authMiddleware, csrfProtection, organizationController.approvePendingMember);
router.delete('/:id/members/:userId', apiLimiter, authMiddleware, csrfProtection, organizationController.removeMember);
router.patch('/:id/members/:userId/role', apiLimiter, authMiddleware, csrfProtection, organizationController.updateMemberRole);
router.put('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, organizationController.updateOrganization);
router.delete('/:id', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, organizationController.deleteOrganization);

module.exports = router;
