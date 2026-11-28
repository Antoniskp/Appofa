'use strict';

/**
 * Passwordless sign-in with a 6-digit code sent by email.
 *
 * One flow covers sign-up, sign-in and email verification:
 *   1. requestEmailCode(email) sends a short-lived code.
 *   2. verifyEmailCode(email, code) signs the person in. If no account exists
 *      for the address, one is created. Entering the code proves the address,
 *      so the account is marked as email-verified.
 *
 * Only a keyed hash of each code is stored. Codes expire after 10 minutes,
 * allow a limited number of wrong guesses and can be used once.
 */

const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, User, EmailLoginCode } = require('../models');
const { sendMail } = require('./mailService');
const newsletterService = require('./newsletterService');
const { normalizeEmail } = require('../utils/validators');
const { PROFILE_VISIBILITY } = require('../utils/profileVisibility');
const { ServiceError, generateToken } = require('./authService');

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODES_PER_HOUR = 5;
const SUPPORTED_LOCALES = ['el', 'en', 'ro'];

const normalizeLocale = (locale) => {
  const value = String(locale || '').toLowerCase();
  return SUPPORTED_LOCALES.includes(value) ? value : 'el';
};

const codeCopy = {
  el: {
    subject: (code) => `Ο κωδικός σου για το Appofasi: ${code}`,
    intro: 'Χρησιμοποίησε αυτόν τον κωδικό για να συνδεθείς στο Appofasi:',
    expiry: `Ο κωδικός ισχύει για ${CODE_TTL_MINUTES} λεπτά και μπορεί να χρησιμοποιηθεί μία φορά.`,
    newAccount: 'Αν δεν έχεις ακόμη λογαριασμό, θα δημιουργηθεί αυτόματα.',
    ignore: 'Αν δεν ζήτησες εσύ αυτόν τον κωδικό, αγνόησε αυτό το email. Κανείς δεν μπορεί να συνδεθεί χωρίς αυτόν.',
  },
  en: {
    subject: (code) => `Your Appofasi code: ${code}`,
    intro: 'Use this code to sign in to Appofasi:',
    expiry: `The code is valid for ${CODE_TTL_MINUTES} minutes and can be used once.`,
    newAccount: 'If you do not have an account yet, one will be created for you.',
    ignore: 'If you did not ask for this code, ignore this email. Nobody can sign in without it.',
  },
  ro: {
    subject: (code) => `Codul tău Appofasi: ${code}`,
    intro: 'Folosește acest cod pentru a te conecta la Appofasi:',
    expiry: `Codul este valabil ${CODE_TTL_MINUTES} minute și poate fi folosit o singură dată.`,
    newAccount: 'Dacă nu ai încă un cont, acesta va fi creat automat.',
    ignore: 'Dacă nu ai cerut acest cod, ignoră acest e-mail. Nimeni nu se poate conecta fără el.',
  },
};

const getCodeSecret = () => {
  const secret = process.env.EMAIL_CODE_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be configured');
  return secret;
};

// Keyed hash: a leaked table cannot be brute-forced offline without the server secret.
const hashCode = (email, code) => crypto
  .createHmac('sha256', getCodeSecret())
  .update(`${email}:${code}`)
  .digest('hex');

const generateCode = () => String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0');

const normalizeCode = (code) => String(code ?? '').replace(/\D/g, '');

const timingSafeEqualHex = (a, b) => {
  const left = Buffer.from(String(a), 'hex');
  const right = Buffer.from(String(b), 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const findUserByEmail = (email, options = {}) => User.findOne({
  where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), email),
  ...options,
});

async function sendCodeEmail(email, code, locale) {
  const copy = codeCopy[normalizeLocale(locale)];
  const spacedCode = `${code.slice(0, 3)} ${code.slice(3)}`;
  await sendMail({
    to: email,
    subject: copy.subject(code),
    text: [copy.intro, '', code, '', copy.expiry, copy.newAccount, '', copy.ignore].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:600px;margin:auto">
        <p>${copy.intro}</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:16px 0">${spacedCode}</p>
        <p>${copy.expiry}</p>
        <p>${copy.newAccount}</p>
        <p style="color:#52607a">${copy.ignore}</p>
      </div>
    `,
  });
}

/**
 * Send a sign-in code. The response is the same whether or not an account
 * exists, so the endpoint cannot be used to discover registered addresses.
 * @returns {Promise<{ cooldownSeconds: number }>}
 */
async function requestEmailCode({ email, locale } = {}) {
  const emailResult = normalizeEmail(email);
  if (emailResult.error) throw new ServiceError(400, emailResult.error);
  const normalizedEmail = emailResult.value;

  const now = Date.now();
  const recentCodes = await EmailLoginCode.findAll({
    where: { email: normalizedEmail, createdAt: { [Op.gt]: new Date(now - 60 * 60 * 1000) } },
    order: [['createdAt', 'DESC']],
  });

  const latest = recentCodes[0];
  if (latest) {
    const secondsSinceLatest = Math.floor((now - new Date(latest.createdAt).getTime()) / 1000);
    if (secondsSinceLatest < RESEND_COOLDOWN_SECONDS) {
      const error = new ServiceError(429, 'Please wait before requesting another code.');
      error.code = 'EMAIL_CODE_COOLDOWN';
      error.retryAfter = RESEND_COOLDOWN_SECONDS - secondsSinceLatest;
      throw error;
    }
  }
  if (recentCodes.length >= MAX_CODES_PER_HOUR) {
    const error = new ServiceError(429, 'Too many codes requested for this address. Please try again later.');
    error.code = 'EMAIL_CODE_HOURLY_LIMIT';
    error.retryAfter = 60 * 60;
    throw error;
  }

  const code = generateCode();
  // A new code replaces every earlier unused code for this address.
  await EmailLoginCode.update(
    { consumedAt: new Date(now) },
    { where: { email: normalizedEmail, consumedAt: null } }
  );
  const record = await EmailLoginCode.create({
    email: normalizedEmail,
    codeHash: hashCode(normalizedEmail, code),
    expiresAt: new Date(now + CODE_TTL_MINUTES * 60 * 1000),
  });

  try {
    await sendCodeEmail(normalizedEmail, code, locale);
  } catch (error) {
    console.error('[requestEmailCode] SMTP send failed:', error);
    await record.destroy().catch(() => {});
    throw new ServiceError(503, 'The code could not be sent. Please try again.');
  }

  return { cooldownSeconds: RESEND_COOLDOWN_SECONDS };
}

const invalidCodeError = (code = 'EMAIL_CODE_INVALID', message = 'The code is incorrect or has expired.') => {
  const error = new ServiceError(400, message);
  error.code = code;
  return error;
};

/**
 * Check a code and sign the person in, creating the account if needed.
 * @returns {Promise<{ user: object, token: string, isNewUser: boolean }>}
 */
async function verifyEmailCode({ email, code, locale, newsletterOptIn } = {}) {
  const emailResult = normalizeEmail(email);
  if (emailResult.error) throw new ServiceError(400, emailResult.error);
  const normalizedEmail = emailResult.value;

  const normalizedCode = normalizeCode(code);
  if (normalizedCode.length !== CODE_LENGTH) throw invalidCodeError();

  const record = await EmailLoginCode.findOne({
    where: { email: normalizedEmail, consumedAt: null },
    order: [['createdAt', 'DESC']],
  });
  if (!record) throw invalidCodeError();
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    throw invalidCodeError('EMAIL_CODE_EXPIRED', 'The code has expired. Request a new one.');
  }
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw invalidCodeError('EMAIL_CODE_TOO_MANY_ATTEMPTS', 'Too many wrong attempts. Request a new code.');
  }

  if (!timingSafeEqualHex(record.codeHash, hashCode(normalizedEmail, normalizedCode))) {
    await EmailLoginCode.increment('attempts', { where: { id: record.id } });
    if (record.attempts + 1 >= MAX_VERIFY_ATTEMPTS) {
      throw invalidCodeError('EMAIL_CODE_TOO_MANY_ATTEMPTS', 'Too many wrong attempts. Request a new code.');
    }
    throw invalidCodeError();
  }

  // Consume atomically so the same code cannot sign in twice in parallel.
  const [consumed] = await EmailLoginCode.update(
    { consumedAt: new Date() },
    { where: { id: record.id, consumedAt: null } }
  );
  if (!consumed) throw invalidCodeError();

  const preferredLocale = normalizeLocale(locale);
  let user = await findUserByEmail(normalizedEmail);
  let isNewUser = false;

  if (user) {
    if (!user.emailVerified) {
      // Whoever created an unverified account never proved they own this address.
      // Drop its password and other sessions so they cannot keep a way in once
      // the real owner takes it over. The owner can sign in with codes or set a password.
      user.set({
        emailVerified: true,
        emailVerifToken: null,
        emailVerifExpires: null,
        ...(user.password && !user.googleId && !user.githubId
          ? { password: null } // the model hook also rotates sessionVersion
          : {}),
      });
      await user.save();
    }
  } else {
    try {
      user = await User.create({
        username: `citizen-${crypto.randomBytes(12).toString('hex')}`,
        email: normalizedEmail,
        password: null,
        role: 'viewer',
        emailVerified: true,
        profileVisibility: PROFILE_VISIBILITY.REGISTERED,
        preferredLocale,
      });
      isNewUser = true;
    } catch (error) {
      // Two codes verified at once for a new address: use the account the other request created.
      user = await findUserByEmail(normalizedEmail);
      if (!user) throw error;
    }

    if (isNewUser && newsletterOptIn === true) {
      try {
        await newsletterService.subscribePublic({ email: user.email, name: user.username, locale: preferredLocale });
      } catch (error) {
        console.error('[verifyEmailCode] Newsletter opt-in could not be saved:', error?.message || error);
      }
    }
  }

  return { user, token: generateToken(user), isNewUser };
}

module.exports = {
  CODE_LENGTH,
  CODE_TTL_MINUTES,
  MAX_VERIFY_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
  MAX_CODES_PER_HOUR,
  requestEmailCode,
  verifyEmailCode,
};
