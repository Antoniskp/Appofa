const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth');

/**
 * @route GET /api/stats/community
 * @desc Get community statistics (public)
 */
router.get('/community', statsController.getCommunityStats);

/**
 * @route GET /api/user/home-location
 * @desc Get authenticated user's home location
 */
router.get('/user/home-location', authenticate, statsController.getUserHomeLocation);

module.exports = router;
