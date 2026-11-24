const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const optionalAuth = require('../middleware/optionalAuth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');
const { listCreators, submitCreator, reviewCreator } = require('../services/tiktokCreatorService');

const router = express.Router();
const staffOnly = [auth, checkRole('admin', 'moderator')];

router.get('/', optionalAuth, apiLimiter, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  res.json({ success: true, data: await listCreators(req.query, { viewer: req.user }) });
});

router.post('/', apiLimiter, createLimiter, async (req, res) => {
  if (!req.is('application/json') || !req.body || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: 'Submit the listing as JSON.' });
  }
  await submitCreator(req.body);
  res.status(201).json({ success: true });
});

router.get('/review', apiLimiter, staffOnly, async (req, res) => {
  res.json({ success: true, data: await listCreators(req.query, { review: true }) });
});

router.put('/review/:id', apiLimiter, staffOnly, csrfProtection, async (req, res) => {
  await reviewCreator(req.params.id, req.body || {}, req.user.id);
  res.json({ success: true });
});

module.exports = router;
