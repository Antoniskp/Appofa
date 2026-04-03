const express = require('express');
const router = express.Router();
const badgeService = require('../services/badgeService');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// GET /api/badges/my — authenticated user's badge progress (full detail with progress %)
router.get('/my', apiLimiter, authMiddleware, async (req, res) => {
  try {
    const progress = await badgeService.getUserBadgeProgress(req.user.id);
    return res.status(200).json({ success: true, data: { badges: progress } });
  } catch (error) {
    console.error('Get badge progress error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching badge progress.' });
  }
});

// GET /api/badges/user/:userId — public badge list for a specific user
router.get('/user/:userId', apiLimiter, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId.' });
    }
    const badges = await badgeService.getUserBadges(userId);
    return res.status(200).json({ success: true, data: { badges } });
  } catch (error) {
    console.error('Get user badges error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching user badges.' });
  }
});

// POST /api/badges/evaluate — manually trigger evaluation for authenticated user
router.post('/evaluate', apiLimiter, authMiddleware, async (req, res) => {
  try {
    const newBadges = await badgeService.evaluate(req.user.id);
    return res.status(200).json({ success: true, data: { newBadges } });
  } catch (error) {
    console.error('Badge evaluation error:', error);
    return res.status(500).json({ success: false, message: 'Error evaluating badges.' });
  }
});

module.exports = router;
