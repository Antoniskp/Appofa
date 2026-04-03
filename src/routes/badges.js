const express = require('express');
const router = express.Router();
const badgeService = require('../services/badgeService');
const { User, UserBadge } = require('../models');
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

// PUT /api/badges/display — set or clear the display badge for the authenticated user
router.put('/display', apiLimiter, authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { badgeSlug, tier } = req.body;

    // Clear display badge selection
    if (badgeSlug === null || badgeSlug === undefined) {
      await User.update({ displayBadgeSlug: null, displayBadgeTier: null }, { where: { id: userId } });
      return res.status(200).json({ success: true, message: 'Display badge cleared.' });
    }

    // Validate inputs
    if (typeof badgeSlug !== 'string' || badgeSlug.trim() === '') {
      return res.status(400).json({ success: false, message: 'Invalid badgeSlug.' });
    }
    if (typeof tier !== 'string' || tier.trim() === '') {
      return res.status(400).json({ success: false, message: 'Invalid tier.' });
    }

    // Verify the user has actually earned this badge
    const earnedBadge = await UserBadge.findOne({
      where: { userId, badgeSlug: badgeSlug.trim(), tier: tier.trim() },
    });
    if (!earnedBadge) {
      return res.status(403).json({ success: false, message: 'Badge not earned.' });
    }

    await User.update(
      { displayBadgeSlug: badgeSlug.trim(), displayBadgeTier: tier.trim() },
      { where: { id: userId } }
    );
    return res.status(200).json({ success: true, message: 'Display badge updated.' });
  } catch (error) {
    console.error('Set display badge error:', error);
    return res.status(500).json({ success: false, message: 'Error setting display badge.' });
  }
});

module.exports = router;
