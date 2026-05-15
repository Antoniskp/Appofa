const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { User } = require('../models');
const {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeEmail,
  normalizePassword
} = require('../utils/validators');
require('dotenv').config();

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;
const PASSWORD_MIN_LENGTH = 6;
const NAME_MAX_LENGTH = 100;
const PASSWORD_RESET_DEFAULT_TTL_MINUTES = 60;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_GENERIC_SUCCESS_MESSAGE = 'If an account with that email exists, a password reset link has been sent.';
const PASSWORD_RESET_EMAIL_SUBJECT = 'Appofa password reset request';
const EMAIL_VERIF_DEFAULT_TTL_HOURS = 24;
const EMAIL_VERIF_TOKEN_BYTES = 32;
const EMAIL_VERIF_SUBJECT = 'Please verify your Appofa email address';

let smtpTransporter = null;

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured');
  }
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

const toBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return defaultValue;
};

const getPasswordResetTtlMinutes = () => {
  const raw = Number.parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || '', 10);
  return Number.isInteger(raw) && raw > 0 ? raw : PASSWORD_RESET_DEFAULT_TTL_MINUTES;
};

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '');

const getResetTokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const getEmailVerifTokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || '', 10);
  const secure = toBoolean(process.env.SMTP_SECURE, false);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const missingKeys = [];
  if (!host) missingKeys.push('SMTP_HOST');
  if (!Number.isInteger(port)) missingKeys.push('SMTP_PORT');
  if (!user) missingKeys.push('SMTP_USER');
  if (!pass) missingKeys.push('SMTP_PASS');

  if (missingKeys.length > 0) {
    throw new Error(`SMTP configuration is incomplete. Missing/invalid: ${missingKeys.join(', ')}`);
  }

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return smtpTransporter;
};

const sendPasswordResetEmail = async (email, token, expiresInMinutes) => {
  const frontendUrl = getFrontendUrl();
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const safeResetUrl = escapeHtml(resetUrl);
  const from = process.env.SMTP_FROM || 'Appofa <no-reply@appofasi.gr>';

  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from,
    to: email,
    subject: PASSWORD_RESET_EMAIL_SUBJECT,
    text: [
      'You requested a password reset for your Appofa account.',
      '',
      `Reset your password using this link (valid for ${expiresInMinutes} minutes):`,
      resetUrl,
      '',
      'If you did not request this, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <p>You requested a password reset for your Appofa account.</p>
      <p><strong>This link expires in ${expiresInMinutes} minutes.</strong></p>
      <p>
        Click here to reset your password:<br />
        <a href="${safeResetUrl}">${safeResetUrl}</a>
      </p>
      <p>If the button/link does not work, copy and paste this URL in your browser:</p>
      <p>${safeResetUrl}</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};

const sendVerificationEmail = async (email, token) => {
  const frontendUrl = getFrontendUrl();
  const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const safeVerificationUrl = escapeHtml(verificationUrl);
  const from = process.env.SMTP_FROM || 'Appofa <no-reply@appofasi.gr>';

  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from,
    to: email,
    subject: EMAIL_VERIF_SUBJECT,
    text: [
      'Welcome to Appofa!',
      '',
      'Please verify your email address using this link (valid for 24 hours):',
      verificationUrl,
      '',
      'If you did not create this account, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <p>Welcome to Appofa!</p>
      <p><strong>Please verify your email address within 24 hours.</strong></p>
      <p>
        Click here to verify your email:<br />
        <a href="${safeVerificationUrl}">${safeVerificationUrl}</a>
      </p>
      <p>If the button/link does not work, copy and paste this URL in your browser:</p>
      <p>${safeVerificationUrl}</p>
      <p>If you did not create this account, you can safely ignore this email.</p>
    `,
  });
};

async function registerUser({
  username,
  email,
  password,
  firstNameNative,
  lastNameNative,
  nationality,
  searchable,
  isDiaspora,
  residenceCountryCode,
  homeLocationId
}) {
  const usernameResult = normalizeRequiredText(username, 'Username', USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH);
  if (usernameResult.error) throw new ServiceError(400, usernameResult.error);

  const emailResult = normalizeEmail(email);
  if (emailResult.error) throw new ServiceError(400, emailResult.error);

  const passwordResult = normalizePassword(password, 'Password', PASSWORD_MIN_LENGTH);
  if (passwordResult.error) throw new ServiceError(400, passwordResult.error);

  const firstNameNativeResult = normalizeOptionalText(firstNameNative, 'First name', undefined, NAME_MAX_LENGTH);
  if (firstNameNativeResult.error) throw new ServiceError(400, firstNameNativeResult.error);

  const lastNameNativeResult = normalizeOptionalText(lastNameNative, 'Last name', undefined, NAME_MAX_LENGTH);
  if (lastNameNativeResult.error) throw new ServiceError(400, lastNameNativeResult.error);

  const normalizedNationality = nationality == null || nationality === ''
    ? null
    : String(nationality).trim().toUpperCase();

  if (normalizedNationality && normalizedNationality.length > 5) {
    throw new ServiceError(400, 'Nationality code must be at most 5 characters.');
  }

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email: emailResult.value }, { username: usernameResult.value }]
    }
  });

  if (existingUser) {
    throw new ServiceError(400, 'User with this email or username already exists.');
  }

  const parsedHomeLocationId = Number.parseInt(homeLocationId, 10);
  const normalizedHomeLocationId = homeLocationId == null || homeLocationId === '' || Number.isNaN(parsedHomeLocationId)
    ? null
    : parsedHomeLocationId;

  const user = await User.create({
    username: usernameResult.value,
    email: emailResult.value,
    password: passwordResult.value,
    role: 'viewer',
    firstNameNative: firstNameNativeResult.value,
    lastNameNative: lastNameNativeResult.value,
    nationality: normalizedNationality,
    searchable: searchable !== undefined ? Boolean(searchable) : true,
    isDiaspora: Boolean(isDiaspora),
    residenceCountryCode: residenceCountryCode ? String(residenceCountryCode).trim().toUpperCase() : null,
    homeLocationId: normalizedHomeLocationId,
  });

  if (user.email) {
    const rawToken = crypto.randomBytes(EMAIL_VERIF_TOKEN_BYTES).toString('hex');
    user.emailVerifToken = getEmailVerifTokenHash(rawToken);
    user.emailVerifExpires = new Date(Date.now() + EMAIL_VERIF_DEFAULT_TTL_HOURS * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user.email, rawToken);
    } catch (error) {
      console.error('[registerUser] SMTP send failed:', error);
    }
  }

  const token = generateToken(user);
  return { user, token };
}

async function loginUser(email, password) {
  const emailResult = normalizeEmail(email);
  if (emailResult.error) throw new ServiceError(400, emailResult.error);

  const passwordResult = normalizePassword(password, 'Password', PASSWORD_MIN_LENGTH);
  if (passwordResult.error) throw new ServiceError(400, passwordResult.error);

  const user = await User.findOne({ where: { email: emailResult.value } });
  if (!user) throw new ServiceError(401, 'Invalid email or password.');

  const isValidPassword = await user.comparePassword(passwordResult.value);
  if (!isValidPassword) throw new ServiceError(401, 'Invalid email or password.');

  const token = generateToken(user);
  return { user, token };
}

async function changePassword(userId, currentPassword, newPassword) {
  const currentPasswordResult = normalizePassword(currentPassword, 'Current password', PASSWORD_MIN_LENGTH);
  if (currentPasswordResult.error) throw new ServiceError(400, currentPasswordResult.error);

  const newPasswordResult = normalizePassword(newPassword, 'New password', PASSWORD_MIN_LENGTH);
  if (newPasswordResult.error) throw new ServiceError(400, newPasswordResult.error);

  const user = await User.findByPk(userId);
  if (!user) throw new ServiceError(404, 'User not found.');

  const isValidPassword = await user.comparePassword(currentPasswordResult.value);
  if (!isValidPassword) throw new ServiceError(400, 'Current password is incorrect.');

  user.password = newPasswordResult.value;
  await user.save();
}

async function setPassword(userId, newPassword) {
  const newPasswordResult = normalizePassword(newPassword, 'New password', PASSWORD_MIN_LENGTH);
  if (newPasswordResult.error) throw new ServiceError(400, newPasswordResult.error);

  const user = await User.findByPk(userId);
  if (!user) throw new ServiceError(404, 'User not found.');
  if (user.password) {
    throw new ServiceError(400, 'Account already has a password. Use change password instead.');
  }

  user.password = newPasswordResult.value;
  await user.save();
}

async function requestPasswordReset(email) {
  const emailResult = normalizeEmail(email);
  if (emailResult.error) throw new ServiceError(400, emailResult.error);

  const user = await User.findOne({ where: { email: emailResult.value } });
  if (!user) {
    return { message: PASSWORD_RESET_GENERIC_SUCCESS_MESSAGE };
  }

  const expiresInMinutes = getPasswordResetTtlMinutes();
  const rawToken = crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
  const tokenHash = getResetTokenHash(rawToken);
  const resetPasswordExpires = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpires = resetPasswordExpires;
  await user.save();

  try {
    await sendPasswordResetEmail(user.email, rawToken, expiresInMinutes);
  } catch (error) {
    // SMTP send failure: log for operator visibility but do not re-throw.
    // The token is cleared so no orphaned reset entry lingers in the DB.
    // The generic success message is returned regardless to avoid leaking
    // whether the account exists or whether email delivery succeeded
    // (enumeration protection).
    console.error('[requestPasswordReset] SMTP send failed:', error);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();
  }

  return { message: PASSWORD_RESET_GENERIC_SUCCESS_MESSAGE };
}

async function resetPasswordWithToken(token, newPassword) {
  const tokenResult = normalizeRequiredText(token, 'Reset token', 1);
  if (tokenResult.error) throw new ServiceError(400, tokenResult.error);

  const newPasswordResult = normalizePassword(newPassword, 'New password', PASSWORD_MIN_LENGTH);
  if (newPasswordResult.error) throw new ServiceError(400, newPasswordResult.error);

  const tokenHash = getResetTokenHash(tokenResult.value);
  const user = await User.findOne({ where: { resetPasswordTokenHash: tokenHash } });

  if (!user) {
    const error = new ServiceError(400, 'Invalid password reset token.');
    error.code = 'RESET_TOKEN_INVALID';
    throw error;
  }

  if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() <= Date.now()) {
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();
    const error = new ServiceError(400, 'Password reset token has expired.');
    error.code = 'RESET_TOKEN_EXPIRED';
    throw error;
  }

  user.password = newPasswordResult.value;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();
}

async function verifyEmailWithToken(token) {
  const tokenResult = normalizeRequiredText(token, 'Email verification token', 1);
  if (tokenResult.error) throw new ServiceError(400, tokenResult.error);

  const tokenHash = getEmailVerifTokenHash(tokenResult.value);
  const user = await User.findOne({ where: { emailVerifToken: tokenHash } });

  if (!user) {
    const error = new ServiceError(400, 'Invalid email verification token.');
    error.code = 'EMAIL_VERIF_TOKEN_INVALID';
    throw error;
  }

  if (!user.emailVerifExpires || user.emailVerifExpires.getTime() <= Date.now()) {
    user.emailVerifToken = null;
    user.emailVerifExpires = null;
    await user.save();
    const error = new ServiceError(400, 'Email verification token has expired.');
    error.code = 'EMAIL_VERIF_TOKEN_EXPIRED';
    throw error;
  }

  user.emailVerified = true;
  user.emailVerifToken = null;
  user.emailVerifExpires = null;
  await user.save();

  return { user };
}

async function resendVerificationEmail(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new ServiceError(404, 'User not found.');
  if (user.emailVerified) throw new ServiceError(400, 'Email is already verified.');
  if (!user.email) throw new ServiceError(400, 'No email address on this account.');

  const rawToken = crypto.randomBytes(EMAIL_VERIF_TOKEN_BYTES).toString('hex');
  user.emailVerifToken = getEmailVerifTokenHash(rawToken);
  user.emailVerifExpires = new Date(Date.now() + EMAIL_VERIF_DEFAULT_TTL_HOURS * 60 * 60 * 1000);
  await user.save();

  try {
    await sendVerificationEmail(user.email, rawToken);
  } catch (error) {
    console.error('[resendVerificationEmail] SMTP send failed:', error);
  }

  return { message: 'Verification email sent.' };
}

module.exports = {
  ServiceError,
  generateToken,
  registerUser,
  loginUser,
  changePassword,
  setPassword,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyEmailWithToken,
  resendVerificationEmail,
};
