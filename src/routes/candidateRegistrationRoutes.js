const express = require('express');
const router = express.Router();
const controller = require('../controllers/candidateRegistrationController');
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');

router.get('/', optionalAuthMiddleware, apiLimiter, controller.listRegistrations);
router.get('/mine', apiLimiter, authMiddleware, controller.listMine);
router.post('/', apiLimiter, authMiddleware, csrfProtection, controller.createRegistration);
router.put('/:id', apiLimiter, authMiddleware, csrfProtection, controller.updateRegistration);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, controller.archiveRegistration);

module.exports = router;
