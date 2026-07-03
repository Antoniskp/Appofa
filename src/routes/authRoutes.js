const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  uploadLimiter,
  passwordResetRequestLimiter,
  passwordResetAttemptLimiter,
} = require('../middleware/rateLimiter');
const { avatarUpload } = require('../middleware/upload');

// CSRF token refresh - allows authenticated users to get a fresh CSRF token
router.get('/csrf', optionalAuthMiddleware, apiLimiter, authMiddleware, authController.refreshCsrf);

// Public routes with rate limiting
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', passwordResetRequestLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetAttemptLimiter, authController.resetPassword);
router.get('/verify-email', apiLimiter, authController.verifyEmail);
router.post('/resend-verification', apiLimiter, authMiddleware, csrfProtection, authController.resendVerification);

// OAuth routes
router.get('/oauth/config', apiLimiter, authController.getOAuthConfig);
router.get('/github', optionalAuthMiddleware, apiLimiter, authController.initiateGithubOAuth);
router.get('/github/callback', apiLimiter, authController.githubCallback);
router.get('/google', optionalAuthMiddleware, apiLimiter, authController.initiateGoogleOAuth);
router.get('/google/callback', apiLimiter, authController.googleCallback);

// Protected routes with rate limiting
router.get('/profile', apiLimiter, authMiddleware, authController.getProfile);
router.put('/profile', apiLimiter, authMiddleware, csrfProtection, authController.updateProfile);
router.put('/avatar-source', apiLimiter, authMiddleware, csrfProtection, authController.updateAvatarSource);
router.put('/password', apiLimiter, authMiddleware, csrfProtection, authController.updatePassword);
router.delete('/github/unlink', apiLimiter, authMiddleware, csrfProtection, authController.unlinkGithub);
router.delete('/google/unlink', apiLimiter, authMiddleware, csrfProtection, authController.unlinkGoogle);
router.post('/logout', apiLimiter, authMiddleware, csrfProtection, authController.logout);
router.delete('/profile', apiLimiter, authMiddleware, csrfProtection, authController.deleteAccount);
router.get('/users', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), authController.getUsers);
router.get('/users/admin', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), authController.getAdminUsers);
router.get('/users/stats', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), authController.getUserStats);
router.put('/users/:id/role', apiLimiter, authMiddleware, csrfProtection, checkRole('admin', 'moderator'), authController.updateUserRole);
router.put('/users/:id/verify', apiLimiter, authMiddleware, csrfProtection, checkRole('admin', 'moderator'), authController.verifyUser);
router.delete('/users/:id', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), authController.adminDeleteUser);

// Public during signup; authenticated users can also use it while editing their own profile.
router.get('/check-username', optionalAuthMiddleware, apiLimiter, authController.checkUsernameAvailability);

// Public search endpoint (guests see public profiles only; authenticated users see registered+public)
router.get('/users/search', optionalAuthMiddleware, apiLimiter, authController.searchUsers);

// Public profile endpoints with visibility enforcement
router.get('/users/:id/public', optionalAuthMiddleware, apiLimiter, authController.getPublicUserProfile);
router.get('/users/username/:username/public', optionalAuthMiddleware, apiLimiter, authController.getPublicUserProfileByUsername);

// Public stats route
router.get('/users/public-stats', apiLimiter, authController.getPublicUserStats);

// Avatar upload: authenticated user uploads their own avatar (overwrites previous)
router.post('/me/avatar', uploadLimiter, authMiddleware, csrfProtection, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (!err) return next();
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : (err.status || 400);
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 10 MB.' : err.message;
    return res.status(status).json({ success: false, message });
  });
}, authController.uploadAvatar);

module.exports = router;
