const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { avatarUpload } = require('../middleware/upload');

// ─── Public ──────────────────────────────────────────────────────────────────
router.get('/', apiLimiter, personController.getPersons);

// ─── Search endpoints (before /:slug catch-all) ───────────────────────────────
router.get('/search', apiLimiter, personController.searchPersons);
router.get('/unified-search', apiLimiter, personController.unifiedSearch);

// ─── Authenticated — specific routes BEFORE parameterized routes ─────────────

// Moderator/Admin: list pending claims
router.get('/claims', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), personController.getPendingClaims);

// Moderator/Admin: approve/reject claim
router.post('/claims/:id/approve', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.approveClaim);
router.post('/claims/:id/reject', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.rejectClaim);

// Moderator/Admin: create profile
router.post('/', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.createProfile);

// Admin/Moderator: upload photo for a person profile
router.post('/:id/photo', uploadLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, (req, res, next) => {
  avatarUpload.single('photo')(req, res, (err) => {
    if (!err) return next();
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : (err.status || 400);
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 5 MB.' : err.message;
    return res.status(status).json({ success: false, message });
  });
}, personController.uploadPersonPhoto);

// Admin/Moderator: delete profile
router.delete('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, personController.deleteProfile);

// Any logged-in user: claim a profile
router.post('/:id/claim', apiLimiter, authMiddleware, csrfProtection, personController.submitClaim);

// Authenticated: update own profile (service enforces ownership)
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, personController.updateProfile);

// Admin: get profile by numeric id (must be before /:slug catch-all)
router.get('/profile/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), personController.getProfileById);

// Public: get person by slug (last, catches all unmatched GET /:param)
router.get('/:slug', apiLimiter, optionalAuthMiddleware, personController.getPersonBySlug);

module.exports = router;
