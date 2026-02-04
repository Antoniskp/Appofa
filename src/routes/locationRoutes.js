const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/checkRole');
const { optionalAuth } = require('../middleware/optionalAuth');

// Public routes
router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocation);
router.get('/:id/entities', locationController.getLocationEntities);
router.get('/:entity_type/:entity_id/locations', locationController.getEntityLocations);

// Protected routes - require authentication
router.post('/link', authenticate, locationController.linkLocation);
router.post('/unlink', authenticate, locationController.unlinkLocation);

// Admin/Moderator only routes
router.post('/', authenticate, checkRole(['admin', 'moderator']), locationController.createLocation);
router.put('/:id', authenticate, checkRole(['admin', 'moderator']), locationController.updateLocation);
router.delete('/:id', authenticate, checkRole(['admin', 'moderator']), locationController.deleteLocation);

module.exports = router;
