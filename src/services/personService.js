const crypto = require('crypto');
const { Op } = require('sequelize');
const { PublicPersonProfile, User, Location, Endorsement, DreamTeamVote } = require('../models');
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

function generateSlug(firstNameNative, lastNameNative) {
  const fullName = `${firstNameNative} ${lastNameNative}`;
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
    const nextSlug = `${base}-${counter}`;
    const conflict = await PublicPersonProfile.findOne({ where: { slug: nextSlug } });
    if (!conflict) return nextSlug;
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
    attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'],
    required: false
  },
  {
    model: User,
    as: 'createdBy',
    attributes: ['id', 'username'],
    required: false
  }
];

const SAFE_USER_ATTRS = ['id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'avatar', 'email', 'role'];

// ─── Public ──────────────────────────────────────────────────────────────────

async function getPersons({ page = 1, limit = 12, constituencyId, search, claimStatus, position, expertiseArea } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (constituencyId) where.constituencyId = parseInt(constituencyId, 10);
  if (claimStatus && claimStatus !== 'all') where.claimStatus = claimStatus;
  if (search) {
    const isPostgres = dbConfig.getDialect() === 'postgres';
    const likeOp = isPostgres ? Op.iLike : Op.like;
    const sanitizedRaw = sanitizeForLike(search);
    const sanitizedNorm = sanitizeForLike(normalizeGreek(search));
    const conditions = [
      { firstNameNative: { [likeOp]: `%${sanitizedRaw}%` } },
      { lastNameNative: { [likeOp]: `%${sanitizedRaw}%` } },
      { firstNameEn: { [likeOp]: `%${sanitizedRaw}%` } },
      { lastNameEn: { [likeOp]: `%${sanitizedRaw}%` } },
      { nickname: { [likeOp]: `%${sanitizedRaw}%` } },
    ];
    if (sanitizedNorm !== sanitizedRaw) {
      conditions.push(
        { firstNameNative: { [likeOp]: `%${sanitizedNorm}%` } },
        { lastNameNative: { [likeOp]: `%${sanitizedNorm}%` } },
        { firstNameEn: { [likeOp]: `%${sanitizedNorm}%` } },
        { lastNameEn: { [likeOp]: `%${sanitizedNorm}%` } },
        { nickname: { [likeOp]: `%${sanitizedNorm}%` } }
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

  const { firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname, locationId, constituencyId, bio, photo, contactEmail, socialLinks, politicalPositions, manifesto, position, expertiseArea, partyId } = data;
  if (!firstNameNative || !firstNameNative.trim()) throw new ServiceError(400, 'First name is required.');
  if (!lastNameNative || !lastNameNative.trim()) throw new ServiceError(400, 'Last name is required.');

  const validatedExpertiseArea = validateExpertiseArea(expertiseArea);
  const validatedPartyId = validatePartyId(partyId);

  const base = generateSlug(firstNameNative.trim(), lastNameNative.trim());
  const slug = await ensureUniqueSlug(base);

  // Create a placeholder User record for this unclaimed profile so that
  // endorsements, dream-team votes, and search all work via the Users table.
  const placeholderEmail = `unclaimed-${slug}@placeholder.appofasi.gr`;
  const placeholderUsername = `person-${slug}`;
  const placeholderUser = await User.create({
    username: placeholderUsername,
    email: placeholderEmail,
    password: null,
    role: 'viewer',
    isPlaceholder: true,
    searchable: true,
    firstNameNative: firstNameNative.trim(),
    lastNameNative: lastNameNative.trim(),
    firstNameEn: firstNameEn ? firstNameEn.trim() : null,
    lastNameEn: lastNameEn ? lastNameEn.trim() : null,
    nickname: nickname ? nickname.trim() : null,
  });

  const profile = await PublicPersonProfile.create({
    slug,
    firstNameNative: firstNameNative.trim(),
    lastNameNative: lastNameNative.trim(),
    firstNameEn: firstNameEn ? firstNameEn.trim() : null,
    lastNameEn: lastNameEn ? lastNameEn.trim() : null,
    nickname: nickname ? nickname.trim() : null,
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
    claimedByUserId: placeholderUser.id,
    placeholderUserId: placeholderUser.id,
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

  const claimingUserId = profile.claimedByUserId;
  const placeholderUserId = profile.placeholderUserId;

  // Transfer relationships from placeholder user to the claiming user (if a placeholder exists)
  if (placeholderUserId && claimingUserId && placeholderUserId !== claimingUserId) {
    // Transfer endorsements: handle potential unique-constraint conflicts
    const placeholderEndorsements = await Endorsement.findAll({
      where: { endorsedId: placeholderUserId }
    });
    for (const endorsement of placeholderEndorsements) {
      const conflict = await Endorsement.findOne({
        where: { endorserId: endorsement.endorserId, endorsedId: claimingUserId, topic: endorsement.topic }
      });
      if (conflict) {
        await endorsement.destroy();
      } else {
        await endorsement.update({ endorsedId: claimingUserId });
      }
    }

    // Transfer dream-team votes (candidateUserId column)
    await DreamTeamVote.update(
      { candidateUserId: claimingUserId },
      { where: { candidateUserId: placeholderUserId } }
    );

    // Ensure claiming user is searchable
    const claimingUser = await User.findByPk(claimingUserId);
    if (claimingUser) {
      const nameUpdates = { searchable: true };
      if (profile.firstNameNative) nameUpdates.firstNameNative = profile.firstNameNative;
      if (profile.lastNameNative) nameUpdates.lastNameNative = profile.lastNameNative;
      if (profile.firstNameEn) nameUpdates.firstNameEn = profile.firstNameEn;
      if (profile.lastNameEn) nameUpdates.lastNameEn = profile.lastNameEn;
      if (profile.nickname) nameUpdates.nickname = profile.nickname;
      await claimingUser.update(nameUpdates);
    }

    // Delete the placeholder user (all FKs to it have been transferred or will be SET NULL)
    const placeholderUser = await User.findByPk(placeholderUserId);
    if (placeholderUser && placeholderUser.isPlaceholder) {
      await placeholderUser.destroy();
    }
  } else if (claimingUserId) {
    // No placeholder: sync name fields to the claiming user (legacy profiles)
    const claimingUser = await User.findByPk(claimingUserId);
    if (claimingUser) {
      const nameUpdates = {};
      if (profile.firstNameNative) nameUpdates.firstNameNative = profile.firstNameNative;
      if (profile.lastNameNative) nameUpdates.lastNameNative = profile.lastNameNative;
      if (profile.firstNameEn) nameUpdates.firstNameEn = profile.firstNameEn;
      if (profile.lastNameEn) nameUpdates.lastNameEn = profile.lastNameEn;
      if (profile.nickname) nameUpdates.nickname = profile.nickname;
      if (Object.keys(nameUpdates).length > 0) {
        await claimingUser.update(nameUpdates);
      }
    }
  }

  await profile.update({
    claimStatus: 'claimed',
    claimVerifiedAt: new Date(),
    claimVerifiedByUserId: moderatorUserId,
    claimToken: null,
    claimTokenExpiresAt: null,
    placeholderUserId: null,
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

  // Restore claimedByUserId to the placeholder user (if one exists) so the profile
  // remains endorsable and searchable after rejection.
  const restoredClaimedByUserId = profile.placeholderUserId || null;

  await profile.update({
    claimStatus: 'unclaimed',
    claimedByUserId: restoredClaimedByUserId,
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

  const allowedFields = ['firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'locationId', 'bio', 'photo', 'contactEmail', 'socialLinks', 'politicalPositions', 'manifesto', 'position'];
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
