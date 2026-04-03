const express = require('express');
const router = express.Router();
const dreamTeamController = require('../controllers/dreamTeamController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const { apiLimiter } = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrfProtection');

router.get('/positions', apiLimiter, optionalAuthMiddleware, dreamTeamController.getPositionsWithData);
router.post('/vote', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.vote);
router.delete('/vote/:positionId', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.deleteVote);
router.get('/results', apiLimiter, optionalAuthMiddleware, dreamTeamController.getResults);
router.get('/my-votes', apiLimiter, authMiddleware, dreamTeamController.getMyVotes);

// ── Formations ──────────────────────────────────────────────────────────────
// NOTE: specific routes must come before /:id to avoid param conflicts
router.get('/formations/public', apiLimiter, optionalAuthMiddleware, dreamTeamController.getPublicFormations);
router.get('/formations/popular-picks', apiLimiter, optionalAuthMiddleware, dreamTeamController.getPopularPicks);
router.get('/formations/share/:slug', apiLimiter, optionalAuthMiddleware, dreamTeamController.getSharedFormation);
router.get('/formations', apiLimiter, authMiddleware, dreamTeamController.getMyFormations);
router.post('/formations', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.createFormation);
router.get('/formations/:id', apiLimiter, optionalAuthMiddleware, dreamTeamController.getFormation);
router.put('/formations/:id', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.updateFormation);
router.delete('/formations/:id', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.deleteFormation);
router.post('/formations/:id/picks', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.updateFormationPicks);
router.post('/formations/:id/like', apiLimiter, authMiddleware, csrfProtection, dreamTeamController.likeFormation);

module.exports = router;
