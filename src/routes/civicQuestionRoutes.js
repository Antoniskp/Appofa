const express = require('express');
const router = express.Router();

const civicQuestionController = require('../controllers/civicQuestionController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, createLimiter, authVoteLimiter } = require('../middleware/rateLimiter');

router.get('/', optionalAuthMiddleware, apiLimiter, civicQuestionController.listCivicQuestions);
router.get('/:id', optionalAuthMiddleware, apiLimiter, civicQuestionController.getCivicQuestionById);
router.get('/:id/results', optionalAuthMiddleware, apiLimiter, civicQuestionController.getCivicQuestionResults);

router.post('/', createLimiter, authMiddleware, csrfProtection, civicQuestionController.createCivicQuestion);
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, civicQuestionController.updateCivicQuestion);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, civicQuestionController.deleteCivicQuestion);
router.post('/:id/vote', apiLimiter, authMiddleware, csrfProtection, authVoteLimiter, civicQuestionController.voteCivicQuestion);

module.exports = router;
