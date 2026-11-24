'use strict';

const express = require('express');
const { col, fn, UniqueConstraintError } = require('sequelize');
const { Report, User } = require('../models');
const { LegalLibraryTarget, LegalLibraryVote } = require('../models/LegalLibraryFeedback');
const csrfProtection = require('../middleware/csrfProtection');
const { createLimiter } = require('../middleware/rateLimiter');
const { requestLibrary } = require('../services/legalLibraryService');

const router = express.Router();
const reportCategories = new Set(['harmful_legislation', 'misinformation', 'corruption_risk']);

function readTarget(input) {
  const { documentId, unitId = '' } = input || {};
  const validId = id => typeof id === 'string' && id.length <= 255 && id === id.trim() && !id.includes('\0');
  return validId(documentId) && documentId && validId(unitId) ? { documentId, unitId } : null;
}

function feedbackError(status, message) {
  return Object.assign(new Error(message), { feedbackStatus: status });
}

async function verifyTarget(ids) {
  let data;
  try {
    const search = new URLSearchParams({ id: ids.documentId, scope: 'source' });
    const response = await requestLibrary('/api/laws/document', { search: search.toString() });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 404) return null;
      throw new Error('Library request failed');
    }
    data = await response.json();
  } catch {
    throw feedbackError(503, 'Η Νομική Βιβλιοθήκη δεν είναι διαθέσιμη αυτή τη στιγμή.');
  }
  if (data.document?.canonical_id !== ids.documentId) return null;
  const unit = data.units?.find(item => item.id === ids.unitId);
  if (ids.unitId && !unit) return null;
  const parent = unit?.parent_id && data.units.find(item => item.id === unit.parent_id);
  return [data.document.citation_label || data.document.title || ids.documentId,
    parent?.scope_title || unit?.scope_title, parent?.label, unit?.label].filter(Boolean).join(' · ').slice(0, 500);
}

async function getTarget(ids) {
  const label = await verifyTarget(ids);
  if (!label) throw feedbackError(404, 'Το νομοθέτημα ή η διάταξη δεν βρέθηκε.');
  const target = await LegalLibraryTarget.findOne({ where: ids });
  if (target) return target;
  await LegalLibraryTarget.bulkCreate([{ ...ids, label }], { ignoreDuplicates: true });
  return LegalLibraryTarget.findOne({ where: ids });
}

async function canVote(userId) {
  const user = await User.findByPk(userId, { attributes: ['nationality'] });
  return user?.nationality === 'GR';
}

const pendingWhere = (targetId, userId) => ({
  contentType: 'law', contentId: targetId, status: 'pending', reportedByUserId: userId,
});

async function summarize(target, userId, eligible) {
  const totals = { support: 0, oppose: 0 };
  let choice = null;
  let reportPending = false;
  if (target) {
    const targetId = target.id;
    const [groups, vote, report] = await Promise.all([
      LegalLibraryVote.findAll({ where: { targetId }, attributes: ['choice', [fn('COUNT', col('choice')), 'count']], group: ['choice'], raw: true }),
      LegalLibraryVote.findOne({ where: { targetId, userId }, attributes: ['choice'] }),
      Report.findOne({ where: pendingWhere(targetId, userId), attributes: ['id'] }),
    ]);
    for (const group of groups) totals[group.choice] = Number(group.count);
    choice = vote?.choice ?? null;
    reportPending = Boolean(report);
  }
  return { canVote: eligible, totals, choice, reportPending };
}

const handle = action => async (req, res, next) => {
  const ids = readTarget(req.method === 'GET' ? req.query : req.body);
  if (!ids) return res.status(400).json({ error: 'Επίλεξε έγκυρο νομοθέτημα ή διάταξη.' });
  try { return await action(req, res, ids); }
  catch (error) {
    if (error.feedbackStatus) return res.status(error.feedbackStatus).json({ error: error.message });
    return next(error);
  }
};

router.get('/', handle(async (req, res, ids) => {
  const userId = req.user.id;
  const [target, eligible] = await Promise.all([LegalLibraryTarget.findOne({ where: ids }), canVote(userId)]);
  return res.json(await summarize(target, userId, eligible));
}));

router.put('/vote', csrfProtection, handle(async (req, res, ids) => {
  const { choice } = req.body;
  if (choice !== 'support' && choice !== 'oppose' && choice !== null) {
    throw feedbackError(400, 'Επίλεξε «Υπέρ», «Κατά» ή απόσυρε την ψήφο σου.');
  }
  const userId = req.user.id;
  const eligible = await canVote(userId);
  if (!eligible && choice !== null) throw feedbackError(403, 'Η ψήφος είναι διαθέσιμη σε μέλη με δηλωμένη ελληνική υπηκοότητα.');
  if (choice === null) {
    const target = await LegalLibraryTarget.findOne({ where: ids });
    if (target) await LegalLibraryVote.destroy({ where: { targetId: target.id, userId } });
    return res.json(await summarize(target, userId, eligible));
  }
  const target = await getTarget(ids);
  await LegalLibraryVote.upsert({ targetId: target.id, userId, choice });
  return res.json(await summarize(target, userId, eligible));
}));

router.post('/report', createLimiter, csrfProtection, handle(async (req, res, ids) => {
  const { category, message } = req.body;
  if (!reportCategories.has(category) || typeof message !== 'string' || !message.trim() || message.length > 2000) {
    throw feedbackError(400, 'Επίλεξε λόγο και γράψε μια περιγραφή έως 2.000 χαρακτήρες.');
  }
  const userId = req.user.id;
  const target = await getTarget(ids);
  try { await Report.create({ ...pendingWhere(target.id, userId), category, message: message.trim() }); }
  catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    throw feedbackError(409, 'Υπάρχει ήδη αναφορά σου για αυτό το κείμενο σε αναμονή εξέτασης.');
  }
  return res.status(201).json(await summarize(target, userId, await canVote(userId)));
}));

module.exports = router;
