const express = require('express');
const router = express.Router();
const manifestController = require('../controllers/manifestController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Public routes
router.get('/', apiLimiter, manifestController.listActive);

// Authenticated routes — my-acceptances MUST come before /:slug to avoid param conflict
router.get('/my-acceptances', apiLimiter, authMiddleware, manifestController.myAcceptances);

// Public supporter routes
router.get('/:slug/supporters', apiLimiter, manifestController.getSupporters);
router.get('/:slug/supporters/random', apiLimiter, manifestController.getRandomSupporters);

// Authenticated accept/withdraw
router.put('/:slug/accept', createLimiter, authMiddleware, csrfProtection, manifestController.accept);
router.delete('/:slug/accept', createLimiter, authMiddleware, csrfProtection, manifestController.withdraw);

// Admin routes
router.post('/', createLimiter, authMiddleware, checkRole('admin'), csrfProtection, manifestController.create);
router.put('/:slug', createLimiter, authMiddleware, checkRole('admin'), csrfProtection, manifestController.update);
router.delete('/:slug', createLimiter, authMiddleware, checkRole('admin'), csrfProtection, manifestController.remove);

module.exports = router;
