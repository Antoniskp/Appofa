const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { authLimiter, apiLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Protected routes with rate limiting
router.get('/profile', apiLimiter, authMiddleware, authController.getProfile);
router.put('/profile', apiLimiter, authMiddleware, authController.updateProfile);
router.put('/password', apiLimiter, authMiddleware, authController.updatePassword);
router.get('/users', apiLimiter, authMiddleware, checkRole('admin'), authController.getUsers);
router.get('/users/stats', apiLimiter, authMiddleware, checkRole('admin'), authController.getUserStats);
router.put('/users/:id/role', apiLimiter, authMiddleware, checkRole('admin'), authController.updateUserRole);

module.exports = router;
