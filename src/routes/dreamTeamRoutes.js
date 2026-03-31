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

module.exports = router;
