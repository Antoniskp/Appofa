const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const locationSectionController = require('../controllers/locationSectionController');
const locationRoleController = require('../controllers/locationRoleController');
const locationElectionController = require('../controllers/locationElectionController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrfProtection');

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

// Location sections routes
// Public: list published sections (optionalAuth so moderators can also see drafts)
router.get('/:locationId/sections', apiLimiter, optionalAuthMiddleware, locationSectionController.getSections);
// Moderator/Admin: create, update, delete, reorder
router.post('/:locationId/sections', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationSectionController.createSection);
router.put('/:locationId/sections/reorder', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationSectionController.reorderSections);
router.put('/:locationId/sections/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationSectionController.updateSection);
router.delete('/:locationId/sections/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationSectionController.deleteSection);

// Location roles routes
router.get('/:locationId/roles', apiLimiter, optionalAuthMiddleware, locationRoleController.getRoles);
router.put('/:locationId/roles', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), csrfProtection, locationRoleController.upsertRoles);
router.get('/:locationId/elections', apiLimiter, optionalAuthMiddleware, locationElectionController.getElections);
router.post('/:locationId/elections/:roleKey/vote', apiLimiter, authMiddleware, csrfProtection, locationElectionController.castVote);
router.delete('/:locationId/elections/:roleKey/vote', apiLimiter, authMiddleware, csrfProtection, locationElectionController.removeVote);

// Admin/Moderator only routes
router.post('/', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationController.createLocation);
router.put('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationController.updateLocation);
router.delete('/:id', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), locationController.deleteLocation);

module.exports = router;
