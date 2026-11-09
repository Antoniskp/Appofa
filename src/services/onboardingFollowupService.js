'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { sendMail } = require('./mailService');

const COPY = {
  en: {
    verifySubject: 'One quick step to finish joining Appofasi',
    verifyTitle: 'Your Appofasi account is ready',
    verifyBody: 'Confirm your email to activate your account and choose how you would like to take part.',
    verifyAction: 'Confirm email',
    onboardingSubject: 'Choose your first step on Appofasi',
    onboardingTitle: 'Your next step is waiting',
    onboardingBody: 'Choose what you would like to do on Appofasi and we will point you to a useful place to start.',
    onboardingAction: 'Continue onboarding',
    ignore: 'If you have already done this, you can ignore this email.',
  },
  el: {
    verifySubject: 'Ένα γρήγορο βήμα για να ολοκληρώσεις την εγγραφή σου στο Appofasi',
    verifyTitle: 'Ο λογαριασμός σου στο Appofasi είναι έτοιμος',
    verifyBody: 'Επιβεβαίωσε το email σου για να ενεργοποιήσεις τον λογαριασμό και να επιλέξεις πώς θέλεις να συμμετέχεις.',
    verifyAction: 'Επιβεβαίωση email',
    onboardingSubject: 'Διάλεξε το πρώτο σου βήμα στο Appofasi',
    onboardingTitle: 'Το επόμενο βήμα σε περιμένει',
    onboardingBody: 'Διάλεξε τι θέλεις να κάνεις στο Appofasi και θα σε καθοδηγήσουμε σε ένα χρήσιμο σημείο εκκίνησης.',
    onboardingAction: 'Συνέχεια γνωριμίας',
    ignore: 'Αν έχεις ήδη ολοκληρώσει αυτό το βήμα, αγνόησε αυτό το email.',
  },
  ro: {
    verifySubject: 'Un pas simplu pentru a-ți activa contul Appofasi',
    verifyTitle: 'Contul tău Appofasi este pregătit',
    verifyBody: 'Confirmă adresa de e-mail pentru a activa contul și a alege cum dorești să participi.',
    verifyAction: 'Confirmă e-mailul',
    onboardingSubject: 'Alege primul pas pe Appofasi',
    onboardingTitle: 'Următorul pas te așteaptă',
    onboardingBody: 'Alege ce dorești să faci pe Appofasi și te vom îndruma către un loc potrivit pentru început.',
    onboardingAction: 'Continuă configurarea',
    ignore: 'Dacă ai făcut deja acest pas, poți ignora acest e-mail.',
  },
};

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[ch]));
const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function sendFollowup(user) {
  const copy = COPY[user.preferredLocale] || COPY.el;
  const isVerificationNudge = !user.emailVerified;
  let actionUrl = `${getFrontendUrl()}/onboarding`;

  if (isVerificationNudge) {
    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerifToken = hashToken(token);
    user.emailVerifExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    actionUrl = `${getFrontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  }

  const title = isVerificationNudge ? copy.verifyTitle : copy.onboardingTitle;
  const body = isVerificationNudge ? copy.verifyBody : copy.onboardingBody;
  const action = isVerificationNudge ? copy.verifyAction : copy.onboardingAction;
  const subject = isVerificationNudge ? copy.verifySubject : copy.onboardingSubject;
  const safeUrl = escapeHtml(actionUrl);
  const safeAction = escapeHtml(action);
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const text = `${title}\n\n${body}\n\n${action}: ${actionUrl}\n\n${copy.ignore}`;

  await sendMail({
    to: user.email,
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:600px;margin:auto"><h1 style="font-size:24px">${safeTitle}</h1><p>${safeBody}</p><p><a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${safeAction}</a></p><p>${escapeHtml(copy.ignore)}</p></div>`,
  });
}

async function processDueOnboardingFollowups({ now = new Date(), batchSize = 100 } = {}) {
  const dueBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const staleClaimBefore = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const eligibility = {
    [Op.or]: [
      { emailVerified: false },
      { onboardingCompletedAt: { [Op.is]: null }, onboardingDismissed: false },
    ],
  };
  const users = await User.findAll({
    where: {
      email: { [Op.not]: null },
      createdAt: { [Op.lte]: dueBefore },
      onboardingFollowupSentAt: { [Op.is]: null },
      ...eligibility,
      [Op.and]: [{
        [Op.or]: [
          { onboardingFollowupClaimedAt: { [Op.is]: null } },
          { onboardingFollowupClaimedAt: { [Op.lte]: staleClaimBefore } },
        ],
      }],
    },
    order: [['createdAt', 'ASC']],
    limit: batchSize,
  });

  const summary = { checked: users.length, sent: 0, skipped: 0, failed: 0 };
  for (const user of users) {
    const [claimed] = await User.update({ onboardingFollowupClaimedAt: now }, {
      where: {
        id: user.id,
        email: { [Op.not]: null },
        createdAt: { [Op.lte]: dueBefore },
        onboardingFollowupSentAt: { [Op.is]: null },
        [Op.or]: [
          { onboardingFollowupClaimedAt: { [Op.is]: null } },
          { onboardingFollowupClaimedAt: { [Op.lte]: staleClaimBefore } },
        ],
        [Op.and]: [eligibility],
      },
    });
    if (!claimed) {
      summary.skipped += 1;
      continue;
    }

    try {
      await user.reload();
      if (user.emailVerified && (user.onboardingCompletedAt || user.onboardingDismissed)) {
        await user.update({ onboardingFollowupClaimedAt: null });
        summary.skipped += 1;
        continue;
      }
      await sendFollowup(user);
      await user.update({ onboardingFollowupClaimedAt: null, onboardingFollowupSentAt: now });
      summary.sent += 1;
    } catch (error) {
      await user.update({ onboardingFollowupClaimedAt: null });
      summary.failed += 1;
      console.error(`[onboardingFollowupService] Failed follow-up for user ${user.id}:`, error?.message || error);
    }
  }
  return summary;
}

module.exports = { processDueOnboardingFollowups };
