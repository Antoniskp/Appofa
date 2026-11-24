const express = require('express');
const router = express.Router();

const civicQuestionController = require('../controllers/civicQuestionController');
const consultations = require('../services/parliamentaryConsultationService');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter, authVoteLimiter } = require('../middleware/rateLimiter');

function consultationAction(action, status = 200) {
  return async (req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const id = Number(req.params.id);
      if (req.params.id && (!Number.isSafeInteger(id) || id < 1)) {
        return res.status(400).json({ success: false, message: 'Invalid ID.' });
      }
      const data = await action(req, id);
      return res.status(status).json({ success: true, data });
    } catch (error) {
      if (!error.status) return next(error);
      return res.status(error.status).json({ success: false, message: error.message });
    }
  };
}

router.get('/consultations/publisher', apiLimiter, authMiddleware,
  consultationAction(async req => ({ publisherName: await consultations.getPublisher(req.user.id) })));
router.put('/consultations/publishers/:id', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'),
  consultationAction((req, id) => consultations.setPublisher(id, req.body?.name)));
router.post('/consultations', createLimiter, authMiddleware, csrfProtection,
  consultationAction(req => consultations.publishQuestion(req.user.id, req.body || {}), 201));
router.post('/:id/consultation-decision', apiLimiter, authMiddleware, csrfProtection,
  consultationAction((req, id) => consultations.publishDecision(id, req.user.id, req.body || {}), 201));
router.get('/:id/consultation-evaluation', optionalAuthMiddleware, apiLimiter,
  consultationAction((req, id) => consultations.getEvaluation(id, req.user?.id)));
router.put('/:id/consultation-evaluation', apiLimiter, authMiddleware, csrfProtection, authVoteLimiter,
  consultationAction((req, id) => consultations.evaluate(id, req.user.id, req.body?.choice)));

router.get('/', optionalAuthMiddleware, apiLimiter, civicQuestionController.listCivicQuestions);
router.get('/featured', optionalAuthMiddleware, apiLimiter, civicQuestionController.getFeaturedCivicQuestion);
router.get('/categories', optionalAuthMiddleware, apiLimiter, civicQuestionController.getCivicQuestionCategories);
router.get('/:id', optionalAuthMiddleware, apiLimiter, civicQuestionController.getCivicQuestionById);
router.get('/:id/results', optionalAuthMiddleware, apiLimiter, civicQuestionController.getCivicQuestionResults);

router.post('/', createLimiter, authMiddleware, csrfProtection, civicQuestionController.createCivicQuestion);
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, civicQuestionController.updateCivicQuestion);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, civicQuestionController.deleteCivicQuestion);
router.post('/:id/vote', apiLimiter, authMiddleware, csrfProtection, authVoteLimiter, civicQuestionController.voteCivicQuestion);

module.exports = router;
