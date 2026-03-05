const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');

// Public routes
router.get('/', locationController.getLocations);

// Country request routes (must be before /:id to avoid 'requests' being treated as an ID)
router.post('/requests', authMiddleware, locationController.createLocationRequest);
router.get('/requests', authMiddleware, checkRole('admin', 'moderator'), locationController.getLocationRequests);
router.put('/requests/:id', authMiddleware, checkRole('admin', 'moderator'), locationController.updateLocationRequest);

// Protected routes - require authentication
router.post('/link', authMiddleware, locationController.linkLocation);
router.post('/unlink', authMiddleware, locationController.unlinkLocation);

router.get('/:id', locationController.getLocation);
router.get('/:id/entities', optionalAuthMiddleware, locationController.getLocationEntities);
router.get('/:entity_type/:entity_id/locations', locationController.getEntityLocations);

// Admin/Moderator only routes
router.post('/', authMiddleware, checkRole('admin', 'moderator'), locationController.createLocation);
router.put('/:id', authMiddleware, checkRole('admin', 'moderator'), locationController.updateLocation);
router.delete('/:id', authMiddleware, checkRole('admin', 'moderator'), locationController.deleteLocation);

module.exports = router;
