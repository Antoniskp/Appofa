'use strict';

const router = require('express').Router();
const { FoundingInterest, User } = require('../models');
const auth = require('../middleware/auth');
const csrf = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');

const statuses = ['requested', 'contacted', 'received'];
const admin = checkRole('admin');

function serializeInterest(interest) {
  if (!interest) return null;
  const { wantsToSign, wantsToVolunteer, signingStatus } = interest;
  return { wantsToSign, wantsToVolunteer, signingStatus: wantsToSign ? signingStatus : null };
}

router.use(apiLimiter, (req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});

router.get('/interest', auth, async (req, res) => {
  const interest = await FoundingInterest.findByPk(req.user.id);
  res.json({ success: true, data: serializeInterest(interest) });
});

router.put('/interest', auth, csrf, async (req, res) => {
  const { wantsToSign, wantsToVolunteer, consent } = req.body || {};
  if (typeof wantsToSign !== 'boolean' || typeof wantsToVolunteer !== 'boolean' || (!wantsToSign && !wantsToVolunteer) || consent !== true) {
    return res.status(400).json({ success: false, message: 'Select how you want to help and explicitly consent to being contacted.' });
  }

  const preferences = { userId: req.user.id, wantsToSign, wantsToVolunteer };
  if (!wantsToSign) preferences.signingStatus = 'requested';
  await FoundingInterest.upsert(preferences, {
    fields: Object.keys(preferences),
    conflictFields: ['userId'],
  });
  const interest = await FoundingInterest.findByPk(req.user.id);
  return res.json({ success: true, data: serializeInterest(interest) });
});

router.delete('/interest', auth, csrf, async (req, res) => {
  await FoundingInterest.destroy({ where: { userId: req.user.id } });
  res.json({ success: true });
});

router.get('/organizers', auth, admin, async (req, res) => {
  const filter = req.query.status || 'all';
  const where = {};
  if (filter === 'volunteer') where.wantsToVolunteer = true;
  else if (statuses.includes(filter)) Object.assign(where, { wantsToSign: true, signingStatus: filter });
  else if (filter !== 'all') return res.status(400).json({ success: false, message: 'Invalid interest filter.' });

  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  const limit = 25;
  const { rows, count } = await FoundingInterest.findAndCountAll({
    where, limit, offset: (page - 1) * limit,
    include: [{ model: User, as: 'participant', attributes: ['username', 'email'], required: true }],
    order: [['createdAt', 'DESC'], ['userId', 'DESC']],
  });
  return res.json({
    success: true,
    data: rows.map(row => ({ userId: row.userId, participant: row.participant.get({ plain: true }), ...serializeInterest(row) })),
    pagination: { total: count, totalPages: Math.ceil(count / limit) },
  });
});

router.patch('/organizers/:id', auth, admin, csrf, async (req, res) => {
  const userId = Number(req.params.id);
  const { signingStatus } = req.body || {};
  if (!Number.isSafeInteger(userId) || userId < 1 || !statuses.includes(signingStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid signing request or status.' });
  }
  const [updated] = await FoundingInterest.update({ signingStatus }, { where: { userId, wantsToSign: true } });
  if (!updated) return res.status(404).json({ success: false, message: 'This signing request is no longer active.' });
  return res.json({ success: true });
});

module.exports = router;
