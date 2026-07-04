'use strict';

const { Op } = require('sequelize');
const { CandidateRegistration, Location, User } = require('../models');
const { getDescendantLocationIds } = require('../utils/locationUtils');
const { PROFILE_VISIBILITY, getDiscoverableVisibilities } = require('../utils/profileVisibility');

const POSITION_TYPES = new Set([
  'mayor',
  'parliamentary',
  'local_council',
  'county_council',
  'regional_council',
  'other',
]);

const STATUSES = new Set(['draft', 'submitted', 'approved', 'rejected', 'archived']);

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

function cleanString(value, maxLength = null) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function validateUrl(value) {
  const url = cleanString(value, 500);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new ServiceError(400, 'Website URL must be a valid http(s) URL.');
  }
}

function normalizePositionType(positionType) {
  const normalized = cleanString(positionType, 80);
  if (!normalized || !POSITION_TYPES.has(normalized)) {
    throw new ServiceError(400, 'Invalid candidate position type.');
  }
  return normalized;
}

function serializeRegistration(registration) {
  const data = registration.toJSON ? registration.toJSON() : registration;
  const candidate = data.candidate || null;
  return {
    ...data,
    candidate: candidate ? {
      id: candidate.id,
      username: candidate.username,
      firstNameNative: candidate.firstNameNative,
      lastNameNative: candidate.lastNameNative,
      firstNameEn: candidate.firstNameEn,
      lastNameEn: candidate.lastNameEn,
      nickname: candidate.nickname,
      avatar: candidate.avatar,
      avatarUrl: candidate.avatarUrl,
      avatarColor: candidate.avatarColor,
      photo: candidate.photo,
      bio: candidate.bio,
      isVerified: candidate.isVerified,
      slug: candidate.slug,
    } : null,
  };
}

async function createRegistration(userId, data) {
  const locationId = parseInt(data.locationId, 10);
  if (!Number.isInteger(locationId)) {
    throw new ServiceError(400, 'Location is required.');
  }

  const location = await Location.findByPk(locationId);
  if (!location) {
    throw new ServiceError(404, 'Location not found.');
  }

  const positionType = normalizePositionType(data.positionType);
  const electionCycle = cleanString(data.electionCycle, 80) || 'current';

  const existing = await CandidateRegistration.findOne({
    where: { userId, locationId, positionType, electionCycle },
  });
  if (existing && existing.status !== 'archived') {
    throw new ServiceError(409, 'You already registered for this position in this location and election cycle.');
  }

  const payload = {
    userId,
    locationId,
    positionType,
    positionTitle: cleanString(data.positionTitle, 160),
    electionCycle,
    partyName: cleanString(data.partyName, 160),
    isIndependent: Boolean(data.isIndependent),
    slogan: cleanString(data.slogan, 180),
    platform: cleanString(data.platform, 5000),
    websiteUrl: validateUrl(data.websiteUrl),
    contactEmail: cleanString(data.contactEmail, 255),
    status: 'submitted',
  };

  const registration = existing
    ? await existing.update(payload)
    : await CandidateRegistration.create(payload);

  await User.update(
    { role: 'candidate', homeLocationId: locationId, profileVisibility: PROFILE_VISIBILITY.PUBLIC },
    {
      where: {
        id: userId,
        role: { [Op.notIn]: ['admin', 'moderator', 'editor'] },
      },
    }
  );

  return getRegistrationById(registration.id, userId);
}

async function getRegistrationById(id, viewerUserId = null) {
  const registration = await CandidateRegistration.findByPk(id, {
    include: [
      { model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug', 'type'] },
      {
        model: User,
        as: 'candidate',
        attributes: [
          'id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn',
          'nickname', 'avatar', 'avatarUrl', 'avatarColor', 'photo', 'bio', 'isVerified', 'slug',
          'profileVisibility',
        ],
      },
    ],
  });

  if (!registration) throw new ServiceError(404, 'Candidate registration not found.');
  if (registration.status !== 'approved' && registration.userId !== viewerUserId) {
    throw new ServiceError(404, 'Candidate registration not found.');
  }
  return serializeRegistration(registration);
}

async function listRegistrations({
  page = 1,
  limit = 20,
  locationId,
  positionType,
  userId,
  status = 'approved',
  includeDescendants = true,
  viewer = null,
} = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;
  const where = {};
  const isStaff = ['admin', 'moderator'].includes(viewer?.role);

  if (!isStaff) {
    where.status = 'approved';
  } else if (status !== 'all') {
    if (!STATUSES.has(status)) throw new ServiceError(400, 'Invalid candidate registration status.');
    where.status = status;
  }

  if (positionType) {
    where.positionType = normalizePositionType(positionType);
  }

  if (userId) {
    where.userId = parseInt(userId, 10);
  }

  if (locationId) {
    const parsedLocationId = parseInt(locationId, 10);
    if (!Number.isInteger(parsedLocationId)) throw new ServiceError(400, 'Invalid location.');
    where.locationId = includeDescendants === false || includeDescendants === 'false'
      ? parsedLocationId
      : { [Op.in]: await getDescendantLocationIds(parsedLocationId, true) };
  }

  const { count, rows } = await CandidateRegistration.findAndCountAll({
    where,
    distinct: true,
    include: [
      { model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug', 'type'] },
      {
        model: User,
        as: 'candidate',
        required: true,
        where: {
          profileVisibility: { [Op.in]: getDiscoverableVisibilities(Boolean(viewer)) },
          claimStatus: null,
        },
        attributes: [
          'id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn',
          'nickname', 'avatar', 'avatarUrl', 'avatarColor', 'photo', 'bio', 'isVerified', 'slug',
          'profileVisibility',
        ],
      },
    ],
    limit: limitNum,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    registrations: rows.map(serializeRegistration),
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum),
      totalItems: count,
      itemsPerPage: limitNum,
    },
  };
}

async function listMine(userId, query = {}) {
  return listRegistrations({
    ...query,
    userId,
    status: query.status || 'all',
    includeDescendants: false,
    viewer: { id: userId },
  });
}

async function updateRegistration(userId, userRole, id, data) {
  const registration = await CandidateRegistration.findByPk(id);
  if (!registration) throw new ServiceError(404, 'Candidate registration not found.');
  const isOwner = registration.userId === userId;
  const isModerator = ['admin', 'moderator'].includes(userRole);
  if (!isOwner && !isModerator) throw new ServiceError(403, 'You cannot update this candidate registration.');

  const updates = {};
  if (data.locationId !== undefined) {
    const locationId = parseInt(data.locationId, 10);
    if (!Number.isInteger(locationId)) throw new ServiceError(400, 'Invalid location.');
    const location = await Location.findByPk(locationId);
    if (!location) throw new ServiceError(404, 'Location not found.');
    updates.locationId = locationId;
  }
  if (data.positionType !== undefined) updates.positionType = normalizePositionType(data.positionType);
  if (data.positionTitle !== undefined) updates.positionTitle = cleanString(data.positionTitle, 160);
  if (data.electionCycle !== undefined) updates.electionCycle = cleanString(data.electionCycle, 80) || 'current';
  if (data.partyName !== undefined) updates.partyName = cleanString(data.partyName, 160);
  if (data.isIndependent !== undefined) updates.isIndependent = Boolean(data.isIndependent);
  if (data.slogan !== undefined) updates.slogan = cleanString(data.slogan, 180);
  if (data.platform !== undefined) updates.platform = cleanString(data.platform, 5000);
  if (data.websiteUrl !== undefined) updates.websiteUrl = validateUrl(data.websiteUrl);
  if (data.contactEmail !== undefined) updates.contactEmail = cleanString(data.contactEmail, 255);
  if (isModerator && data.status !== undefined) {
    if (!STATUSES.has(data.status)) throw new ServiceError(400, 'Invalid status.');
    updates.status = data.status;
    updates.reviewedByUserId = userId;
    updates.reviewedAt = new Date();
  }

  await registration.update(updates);
  return getRegistrationById(registration.id, userId);
}

async function archiveRegistration(userId, userRole, id) {
  const registration = await CandidateRegistration.findByPk(id);
  if (!registration) throw new ServiceError(404, 'Candidate registration not found.');
  if (registration.userId !== userId && !['admin', 'moderator'].includes(userRole)) {
    throw new ServiceError(403, 'You cannot archive this candidate registration.');
  }
  await registration.update({ status: 'archived' });
  return { archived: true };
}

module.exports = {
  POSITION_TYPES: Array.from(POSITION_TYPES),
  createRegistration,
  getRegistrationById,
  listRegistrations,
  listMine,
  updateRegistration,
  archiveRegistration,
};
