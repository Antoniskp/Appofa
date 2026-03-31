const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');

// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/', apiLimiter, personController.getCandidates);

// ─── Authenticated — specific routes BEFORE parameterized routes ─────────────

// Any logged-in user
router.post('/apply', apiLimiter, authMiddleware, csrfProtection, personController.submitApplication);
router.get('/my-application', apiLimiter, authMiddleware, personController.getMyApplication);

// Candidate / admin / moderator dashboard
router.get('/dashboard', apiLimiter, authMiddleware, checkRole('candidate', 'admin', 'moderator'), personController.getDashboard);

// Moderator/Admin: list applications
router.get('/applications', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), personController.getPendingApplications);

// Moderator/Admin: approve/reject application (before /:id)
router.post('/applications/:id/approve', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.approveApplication);
router.post('/applications/:id/reject', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.rejectApplication);

// Moderator/Admin: get single application (before /:slug)
router.get('/applications/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), personController.getApplicationById);

// Moderator/Admin: list pending claims
router.get('/claims', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), personController.getPendingClaims);

// Moderator/Admin: approve/reject claim
router.post('/claims/:id/approve', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.approveClaim);
router.post('/claims/:id/reject', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.rejectClaim);

// Moderator/Admin: create profile
router.post('/', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.createProfile);

// Admin/Moderator: delete profile
router.delete('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.deleteProfile);

// Any logged-in user: claim a profile
router.post('/:id/claim', apiLimiter, authMiddleware, csrfProtection, personController.submitClaim);

// Moderator/Admin: appoint profile as active candidate
router.post('/:id/appoint', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.appointAsCandidate);

// Moderator/Admin: retire active candidate
router.post('/:id/retire', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.retireCandidate);

// Authenticated: update own profile (service enforces ownership)
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, personController.updateProfile);

// Admin: get profile by numeric id (must be before /:slug catch-all)
router.get('/profile/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), personController.getProfileById);

// Public: get candidate by slug (last, catches all unmatched GET /:param)
router.get('/:slug', apiLimiter, optionalAuthMiddleware, personController.getCandidateBySlug);

module.exports = router;
