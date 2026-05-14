const express = require('express');
const router = express.Router();
const dreamTeamController = require('../controllers/dreamTeamController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const { apiLimiter } = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrfProtection');

router.get('/countries', apiLimiter, dreamTeamController.getCountries);
router.get('/current-holders', apiLimiter, dreamTeamController.getCurrentHolders);
router.get('/positions', optionalAuthMiddleware, apiLimiter, dreamTeamController.getPositionsWithData);
router.post('/vote', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.vote);
router.delete('/vote/:positionId', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.deleteVote);
router.get('/results', optionalAuthMiddleware, apiLimiter, dreamTeamController.getResults);
router.get('/my-votes', apiLimiter, authMiddleware, dreamTeamController.getMyVotes);

// ── Formations ──────────────────────────────────────────────────────────────
// NOTE: specific routes must come before /:id to avoid param conflicts
router.get('/formations/public', optionalAuthMiddleware, apiLimiter, dreamTeamController.getPublicFormations);
router.get('/formations/popular-picks', optionalAuthMiddleware, apiLimiter, dreamTeamController.getPopularPicks);
router.get('/formations/formation-of-the-week', optionalAuthMiddleware, apiLimiter, dreamTeamController.getFormationOfTheWeek);
router.get('/formations/leaderboard', optionalAuthMiddleware, apiLimiter, dreamTeamController.getLeaderboard);
router.get('/formations/my-stats', apiLimiter, authMiddleware, dreamTeamController.getMyStats);
router.get('/formations/activity', optionalAuthMiddleware, apiLimiter, dreamTeamController.getActivityFeed);
router.get('/formations/share/:slug', optionalAuthMiddleware, apiLimiter, dreamTeamController.getSharedFormation);
router.get('/formations', apiLimiter, authMiddleware, dreamTeamController.getMyFormations);
router.post('/formations', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.createFormation);
router.get('/formations/:id', optionalAuthMiddleware, apiLimiter, dreamTeamController.getFormation);
router.put('/formations/:id', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.updateFormation);
router.delete('/formations/:id', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.deleteFormation);
router.post('/formations/:id/picks', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.updateFormationPicks);
router.post('/formations/:id/like', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.likeFormation);

module.exports = router;
