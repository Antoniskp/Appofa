const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

router.get('/', optionalAuthMiddleware, apiLimiter, organizationController.getOrganizations);
// Specific routes must be defined before parameterized routes to prevent path matching conflicts.
router.get('/claims', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), organizationController.getPendingClaims);
router.post('/claims/:claimId/approve', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, organizationController.approveClaim);
router.post('/claims/:claimId/reject', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, organizationController.rejectClaim);
router.get('/:id/members/pending', apiLimiter, authMiddleware, organizationController.getPendingMembers);
router.get('/:id/members', optionalAuthMiddleware, apiLimiter, organizationController.getMembers);
router.get('/:id/polls', optionalAuthMiddleware, apiLimiter, organizationController.getOrgPolls);
router.post('/:id/polls', apiLimiter, authMiddleware, csrfProtection, organizationController.createOrgPoll);
router.get('/:id/suggestions', optionalAuthMiddleware, apiLimiter, organizationController.getOrgSuggestions);
router.post('/:id/suggestions', apiLimiter, authMiddleware, csrfProtection, organizationController.createOrgSuggestion);
router.get('/:id/official-posts', optionalAuthMiddleware, apiLimiter, organizationController.getOfficialPosts);
router.post('/:id/official-posts', apiLimiter, authMiddleware, csrfProtection, organizationController.createOfficialPost);
router.get('/:id/verification', optionalAuthMiddleware, apiLimiter, organizationController.getOrgVerificationStatus);
router.patch('/:id/verify', apiLimiter, authMiddleware, csrfProtection, organizationController.setVerified);
router.get('/:id/children', optionalAuthMiddleware, apiLimiter, organizationController.getChildren);
router.patch('/:id/parent', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, organizationController.setParent);
router.get('/:id/analytics', apiLimiter, authMiddleware, organizationController.getAnalytics);
router.get('/:id/roles', optionalAuthMiddleware, apiLimiter, organizationController.getRoles);
router.post('/:id/roles', apiLimiter, authMiddleware, csrfProtection, organizationController.createRole);
router.put('/:id/roles/:roleId', apiLimiter, authMiddleware, csrfProtection, organizationController.updateRole);
router.delete('/:id/roles/:roleId', apiLimiter, authMiddleware, csrfProtection, organizationController.deleteRole);
router.get('/:slug', optionalAuthMiddleware, apiLimiter, organizationController.getOrganizationBySlug);

router.post('/', apiLimiter, createLimiter, authMiddleware, csrfProtection, organizationController.createOrganization);
router.post('/:id/claim', apiLimiter, authMiddleware, csrfProtection, organizationController.submitClaim);
router.post('/:id/join', apiLimiter, authMiddleware, csrfProtection, organizationController.joinOrganization);
router.delete('/:id/leave', apiLimiter, authMiddleware, csrfProtection, organizationController.leaveOrganization);
router.post('/:id/members/invite', apiLimiter, authMiddleware, csrfProtection, organizationController.inviteMember);
router.patch('/:id/members/:userId/approve', apiLimiter, authMiddleware, csrfProtection, organizationController.approvePendingMember);
router.delete('/:id/members/:userId', apiLimiter, authMiddleware, csrfProtection, organizationController.removeMember);
router.patch('/:id/members/:userId/role', apiLimiter, authMiddleware, csrfProtection, organizationController.updateMemberRole);
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, organizationController.updateOrganization);
router.delete('/:id', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, organizationController.deleteOrganization);

module.exports = router;
