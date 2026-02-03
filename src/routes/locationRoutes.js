const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public routes - get locations
router.get('/', apiLimiter, locationController.getAllLocations);
router.get('/:id', apiLimiter, locationController.getLocationById);
router.get('/links/entity', apiLimiter, locationController.getLinkedLocations);

// Protected routes - admin/moderator only for CRUD operations
router.post('/', apiLimiter, authMiddleware, csrfProtection, checkRole('admin', 'moderator'), locationController.createLocation);
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, checkRole('admin', 'moderator'), locationController.updateLocation);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, checkRole('admin', 'moderator'), locationController.deleteLocation);

// Protected routes - linking/unlinking (users can link to their own articles/profiles)
router.post('/link', apiLimiter, authMiddleware, csrfProtection, locationController.linkLocation);
router.post('/unlink', apiLimiter, authMiddleware, csrfProtection, locationController.unlinkLocation);

module.exports = router;
