const jwt = require('jsonwebtoken');
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

module.exports = {
  ServiceError,
  generateToken,
  registerUser,
  loginUser,
  changePassword
};
