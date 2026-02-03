const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');

// Public routes - anyone can view locations
router.get('/', apiLimiter, locationController.getAllLocations);
router.get('/:id/children', apiLimiter, locationController.getChildLocations);
router.get('/:id', apiLimiter, locationController.getLocationById);

// Location linking - authenticated users can link their own content
router.post(
  '/links',
  apiLimiter,
  authMiddleware,
  csrfProtection,
  locationController.linkEntity
);

router.delete(
  '/links',
  apiLimiter,
  authMiddleware,
  csrfProtection,
  locationController.unlinkEntity
);

// Protected routes - moderators and admins can manage locations
router.post(
  '/',
  apiLimiter,
  authMiddleware,
  csrfProtection,
  checkRole('admin', 'moderator'),
  locationController.createLocation
);

router.put(
  '/:id',
  apiLimiter,
  authMiddleware,
  csrfProtection,
  checkRole('admin', 'moderator'),
  locationController.updateLocation
);

router.delete(
  '/:id',
  apiLimiter,
  authMiddleware,
  csrfProtection,
  checkRole('admin', 'moderator'),
  locationController.deleteLocation
);

module.exports = router;
