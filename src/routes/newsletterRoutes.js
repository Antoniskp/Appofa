const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/subscribe', createLimiter, newsletterController.subscribe);
router.get('/unsubscribe', apiLimiter, newsletterController.unsubscribe);
router.post('/unsubscribe', createLimiter, newsletterController.unsubscribe);

// Admin / moderator read routes
router.get('/admin/subscribers', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), newsletterController.adminListSubscribers);
router.get('/admin/stats', apiLimiter, authMiddleware, checkRole('admin', 'moderator'), newsletterController.adminStats);

// Admin write routes
router.post('/admin/subscribers', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), newsletterController.adminAddSubscriber);
router.post('/admin/subscribers/bulk', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), newsletterController.adminBulkAddSubscribers);
router.put('/admin/subscribers/:id', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), newsletterController.adminUpdateSubscriber);

// Campaign routes (admin-only)
router.get('/admin/campaigns', apiLimiter, authMiddleware, checkRole('admin'), newsletterController.adminListCampaigns);
router.post('/admin/campaigns', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), newsletterController.adminCreateCampaign);
router.get('/admin/campaigns/:id', apiLimiter, authMiddleware, checkRole('admin'), newsletterController.adminGetCampaign);
router.put('/admin/campaigns/:id', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), newsletterController.adminUpdateCampaign);
router.post('/admin/campaigns/:id/test-send', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), newsletterController.adminSendCampaignTest);
router.post('/admin/campaigns/:id/send', apiLimiter, authMiddleware, csrfProtection, checkRole('admin'), newsletterController.adminSendCampaignNow);
router.get('/admin/campaigns/:id/logs', apiLimiter, authMiddleware, checkRole('admin'), newsletterController.adminCampaignLogs);

module.exports = router;
