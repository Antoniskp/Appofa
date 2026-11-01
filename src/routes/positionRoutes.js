const router = require('express').Router();
const service = require('../services/positionService');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const csrf = require('../middleware/csrfProtection');
const { apiLimiter, createLimiter, authVoteLimiter } = require('../middleware/rateLimiter');

const handle = fn => async (req, res) => {
  try {
    const data = await fn(req);
    res.json({ success: true, data });
  } catch (error) {
    const status = error.status || (error.name === 'SequelizeUniqueConstraintError' ? 409 : error.name === 'SequelizeValidationError' ? 400 : 500);
    if (status === 500) console.error('Position API failed:', error);
    res.status(status).json({ success: false, message: status === 500 ? 'Unable to process positions right now.' : status === 409 ? 'This record changed or already exists. Refresh and try again.' : error.message });
  }
};

router.get('/metadata', optionalAuth, apiLimiter, handle(req => service.metadata(req.query.organizationId, req.user)));
router.get('/', optionalAuth, apiLimiter, handle(req => service.list(req.query, req.user)));
router.get('/:id/history', optionalAuth, apiLimiter, handle(req => service.history(req.params.id, req.user)));
router.post('/categories', auth, csrf, createLimiter, handle(req => service.createCategory(req.body, req.user)));
router.post('/organizations/:id', auth, csrf, createLimiter, handle(req => service.create(req.params.id, req.body, req.user)));
router.post('/:id/revisions', auth, csrf, createLimiter, handle(req => service.revise(req.params.id, req.body, req.user)));
router.patch('/:id/status', auth, csrf, apiLimiter, handle(req => service.changeStatus(req.params.id, req.body.status, req.user)));
router.put('/revisions/:id', auth, csrf, apiLimiter, handle(req => service.mutateRevision(req.params.id, req.body, req.user, 'save')));
router.post('/revisions/:id/publish', auth, csrf, apiLimiter, handle(req => service.mutateRevision(req.params.id, req.body, req.user, 'publish')));
router.post('/revisions/:id/reject', auth, csrf, apiLimiter, handle(req => service.mutateRevision(req.params.id, req.body, req.user, 'reject')));
router.put('/revisions/:id/vote', auth, csrf, authVoteLimiter, handle(req => service.vote(req.params.id, req.body.value, req.user)));

module.exports = router;
