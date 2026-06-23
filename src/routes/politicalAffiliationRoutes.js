const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/auth');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter } = require('../middleware/rateLimiter');
const politicalAffiliationController = require('../controllers/politicalAffiliationController');

// GET /api/users/:id/political-affiliations  — public
router.get('/', optionalAuthMiddleware, apiLimiter, politicalAffiliationController.getAffiliations);

// POST /api/users/:id/political-affiliations — authenticated owner / admin
router.post('/', apiLimiter, authMiddleware, csrfProtection, politicalAffiliationController.addAffiliation);

// PATCH /api/users/:id/political-affiliations/:organizationId — authenticated owner / admin
router.patch('/:organizationId', apiLimiter, authMiddleware, csrfProtection, politicalAffiliationController.updateAffiliation);

// DELETE /api/users/:id/political-affiliations/:organizationId — authenticated owner / admin
router.delete('/:organizationId', apiLimiter, authMiddleware, csrfProtection, politicalAffiliationController.removeAffiliation);

module.exports = router;
