const router = require('express').Router();
const controller = require('../controllers/issueFollowController');
const auth = require('../middleware/auth');
const csrf = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');
router.get('/', apiLimiter, auth, controller.list);
router.get('/:entityType/:entityId', apiLimiter, auth, controller.status);
router.put('/:entityType/:entityId', apiLimiter, auth, csrf, controller.set);
module.exports = router;
