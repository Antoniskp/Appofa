'use strict';

const crypto = require('crypto');
const { getCookie } = require('./cookies');

// Random, per-browser id stored with anonymous poll votes so they can be
// moved to the person's account when they sign in from the same browser.
const GUEST_VOTER_COOKIE = 'guest_voter';
const GUEST_VOTER_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const GUEST_VOTER_PATTERN = /^[a-f0-9]{48}$/;

const guestVoterCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: GUEST_VOTER_MAX_AGE_MS,
  path: '/',
});

const getGuestVoterId = (req) => {
  const value = getCookie(req, GUEST_VOTER_COOKIE);
  return value && GUEST_VOTER_PATTERN.test(value) ? value : null;
};

const ensureGuestVoterId = (req, res) => {
  const existing = getGuestVoterId(req);
  if (existing) return existing;
  const created = crypto.randomBytes(24).toString('hex');
  res.cookie(GUEST_VOTER_COOKIE, created, guestVoterCookieOptions());
  return created;
};

const clearGuestVoterId = (res) => {
  res.clearCookie(GUEST_VOTER_COOKIE, { path: '/' });
};

module.exports = {
  GUEST_VOTER_COOKIE,
  getGuestVoterId,
  ensureGuestVoterId,
  clearGuestVoterId,
};
