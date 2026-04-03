const crypto = require('crypto');
const { Op } = require('sequelize');
const { PublicPersonProfile, User, Location } = require('../models');
const dbConfig = require('../config/database');
const { normalizeGreek, sanitizeForLike } = require('../utils/greekNormalize');
const { EXPERTISE_AREAS } = require('../constants/expertiseAreas');
const politicalParties = require('../../config/politicalParties.json');

const CLAIM_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const VALID_EXPERTISE_AREAS = new Set(EXPERTISE_AREAS);
const VALID_PARTY_IDS = new Set(politicalParties.parties.map((p) => p.id));

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

// ─── Slug utilities ──────────────────────────────────────────────────────────

function generateSlug(firstName, lastName) {
  const fullName = `${firstName} ${lastName}`;
  return fullName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function ensureUniqueSlug(base) {
  const existing = await PublicPersonProfile.findOne({ where: { slug: base } });
  if (!existing) return base;

  let counter = 2;
  while (true) {
    const slugCandidate = `${base}-${counter}`;
    const conflict = await PublicPersonProfile.findOne({ where: { slug: slugCandidate } });
    if (!conflict) return slugCandidate;
    counter++;
  }
}

// ─── Attribute helpers ───────────────────────────────────────────────────────

const PROFILE_INCLUDE = [
  { model: Location, as: 'location', attributes: ['id', 'name', 'slug'] },
  { model: Location, as: 'constituency', attributes: ['id', 'name', 'slug'] },
  {
    model: User,
    as: 'claimedBy',
    attributes: ['id', 'username', 'firstName', 'lastName', 'avatar'],
    required: false
  },
  {
    model: User,
    as: 'createdBy',
    attributes: ['id', 'username'],
    required: false
  }
];

const SAFE_USER_ATTRS = ['id', 'username', 'firstName', 'lastName', 'avatar', 'email', 'role'];

// ─── Public ──────────────────────────────────────────────────────────────────

async function getPersons({ page = 1, limit = 12, constituencyId, search, claimStatus, position, expertiseArea } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (constituencyId) where.constituencyId = parseInt(constituencyId, 10);
  if (claimStatus) where.claimStatus = claimStatus;
  if (search) {
    const isPostgres = dbConfig.getDialect() === 'postgres';
    const likeOp = isPostgres ? Op.iLike : Op.like;
    const sanitizedRaw = sanitizeForLike(search);
    const sanitizedNorm = sanitizeForLike(normalizeGreek(search));
    const conditions = [
      { firstName: { [likeOp]: `%${sanitizedRaw}%` } },
      { lastName: { [likeOp]: `%${sanitizedRaw}%` } },
    ];
    if (sanitizedNorm !== sanitizedRaw) {
      conditions.push(
        { firstName: { [likeOp]: `%${sanitizedNorm}%` } },
        { lastName: { [likeOp]: `%${sanitizedNorm}%` } }
      );
    }
    where[Op.or] = conditions;
  }
  if (expertiseArea && typeof expertiseArea === 'string') {
    const isPostgres = dbConfig.getDialect() === 'postgres';
    const likeOp = isPostgres ? Op.iLike : Op.like;
    where.expertiseArea = { [likeOp]: `%${expertiseArea.replace(/[%_\\]/g, '\\$&')}%` };
  }

  const { count, rows } = await PublicPersonProfile.findAndCountAll({
    where,
    include: PROFILE_INCLUDE,
    limit: limitNum,
    offset,
    order: [['createdAt', 'DESC']]
  });

  return {
    profiles: rows,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum),
      totalItems: count,
      itemsPerPage: limitNum
    }
  };
}

async function getPersonBySlug(slug) {
  const profile = await PublicPersonProfile.findOne({
    where: { slug },
    include: PROFILE_INCLUDE
  });
  if (!profile) throw new ServiceError(404, 'Person profile not found.');
  return profile;
}

async function getPersonById(id) {
  const profile = await PublicPersonProfile.findByPk(id, {
    include: PROFILE_INCLUDE
  });
  if (!profile) throw new ServiceError(404, 'Person profile not found.');
  return profile;
}

// ─── Expertise area validation helper ────────────────────────────────────────

function validateExpertiseArea(expertiseArea) {
  if (expertiseArea === undefined || expertiseArea === null) return null;
  if (!Array.isArray(expertiseArea)) throw new ServiceError(400, 'Expertise area must be an array.');
  for (const area of expertiseArea) {
    if (typeof area !== 'string') throw new ServiceError(400, 'Each expertise area must be a string.');
    if (!VALID_EXPERTISE_AREAS.has(area)) throw new ServiceError(400, `Invalid expertise area: "${area}".`);
  }
  return expertiseArea.length > 0 ? expertiseArea : null;
}

// ─── Party ID validation helper ──────────────────────────────────────────────

function validatePartyId(partyId) {
  if (partyId === undefined || partyId === null || partyId === '') return null;
  if (!VALID_PARTY_IDS.has(partyId)) throw new ServiceError(400, 'Invalid political party.');
  return partyId;
}

// ─── Path B — Moderator Creates / Claim Flow ─────────────────────────────────

async function createProfile(moderatorUserId, moderatorRole, data) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can create person profiles.');
  }

  const { firstName, lastName, locationId, constituencyId, bio, photo, contactEmail, socialLinks, politicalPositions, manifesto, position, expertiseArea, partyId } = data;
  if (!firstName || !firstName.trim()) throw new ServiceError(400, 'First name is required.');
  if (!lastName || !lastName.trim()) throw new ServiceError(400, 'Last name is required.');

  const validatedExpertiseArea = validateExpertiseArea(expertiseArea);
  const validatedPartyId = validatePartyId(partyId);

  const base = generateSlug(firstName.trim(), lastName.trim());
  const slug = await ensureUniqueSlug(base);

  const profile = await PublicPersonProfile.create({
    slug,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    locationId: locationId || null,
    constituencyId: constituencyId || null,
    bio: bio || null,
    photo: photo || null,
    contactEmail: contactEmail || null,
    socialLinks: socialLinks || null,
    politicalPositions: politicalPositions || null,
    manifesto: manifesto || null,
    position: position || null,
    expertiseArea: validatedExpertiseArea,
    partyId: validatedPartyId,
    claimStatus: 'unclaimed',
    createdByUserId: moderatorUserId,
    source: 'moderator'
  });

  return profile;
}

async function submitClaim(userId, profileId, supportingStatement) {
  if (!supportingStatement || !supportingStatement.trim()) {
    throw new ServiceError(400, 'Supporting statement is required.');
  }

  const profile = await PublicPersonProfile.findByPk(profileId);
  if (!profile) throw new ServiceError(404, 'Person profile not found.');
  if (profile.claimStatus === 'claimed') throw new ServiceError(400, 'This profile has already been claimed.');
  if (profile.claimStatus === 'pending') throw new ServiceError(409, 'A claim is already pending for this profile.');

  const claimToken = crypto.randomBytes(32).toString('hex');
  const claimTokenExpiresAt = new Date(Date.now() + CLAIM_TOKEN_EXPIRY_MS);

  await profile.update({
    claimStatus: 'pending',
    claimedByUserId: userId,
    claimRequestedAt: new Date(),
    claimToken,
    claimTokenExpiresAt
  });

  return profile;
}

async function approveClaim(moderatorUserId, moderatorRole, profileId) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can approve claims.');
  }

  const profile = await PublicPersonProfile.findByPk(profileId);
  if (!profile) throw new ServiceError(404, 'Person profile not found.');
  if (profile.claimStatus !== 'pending') throw new ServiceError(400, 'No pending claim for this profile.');

  await profile.update({
    claimStatus: 'claimed',
    claimVerifiedAt: new Date(),
    claimVerifiedByUserId: moderatorUserId,
    claimToken: null,
    claimTokenExpiresAt: null
  });

  return profile;
}

async function rejectClaim(moderatorUserId, moderatorRole, profileId, reason) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can reject claims.');
  }

  const profile = await PublicPersonProfile.findByPk(profileId);
  if (!profile) throw new ServiceError(404, 'Person profile not found.');
  if (profile.claimStatus !== 'pending') throw new ServiceError(400, 'No pending claim for this profile.');

  await profile.update({
    claimStatus: 'rejected',
    claimedByUserId: null,
    claimRequestedAt: null,
    claimToken: null,
    claimTokenExpiresAt: null
  });

  return profile;
}

async function updateProfile(requestingUserId, requestingRole, profileId, data) {
  const profile = await PublicPersonProfile.findByPk(profileId);
  if (!profile) throw new ServiceError(404, 'Person profile not found.');

  const isOwner = profile.claimedByUserId === requestingUserId;
  const isModerator = ['admin', 'moderator'].includes(requestingRole);

  if (!isOwner && !isModerator) {
    throw new ServiceError(403, 'You do not have permission to update this profile.');
  }

  const allowedFields = ['firstName', 'lastName', 'locationId', 'bio', 'photo', 'contactEmail', 'socialLinks', 'politicalPositions', 'manifesto', 'position'];
  if (isModerator) allowedFields.push('constituencyId', 'claimStatus', 'slug');

  const updates = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updates[field] = data[field];
  });

  if (data.expertiseArea !== undefined) {
    updates.expertiseArea = validateExpertiseArea(data.expertiseArea);
  }

  if (data.partyId !== undefined) {
    updates.partyId = validatePartyId(data.partyId);
  }

  await profile.update(updates);
  return profile;
}

async function deleteProfile(requestingUserId, requestingRole, profileId) {
  if (!['admin', 'moderator'].includes(requestingRole)) {
    throw new ServiceError(403, 'Only admins and moderators can delete person profiles.');
  }

  const profile = await PublicPersonProfile.findByPk(profileId);
  if (!profile) throw new ServiceError(404, 'Person profile not found.');

  if (requestingRole === 'moderator' && profile.claimStatus !== 'unclaimed') {
    throw new ServiceError(403, 'Moderators can only delete unclaimed profiles.');
  }

  await profile.destroy();
  return { deleted: true };
}

// ─── Moderator Review ────────────────────────────────────────────────────────

async function getPendingClaims(moderatorUserId, moderatorRole, { page = 1, limit = 20 } = {}) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can view pending claims.');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await PublicPersonProfile.findAndCountAll({
    where: { claimStatus: 'pending' },
    include: [
      { model: User, as: 'claimedBy', attributes: SAFE_USER_ATTRS },
      { model: Location, as: 'constituency', attributes: ['id', 'name', 'slug'] }
    ],
    limit: limitNum,
    offset,
    order: [['claimRequestedAt', 'ASC']]
  });

  return {
    profiles: rows,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum),
      totalItems: count,
      itemsPerPage: limitNum
    }
  };
}

module.exports = {
  getPersons,
  getPersonBySlug,
  getPersonById,
  createProfile,
  submitClaim,
  approveClaim,
  rejectClaim,
  updateProfile,
  deleteProfile,
  getPendingClaims,
  // Export for testing
  generateSlug
};
