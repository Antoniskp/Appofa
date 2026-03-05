const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Public routes
router.get('/', locationController.getLocations);

// Country request routes (must be before /:id to avoid 'requests' being treated as an ID)
router.post('/requests', apiLimiter, authMiddleware, locationController.createLocationRequest);
router.get('/requests', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationController.getLocationRequests);
router.put('/requests/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationController.updateLocationRequest);

// Protected routes - require authentication
router.post('/link', apiLimiter, authMiddleware, locationController.linkLocation);
router.post('/unlink', apiLimiter, authMiddleware, locationController.unlinkLocation);

router.get('/:id', locationController.getLocation);
router.get('/:id/entities', apiLimiter, optionalAuthMiddleware, locationController.getLocationEntities);
router.get('/:entity_type/:entity_id/locations', locationController.getEntityLocations);

// Admin/Moderator only routes
router.post('/', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationController.createLocation);
router.put('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationController.updateLocation);
router.delete('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationController.deleteLocation);

module.exports = router;
