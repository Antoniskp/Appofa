const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// OAuth routes
router.get('/oauth/config', apiLimiter, authController.getOAuthConfig);
router.get('/github', apiLimiter, authController.initiateGithubOAuth);
router.get('/github/callback', apiLimiter, authController.githubCallback);

// Protected routes with rate limiting
router.get('/profile', apiLimiter, authMiddleware, authController.getProfile);
router.put('/profile', apiLimiter, authMiddleware, csrfProtection, authController.updateProfile);
router.put('/password', apiLimiter, authMiddleware, csrfProtection, authController.updatePassword);
router.delete('/github/unlink', apiLimiter, authMiddleware, csrfProtection, authController.unlinkGithub);
router.post('/logout', apiLimiter, authMiddleware, csrfProtection, authController.logout);
router.get('/users', apiLimiter, authMiddleware, checkRole('admin'), authController.getUsers);
router.get('/users/stats', apiLimiter, authMiddleware, checkRole('admin'), authController.getUserStats);
router.put('/users/:id/role', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), authController.updateUserRole);

module.exports = router;
