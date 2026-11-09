'use strict';
const crypto = require('crypto');
const { Op } = require('sequelize');
const { ProposalDigestPreference, User, IssueFollow, Suggestion } = require('../models');
const { sendMail } = require('./mailService');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '');

async function getPreference(user) {
  const row = await ProposalDigestPreference.findOne({ where: { userId: user.id } });
  return { enabled: Boolean(row?.enabled), locale: row?.locale || 'el', emailVerified: Boolean(user.emailVerified), email: user.email || null };
}

async function updatePreference(user, enabled, locale) {
  if (typeof enabled !== 'boolean') throw Object.assign(new Error('enabled must be a boolean.'), { status: 400 });
  if (locale !== undefined && !['el', 'en', 'ro'].includes(locale)) throw Object.assign(new Error('locale must be el, en, or ro.'), { status: 400 });
  if (enabled && (!user.email || !user.emailVerified)) throw Object.assign(new Error('Verify an email address before enabling proposal digests.'), { status: 400 });
  const now = new Date();
  const [row] = await ProposalDigestPreference.findOrCreate({ where: { userId: user.id }, defaults: { enabled: false } });
  const update = { locale: locale || row.locale || 'el' };
  if (enabled) Object.assign(update, { enabled: true, enabledAt: now, lastSentAt: now });
  else update.enabled = false;
  await row.update(update);
  return getPreference(user);
}

async function unsubscribe(token) {
  if (typeof token !== 'string' || token.length < 32 || token.length > 200) return { unsubscribed: false };
  const row = await ProposalDigestPreference.findOne({ where: { unsubscribeTokenHash: hashToken(token) } });
  if (row) await row.update({ enabled: false, unsubscribeTokenHash: null });
  return { unsubscribed: Boolean(row) };
}

async function getRecentProposalUpdates(userId, from, to) {
  const follows = await IssueFollow.findAll({ where: { userId, entityType: 'suggestion' }, attributes: ['entityId'] });
  const ids = follows.map((row) => row.entityId);
  if (!ids.length) return [];
  const proposals = await Suggestion.findAll({
    where: { id: { [Op.in]: ids }, visibility: 'public', organizationId: null },
    attributes: ['id', 'title', 'progress'],
  });
  return proposals.flatMap((proposal) => {
    const history = Array.isArray(proposal.progress?.history) ? proposal.progress.history : [];
    const events = history.filter((event) => {
      const at = new Date(event.at).getTime();
      return Number.isFinite(at) && at > from.getTime() && at <= to.getTime();
    });
    return events.map((event) => ({ id: proposal.id, title: proposal.title, event }));
  });
}

function buildMessage(updates, token, locale = 'el') {
  const unsubscribeUrl = `${frontendUrl()}/following/unsubscribe?token=${encodeURIComponent(token)}`;
  const copy = {
    el: { subject: 'Εβδομαδιαίες εξελίξεις στις προτάσεις που ακολουθείτε', title: 'Εξελίξεις στις προτάσεις που ακολουθείτε', intro: 'Αυτές είναι οι νέες δημόσιες ενημερώσεις της εβδομάδας:', reason: 'Λαμβάνετε αυτό το email επειδή ενεργοποιήσατε την εβδομαδιαία σύνοψη.', unsubscribe: 'Διακοπή λήψης', textIntro: 'Οι προτάσεις που ακολουθείτε έχουν νέες εξελίξεις:', textUnsubscribe: 'Διακοπή εβδομαδιαίων email:' },
    en: { subject: 'Weekly updates to proposals you follow', title: 'Updates to proposals you follow', intro: 'Here are this week’s new public progress updates:', reason: 'You receive this email because you enabled the weekly digest.', unsubscribe: 'Unsubscribe', textIntro: 'There are new updates to proposals you follow:', textUnsubscribe: 'Unsubscribe from weekly emails:' },
    ro: { subject: 'Noutăți săptămânale despre propunerile urmărite', title: 'Noutăți despre propunerile urmărite', intro: 'Iată actualizările publice noi din această săptămână:', reason: 'Primești acest email deoarece ai activat rezumatul săptămânal.', unsubscribe: 'Dezabonare', textIntro: 'Au apărut noutăți despre propunerile pe care le urmărești:', textUnsubscribe: 'Dezabonare de la emailurile săptămânale:' },
  }[locale] || { subject: 'Weekly updates to proposals you follow', title: 'Updates to proposals you follow', intro: 'Here are this week’s new public progress updates:', reason: 'You receive this email because you enabled the weekly digest.', unsubscribe: 'Unsubscribe', textIntro: 'There are new updates to proposals you follow:', textUnsubscribe: 'Unsubscribe from weekly emails:' };
  const rows = updates.map(({ id, title, event }) => {
    const href = `${frontendUrl()}/suggestions/${id}`;
    return `<li style="margin:0 0 20px"><a href="${href}"><strong>${escapeHtml(title)}</strong></a><br><span>${escapeHtml(event.note)}</span></li>`;
  }).join('');
  return {
    subject: copy.subject,
    text: `${copy.textIntro}\n\n${updates.map(({ id, title, event }) => `${title}\n${event.note}\n${frontendUrl()}/suggestions/${id}`).join('\n\n')}\n\n${copy.textUnsubscribe} ${unsubscribeUrl}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:640px;margin:auto"><h1 style="font-size:22px">${copy.title}</h1><p>${copy.intro}</p><ul style="padding-left:20px">${rows}</ul><p style="font-size:13px;color:#596579">${copy.reason} <a href="${unsubscribeUrl}">${copy.unsubscribe}</a></p></div>`,
  };
}

async function processWeeklyDigests({ now = new Date() } = {}) {
  const cutoff = new Date(now);
  const dueBefore = new Date(cutoff.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rows = await ProposalDigestPreference.findAll({ where: { enabled: true, lastSentAt: { [Op.lte]: dueBefore } }, order: [['id', 'ASC']], limit: 250 });
  const summary = { processed: 0, sent: 0, skipped: 0, failed: 0 };
  for (const row of rows) {
    summary.processed += 1;
    try {
      const user = await User.findByPk(row.userId, { attributes: ['id', 'email', 'emailVerified'] });
      if (!user?.email || !user.emailVerified || !row.enabled) { summary.skipped += 1; continue; }
      const from = row.lastSentAt || row.enabledAt || cutoff;
      const updates = await getRecentProposalUpdates(user.id, from, cutoff);
      if (updates.length) {
        const token = crypto.randomBytes(32).toString('hex');
        await row.update({ unsubscribeTokenHash: hashToken(token) });
        await sendMail({ to: user.email, ...buildMessage(updates, token, row.locale) });
      }
      await row.update({ lastSentAt: cutoff });
      if (updates.length) summary.sent += 1; else summary.skipped += 1;
    } catch (error) {
      summary.failed += 1;
      console.error(`[proposalDigestService] Failed digest for preference ${row.id}:`, error.message);
    }
  }
  return summary;
}

module.exports = { getPreference, updatePreference, unsubscribe, processWeeklyDigests, getRecentProposalUpdates, buildMessage };
