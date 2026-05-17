'use strict';

const PROFILE_VISIBILITY = Object.freeze({
  HIDDEN: 'hidden',
  REGISTERED: 'registered',
  PUBLIC: 'public',
});

const VALID_PROFILE_VISIBILITY = Object.freeze([
  PROFILE_VISIBILITY.HIDDEN,
  PROFILE_VISIBILITY.REGISTERED,
  PROFILE_VISIBILITY.PUBLIC,
]);

function isValidProfileVisibility(value) {
  return VALID_PROFILE_VISIBILITY.includes(value);
}

function getDiscoverableVisibilities(isAuthenticated) {
  return isAuthenticated
    ? [PROFILE_VISIBILITY.REGISTERED, PROFILE_VISIBILITY.PUBLIC]
    : [PROFILE_VISIBILITY.PUBLIC];
}

function canViewProfile({
  profileVisibility,
  isAuthenticated = false,
  isOwner = false,
  isPrivileged = false,
}) {
  if (isOwner || isPrivileged) return true;
  if (profileVisibility === PROFILE_VISIBILITY.PUBLIC) return true;
  if (profileVisibility === PROFILE_VISIBILITY.REGISTERED) return isAuthenticated;
  return false;
}

module.exports = {
  PROFILE_VISIBILITY,
  VALID_PROFILE_VISIBILITY,
  isValidProfileVisibility,
  getDiscoverableVisibilities,
  canViewProfile,
};
