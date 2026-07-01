'use strict';

const DEFAULT_SESSION_DAYS = 30;

function getSessionDays() {
  const raw = Number.parseInt(process.env.SESSION_MAX_AGE_DAYS || '', 10);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_SESSION_DAYS;
}

function getSessionMaxAgeMs() {
  return getSessionDays() * 24 * 60 * 60 * 1000;
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || `${getSessionDays()}d`;
}

module.exports = {
  DEFAULT_SESSION_DAYS,
  getJwtExpiresIn,
  getSessionDays,
  getSessionMaxAgeMs,
};
