const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/auth');

/**
 * @route GET /api/stats/community
 * @desc Get community statistics (public)
 */
router.get('/community', statsController.getCommunityStats);

/**
 * @route GET /api/stats/user/home-location
 * @desc Get authenticated user's home location
 */
router.get('/user/home-location', authMiddleware, statsController.getUserHomeLocation);

module.exports = router;
