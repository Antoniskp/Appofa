'use strict';

const router = require('express').Router();
const { createHash } = require('node:crypto');
const { Op, UniqueConstraintError } = require('sequelize');
const { FoundingInterest, FoundingSignature, FoundingSigningDocument, User, sequelize } = require('../models');
const auth = require('../middleware/auth');
const csrf = require('../middleware/csrfProtection');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');

const statuses = ['requested', 'contacted', 'received'];
const signingPreferences = ['in_person', 'remote'];
const admin = checkRole('admin');
const signatureGoal = 200;
const finalDocumentFields = ['version', 'pdfUrl', 'sha256'];

const clean = value => typeof value === 'string' ? value.trim() : '';
const validPhone = phone => /^\+?[\d ().-]{7,32}$/.test(phone) && /^\d{7,15}$/.test(phone.replace(/\D/g, ''));
const fingerprint = code => createHash('sha256').update(code).digest('hex');

function serializeInterest(interest) {
  if (!interest) return null;
  const { wantsToSign, wantsToVolunteer, signingPreference, signingStatus, contactPhone } = interest;
  return {
    wantsToSign,
    wantsToVolunteer,
    signingPreference: wantsToSign ? signingPreference : null,
    signingStatus: wantsToSign ? signingStatus : null,
    ...(wantsToSign && contactPhone ? { contactPhone } : {}),
  };
}

router.use(apiLimiter, (req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});

router.get('/progress', async (req, res) => {
  const [verifiedCount, document, firstSigners] = await Promise.all([
    FoundingSignature.count(),
    FoundingSigningDocument.findByPk(1, { attributes: [...finalDocumentFields, 'govGrEnabled'] }),
    req.query.recognition === 'true'
      ? FoundingSignature.findAll({ attributes: ['userId', 'publicName'], order: [['id', 'ASC']], limit: signatureGoal })
      : null,
  ]);
  res.set('X-Robots-Tag', 'noindex');
  res.json({ success: true, data: {
    goal: signatureGoal, verifiedCount,
    document: document && Object.fromEntries(finalDocumentFields.map(field => [field, document[field]])),
    ...(document?.govGrEnabled && { govGrEnabled: true }),
    ...(firstSigners && {
      names: firstSigners.filter(signer => signer.userId && signer.publicName).map(signer => signer.publicName),
    }),
  } });
});

router.get('/digital-signature', auth, async (req, res) => {
  const [interest, verified] = await Promise.all([
    FoundingInterest.findByPk(req.user.id, { attributes: ['govVerificationCode'] }),
    FoundingSignature.findOne({ where: { userId: req.user.id }, attributes: ['id'] }),
  ]);
  res.json({ success: true, data: { received: Boolean(interest?.govVerificationCode), verified: Boolean(verified) } });
});

router.post('/digital-signature', auth, csrf, async (req, res) => {
  const code = clean(req.body?.code);
  if (!/^[A-Za-z0-9_-]{12,64}$/.test(code) || req.body?.consent !== true) {
    return res.status(400).json({ success: false, message: 'A verification code and explicit permission are required.' });
  }
  try {
    const received = await sequelize.transaction(async transaction => {
      const document = await FoundingSigningDocument.findByPk(1, { transaction, lock: transaction.LOCK.UPDATE });
      if (!document?.govGrEnabled || document.sha256 !== req.body?.documentSha256) return false;
      const alreadyVerified = await FoundingSignature.findOne({
        where: { [Op.or]: [{ userId: req.user.id }, { govDocumentFingerprint: fingerprint(code) }] },
        attributes: ['id'], transaction,
      });
      if (alreadyVerified) return false;
      const values = { userId: req.user.id, wantsToSign: true, signingPreference: 'remote', signingStatus: 'received', govVerificationCode: code };
      await FoundingInterest.upsert({ ...values, wantsToVolunteer: false }, {
        fields: Object.keys(values), conflictFields: ['userId'], transaction,
      });
      return true;
    });
    if (!received) return res.status(409).json({ success: false, message: 'Digital signing is unavailable or this document was already verified.' });
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    return res.status(409).json({ success: false, message: 'This verification code was already submitted.' });
  }
  res.status(201).json({ success: true, data: { received: true, verified: false } });
});

router.get('/recognition', auth, async (req, res) => {
  const signature = await FoundingSignature.findOne({ where: { userId: req.user.id } });
  const eligible = Boolean(signature && await FoundingSignature.count({ where: { id: { [Op.lt]: signature.id } } }) < signatureGoal);
  res.json({ success: true, data: { eligible, publicName: signature?.publicName || null } });
});

router.put('/recognition', auth, csrf, async (req, res) => {
  const publicName = clean(req.body?.publicName);
  if (req.body?.consent !== true || !publicName || publicName.length > 100) {
    return res.status(400).json({ success: false, message: 'A display name and explicit permission are required.' });
  }
  const signature = await FoundingSignature.findOne({ where: { userId: req.user.id } });
  if (!signature || await FoundingSignature.count({ where: { id: { [Op.lt]: signature.id } } }) >= signatureGoal) {
    return res.status(403).json({ success: false, message: 'Recognition is available to the first 200 verified signers.' });
  }
  await signature.update({ publicName });
  res.json({ success: true, data: { eligible: true, publicName } });
});

router.delete('/recognition', auth, csrf, async (req, res) => {
  await FoundingSignature.update({ publicName: null }, { where: { userId: req.user.id } });
  res.json({ success: true });
});

router.get('/interest', auth, async (req, res) => {
  const interest = await FoundingInterest.findByPk(req.user.id);
  res.json({ success: true, data: serializeInterest(interest) });
});

router.put('/interest', auth, csrf, async (req, res) => {
  const { wantsToSign, wantsToVolunteer, signingPreference, contactPhone, consent } = req.body || {};
  if (typeof wantsToSign !== 'boolean' || typeof wantsToVolunteer !== 'boolean' || (!wantsToSign && !wantsToVolunteer) || consent !== true) {
    return res.status(400).json({ success: false, message: 'Select how you want to help and explicitly consent to being contacted.' });
  }

  if (wantsToSign && signingPreference != null && !signingPreferences.includes(signingPreference)) {
    return res.status(400).json({ success: false, message: 'Invalid signing preference.' });
  }
  const phone = clean(contactPhone);
  if (wantsToSign && contactPhone != null && (typeof contactPhone !== 'string' || (phone && !validPhone(phone)))) {
    return res.status(400).json({ success: false, message: 'Enter a valid contact phone number.' });
  }

  const preferences = { userId: req.user.id, wantsToSign, wantsToVolunteer };
  if (!wantsToSign) Object.assign(preferences, { signingStatus: 'requested', signingPreference: null, contactPhone: null, govVerificationCode: null });
  else {
    if (signingPreference !== undefined) preferences.signingPreference = signingPreference;
    if (contactPhone !== undefined) preferences.contactPhone = phone || null;
  }
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
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  const limit = 25;
  if (filter === 'verified') {
    const { rows, count } = await FoundingSignature.findAndCountAll({
      limit, offset: (page - 1) * limit,
      attributes: ['id', 'legalName', 'recordReference', 'createdAt', 'verifiedByUserId'],
      order: [['id', 'ASC']],
    });
    return res.json({ success: true, data: rows, pagination: { total: count, totalPages: Math.ceil(count / limit) } });
  }
  const where = {};
  if (filter === 'volunteer') where.wantsToVolunteer = true;
  else if (statuses.includes(filter)) Object.assign(where, { wantsToSign: true, signingStatus: filter });
  else if (filter !== 'all') return res.status(400).json({ success: false, message: 'Invalid interest filter.' });

  const { rows, count } = await FoundingInterest.findAndCountAll({
    where, limit, offset: (page - 1) * limit,
    include: [{ model: User, as: 'participant', attributes: ['username', 'email'], required: true }],
    order: [['createdAt', 'DESC'], ['userId', 'DESC']],
  });
  return res.json({
    success: true,
    data: rows.map(row => ({
      userId: row.userId, participant: row.participant.get({ plain: true }), ...serializeInterest(row),
      ...(row.govVerificationCode && { govVerificationCode: row.govVerificationCode }),
    })),
    pagination: { total: count, totalPages: Math.ceil(count / limit) },
  });
});

router.patch('/organizers/:id', auth, admin, csrf, async (req, res) => {
  const userId = Number(req.params.id);
  const { signingStatus } = req.body || {};
  if (!Number.isSafeInteger(userId) || userId < 1 || !statuses.includes(signingStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid signing request or status.' });
  }
  const updates = signingStatus === 'received' ? { signingStatus } : { signingStatus, govVerificationCode: null };
  const [updated] = await FoundingInterest.update(updates, {
    where: { userId, wantsToSign: true, signingStatus: { [Op.ne]: 'verified' } },
  });
  if (!updated) return res.status(404).json({ success: false, message: 'This signing request is no longer active.' });
  return res.json({ success: true });
});

router.post('/organizers/document', auth, admin, csrf, async (req, res) => {
  const version = clean(req.body?.version);
  const pdfUrl = clean(req.body?.pdfUrl);
  const sha256 = clean(req.body?.sha256).toLowerCase();
  let url;
  try { url = new URL(pdfUrl); } catch { /* Invalid PDF URL */ }
  if (!version || version.length > 100 || pdfUrl.length > 500 || url?.protocol !== 'https:'
    || url.username || url.password || !/^[a-f0-9]{64}$/.test(sha256) || req.body?.confirmFinal !== true) {
    return res.status(400).json({ success: false, message: 'Confirm the final document version, HTTPS PDF link and SHA-256 checksum.' });
  }
  try {
    await FoundingSigningDocument.create({ id: 1, version, pdfUrl, sha256 });
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    return res.status(409).json({ success: false, message: 'The final document is already locked.' });
  }
  res.status(201).json({ success: true });
});

router.patch('/organizers/document/gov-gr', auth, admin, csrf, async (req, res) => {
  const enabled = req.body?.enabled;
  if (typeof enabled !== 'boolean') return res.status(400).json({ success: false, message: 'Choose whether digital signing is open.' });
  const [updated] = await FoundingSigningDocument.update({ govGrEnabled: enabled }, { where: { id: 1 } });
  if (!updated) return res.status(409).json({ success: false, message: 'Lock the approved document before enabling digital signing.' });
  res.json({ success: true });
});

router.post('/organizers/:id/verify', auth, admin, csrf, async (req, res) => {
  const userId = Number(req.params.id);
  const legalName = clean(req.body?.legalName);
  const recordReference = clean(req.body?.recordReference).toUpperCase();
  if (!Number.isSafeInteger(userId) || userId < 1 || !legalName || legalName.length > 160
    || !/^[A-Z0-9][A-Z0-9_.-]{1,79}$/.test(recordReference) || req.body?.confirmSignature !== true) {
    return res.status(400).json({ success: false, message: 'The signer name, archive reference and verification are required.' });
  }
  try {
    const verified = await sequelize.transaction(async transaction => {
      const document = await FoundingSigningDocument.findByPk(1, { transaction, lock: transaction.LOCK.UPDATE });
      if (!document) return false;
      const govVerificationCode = clean(req.body?.govVerificationCode) || null;
      const [updated] = await FoundingInterest.update({ signingStatus: 'verified', govVerificationCode: null }, {
        where: { userId, wantsToSign: true, signingStatus: 'received', govVerificationCode }, transaction,
      });
      if (!updated) return false;
      await FoundingSignature.create({
        userId, legalName, recordReference, verifiedByUserId: req.user.id,
        govDocumentFingerprint: govVerificationCode ? fingerprint(govVerificationCode) : null,
      }, { transaction });
      return true;
    });
    if (!verified) return res.status(409).json({ success: false, message: 'Check the final document and the latest receipt before verifying.' });
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    return res.status(409).json({ success: false, message: 'This signer or archive reference is already in the register.' });
  }
  res.status(201).json({ success: true });
});

router.delete('/organizers/signatures/:id', auth, admin, csrf, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'Invalid record.' });
  const removed = await sequelize.transaction(async transaction => {
    await FoundingSigningDocument.findByPk(1, { transaction, lock: transaction.LOCK.UPDATE });
    const signature = await FoundingSignature.findByPk(id, { transaction });
    if (!signature) return false;
    if (signature.userId) {
      await FoundingInterest.update({ signingStatus: 'received' }, {
        where: { userId: signature.userId, signingStatus: 'verified' }, transaction,
      });
    }
    await signature.destroy({ transaction });
    return true;
  });
  if (!removed) return res.status(404).json({ success: false, message: 'Signature record not found.' });
  res.json({ success: true });
});

module.exports = router;
