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

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || '', 10);
  const secure = toBoolean(process.env.SMTP_SECURE, false);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !Number.isInteger(port) || !user || !pass) {
    throw new Error('SMTP configuration is incomplete. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
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
  const from = process.env.SMTP_FROM || 'Appofa <no-reply@appofasi.gr>';

  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Appofa password reset request',
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
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
      <p>If the button/link does not work, copy and paste this URL in your browser:</p>
      <p>${resetUrl}</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};

async function registerUser({
  username,
  email,
  password,
  firstNameNative,
  lastNameNative,
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
    searchable: searchable !== undefined ? Boolean(searchable) : true,
    isDiaspora: Boolean(isDiaspora),
    residenceCountryCode: residenceCountryCode ? String(residenceCountryCode).trim().toUpperCase() : null,
    homeLocationId: normalizedHomeLocationId,
  });

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
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();
    throw error;
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
    throw new ServiceError(400, 'Invalid password reset token.');
  }

  if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() <= Date.now()) {
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();
    throw new ServiceError(400, 'Password reset token has expired.');
  }

  user.password = newPasswordResult.value;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();
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
};
