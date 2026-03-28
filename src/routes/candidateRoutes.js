const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');

// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/', apiLimiter, candidateController.getCandidates);

// ─── Authenticated — specific routes BEFORE parameterized routes ─────────────

// Any logged-in user
router.post('/apply', apiLimiter, authMiddleware, candidateController.submitApplication);
router.get('/my-application', apiLimiter, authMiddleware, candidateController.getMyApplication);

// Candidate / admin / moderator dashboard
router.get('/dashboard', apiLimiter, authMiddleware, checkRole('candidate', 'admin', 'moderator'), candidateController.getDashboard);

// Moderator/Admin: list applications
router.get('/applications', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.getPendingApplications);

// Moderator/Admin: approve/reject application (before /:id)
router.post('/applications/:id/approve', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.approveApplication);
router.post('/applications/:id/reject', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.rejectApplication);

// Moderator/Admin: get single application (before /:slug)
router.get('/applications/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.getApplicationById);

// Moderator/Admin: list pending claims
router.get('/claims', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.getPendingClaims);

// Moderator/Admin: approve/reject claim
router.post('/claims/:id/approve', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.approveClaim);
router.post('/claims/:id/reject', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.rejectClaim);

// Moderator/Admin: create profile
router.post('/', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.createProfile);

// Admin: delete profile
router.delete('/:id', apiLimiter, authMiddleware, checkRole('admin'), candidateController.deleteProfile);

// Any logged-in user: claim a profile
router.post('/:id/claim', apiLimiter, authMiddleware, candidateController.submitClaim);

// Moderator/Admin: appoint profile as active candidate
router.post('/:id/appoint', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.appointAsCandidate);

// Moderator/Admin: retire active candidate
router.post('/:id/retire', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.retireCandidate);

// Authenticated: update own profile (service enforces ownership)
router.put('/:id', apiLimiter, authMiddleware, candidateController.updateProfile);

// Admin: get profile by numeric id (must be before /:slug catch-all)
router.get('/profile/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), candidateController.getProfileById);

// Public: get candidate by slug (last, catches all unmatched GET /:param)
router.get('/:slug', apiLimiter, optionalAuthMiddleware, candidateController.getCandidateBySlug);

module.exports = router;
