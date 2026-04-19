'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Location, Endorsement, DreamTeamVote, LocationRole, GovernmentCurrentHolder, GovernmentPositionSuggestion, FormationPick } = require('../models');
const dbConfig = require('../config/database');
const { normalizeGreek, sanitizeForLike, transliterateGreek } = require('../utils/greekNormalize');
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
  return transliterateGreek(fullName)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function ensureUniqueSlug(base) {
  const existing = await User.findOne({ where: { slug: base } });
  if (!existing) return base;

  let counter = 2;
  while (true) {
    const nextSlug = `${base}-${counter}`;
    const conflict = await User.findOne({ where: { slug: nextSlug } });
    if (!conflict) return nextSlug;
    counter++;
  }
}

// ─── Attribute helpers ───────────────────────────────────────────────────────

const PROFILE_INCLUDE = [
  { model: Location, as: 'homeLocation', attributes: ['id', 'name', 'slug', 'type', 'parent_id'] },
  { model: Location, as: 'constituency', attributes: ['id', 'name', 'slug'] },
  {
    model: User,
    as: 'claimedBy',
    attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar'],
    required: false
  },
  {
    model: User,
    as: 'createdByModerator',
    attributes: ['id', 'username'],
    required: false
  }
];

const SAFE_USER_ATTRS = [
  'id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn',
  'nickname', 'avatar', 'email', 'role', 'claimStatus', 'slug'
];

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

// ─── Where clause for name search ────────────────────────────────────────────

function buildNameSearchWhere(search) {
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
  return { [Op.or]: conditions };
}

// ─── Public read ─────────────────────────────────────────────────────────────

async function getPersons({ page = 1, limit = 12, constituencyId, search, claimStatus, expertiseArea } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (pageNum - 1) * limitNum;

  // Only public person profiles (claimStatus IS NOT NULL)
  const where = { claimStatus: { [Op.ne]: null } };
  if (constituencyId) where.constituencyId = parseInt(constituencyId, 10);
  if (claimStatus && claimStatus !== 'all') where.claimStatus = claimStatus;
  if (search) Object.assign(where, buildNameSearchWhere(search));
  if (expertiseArea && typeof expertiseArea === 'string') {
    const isPostgres = dbConfig.getDialect() === 'postgres';
    const likeOp = isPostgres ? Op.iLike : Op.like;
    where.expertiseArea = { [likeOp]: `%${expertiseArea.replace(/[%_\\]/g, '\\$&')}%` };
  }

  const { count, rows } = await User.findAndCountAll({
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
  const profile = await User.findOne({
    where: { slug, claimStatus: { [Op.ne]: null } },
    include: PROFILE_INCLUDE
  });
  if (!profile) throw new ServiceError(404, 'Person profile not found.');
  return profile;
}

async function getPersonById(id) {
  const profile = await User.findByPk(id, {
    include: PROFILE_INCLUDE
  });
  if (!profile || profile.claimStatus === null) throw new ServiceError(404, 'Person profile not found.');
  return profile;
}

// ─── Moderator creates unclaimed profile ─────────────────────────────────────

async function createProfile(moderatorUserId, moderatorRole, data) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can create person profiles.');
  }

  const {
    firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname,
    locationId, constituencyId, bio, photo, contactEmail, socialLinks,
    politicalPositions, manifesto, expertiseArea, partyId, nationality, countryCode
  } = data;

  if (!firstNameNative || !firstNameNative.trim()) throw new ServiceError(400, 'First name is required.');
  if (!lastNameNative || !lastNameNative.trim()) throw new ServiceError(400, 'Last name is required.');

  const validatedExpertiseArea = validateExpertiseArea(expertiseArea);
  const validatedPartyId = validatePartyId(partyId);

  const base = generateSlug(firstNameNative.trim(), lastNameNative.trim());
  const slug = await ensureUniqueSlug(base);

  const profile = await User.create({
    username: null,
    email: null,
    password: null,
    role: 'viewer',
    searchable: true,
    claimStatus: 'unclaimed',
    createdByUserId: moderatorUserId,
    claimedByUserId: null,
    slug,
    firstNameNative: firstNameNative.trim(),
    lastNameNative: lastNameNative.trim(),
    firstNameEn: firstNameEn ? firstNameEn.trim() : null,
    lastNameEn: lastNameEn ? lastNameEn.trim() : null,
    nickname: nickname ? nickname.trim() : null,
    homeLocationId: locationId || null,
    constituencyId: constituencyId || null,
    bio: bio || null,
    photo: photo || null,
    contactEmail: contactEmail || null,
    socialLinks: socialLinks || null,
    politicalPositions: politicalPositions || null,
    manifesto: manifesto || null,
    expertiseArea: validatedExpertiseArea,
    partyId: validatedPartyId,
    nationality: nationality || null,
    countryCode: countryCode ? countryCode.toUpperCase() : null,
    source: 'moderator'
  });

  return profile;
}

// ─── Claim flow ───────────────────────────────────────────────────────────────

async function submitClaim(userId, profileId, supportingStatement) {
  if (!supportingStatement || !supportingStatement.trim()) {
    throw new ServiceError(400, 'Supporting statement is required.');
  }

  const profile = await User.findByPk(profileId);
  if (!profile || profile.claimStatus === null) throw new ServiceError(404, 'Person profile not found.');
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

  // profileId is the unclaimed User row
  const unclaimedProfile = await User.findByPk(profileId);
  if (!unclaimedProfile || unclaimedProfile.claimStatus === null) {
    throw new ServiceError(404, 'Person profile not found.');
  }
  if (unclaimedProfile.claimStatus !== 'pending') {
    throw new ServiceError(400, 'No pending claim for this profile.');
  }

  const claimingUserId = unclaimedProfile.claimedByUserId;
  const claimingUser = claimingUserId ? await User.findByPk(claimingUserId) : null;

  // Transfer all FK references from unclaimed profile → real claiming user
  if (claimingUser && claimingUser.claimStatus === null) {
    // Transfer endorsements received by the unclaimed profile
    const [profileEndorsements, existingClaimingEndorsements] = await Promise.all([
      Endorsement.findAll({ where: { endorsedId: profileId } }),
      Endorsement.findAll({ where: { endorsedId: claimingUserId } })
    ]);
    const existingKey = new Set(
      existingClaimingEndorsements.map((e) => `${e.endorserId}:${e.topic}`)
    );
    const toDestroy = [];
    const toUpdate = [];
    for (const endorsement of profileEndorsements) {
      const key = `${endorsement.endorserId}:${endorsement.topic}`;
      if (existingKey.has(key)) {
        toDestroy.push(endorsement.id);
      } else {
        toUpdate.push(endorsement.id);
      }
    }
    if (toDestroy.length > 0) {
      await Endorsement.destroy({ where: { id: { [Op.in]: toDestroy } } });
    }
    if (toUpdate.length > 0) {
      await Endorsement.update({ endorsedId: claimingUserId }, { where: { id: { [Op.in]: toUpdate } } });
    }

    // Transfer dream-team votes
    await DreamTeamVote.update(
      { candidateUserId: claimingUserId },
      { where: { candidateUserId: profileId } }
    );

    // Transfer location roles
    await LocationRole.update(
      { userId: claimingUserId },
      { where: { userId: profileId } }
    );

    // Transfer government holders
    await GovernmentCurrentHolder.update(
      { userId: claimingUserId },
      { where: { userId: profileId } }
    );

    // Transfer government suggestions
    await GovernmentPositionSuggestion.update(
      { userId: claimingUserId },
      { where: { userId: profileId } }
    );

    // Transfer formation picks
    await FormationPick.update(
      { candidateUserId: claimingUserId },
      { where: { candidateUserId: profileId } }
    );

    // Sync name fields to claiming user if not already set
    const nameUpdates = { searchable: true };
    if (!claimingUser.firstNameNative && unclaimedProfile.firstNameNative) nameUpdates.firstNameNative = unclaimedProfile.firstNameNative;
    if (!claimingUser.lastNameNative && unclaimedProfile.lastNameNative) nameUpdates.lastNameNative = unclaimedProfile.lastNameNative;
    if (!claimingUser.firstNameEn && unclaimedProfile.firstNameEn) nameUpdates.firstNameEn = unclaimedProfile.firstNameEn;
    if (!claimingUser.lastNameEn && unclaimedProfile.lastNameEn) nameUpdates.lastNameEn = unclaimedProfile.lastNameEn;
    if (!claimingUser.nickname && unclaimedProfile.nickname) nameUpdates.nickname = unclaimedProfile.nickname;
    await claimingUser.update(nameUpdates);

    // Delete the unclaimed User row (all its FKs have been transferred)
    await unclaimedProfile.destroy();
  } else {
    // No valid claiming user found — just mark as claimed
    await unclaimedProfile.update({
      claimStatus: 'claimed',
      claimVerifiedAt: new Date(),
      claimVerifiedByUserId: moderatorUserId,
      claimToken: null,
      claimTokenExpiresAt: null
    });
  }

  return claimingUser || unclaimedProfile;
}

async function rejectClaim(moderatorUserId, moderatorRole, profileId, _reason) {
  if (!['admin', 'moderator'].includes(moderatorRole)) {
    throw new ServiceError(403, 'Only admins and moderators can reject claims.');
  }

  const profile = await User.findByPk(profileId);
  if (!profile || profile.claimStatus === null) throw new ServiceError(404, 'Person profile not found.');
  if (profile.claimStatus !== 'pending') throw new ServiceError(400, 'No pending claim for this profile.');

  await profile.update({
    claimStatus: 'unclaimed',
    claimedByUserId: null,
    claimRequestedAt: null,
    claimToken: null,
    claimTokenExpiresAt: null
  });

  return profile;
}

// ─── Update / Delete ──────────────────────────────────────────────────────────

async function updateProfile(requestingUserId, requestingRole, profileId, data) {
  const profile = await User.findByPk(profileId);
  if (!profile || profile.claimStatus === null) throw new ServiceError(404, 'Person profile not found.');

  const isOwner = profile.claimedByUserId === requestingUserId;
  const isModerator = ['admin', 'moderator'].includes(requestingRole);

  if (!isOwner && !isModerator) {
    throw new ServiceError(403, 'You do not have permission to update this profile.');
  }

  const allowedFields = [
    'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname',
    'homeLocationId', 'bio', 'photo', 'contactEmail', 'socialLinks',
    'politicalPositions', 'manifesto', 'nationality'
  ];
  if (isModerator) {
    allowedFields.push('constituencyId', 'claimStatus', 'slug', 'countryCode');
  }

  const updates = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updates[field] = data[field];
  });
  // Support 'locationId' as alias for 'homeLocationId'
  if (data.locationId !== undefined) updates.homeLocationId = data.locationId;

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

  const profile = await User.findByPk(profileId);
  if (!profile || profile.claimStatus === null) throw new ServiceError(404, 'Person profile not found.');

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

  const { count, rows } = await User.findAndCountAll({
    where: { claimStatus: 'pending' },
    include: [
      { model: User, as: 'claimedBy', attributes: SAFE_USER_ATTRS, required: false },
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

// ─── Search ───────────────────────────────────────────────────────────────────

async function searchPersons(search, limit = 8) {
  if (!search || !search.trim()) return [];

  const where = {
    claimStatus: { [Op.ne]: null },
    ...buildNameSearchWhere(search)
  };

  const users = await User.findAll({
    where,
    attributes: ['id', 'slug', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'photo', 'avatar', 'claimStatus'],
    limit: Math.min(50, limit),
    order: [['firstNameNative', 'ASC']]
  });

  return users;
}

async function unifiedSearch(search, limit = 8) {
  const lim = Math.min(50, parseInt(limit, 10) || 8);

  // 1. Search real users (claimStatus IS NULL)
  let realUsers = [];
  if (search && search.trim()) {
    const nameWhere = buildNameSearchWhere(search);
    realUsers = await User.findAll({
      where: { searchable: true, claimStatus: null, ...nameWhere },
      attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'avatar', 'avatarColor', 'isVerified', 'claimStatus'],
      limit: lim
    });
  } else {
    realUsers = await User.findAll({
      where: { searchable: true, claimStatus: null },
      attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'avatar', 'avatarColor', 'isVerified', 'claimStatus'],
      limit: lim,
      order: [['createdAt', 'DESC']]
    });
  }

  // 2. Search person profiles (claimStatus IS NOT NULL)
  let persons = [];
  if (search && search.trim()) {
    const nameWhere = buildNameSearchWhere(search);
    persons = await User.findAll({
      where: { claimStatus: { [Op.ne]: null }, ...nameWhere },
      attributes: ['id', 'slug', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'photo', 'avatar', 'claimStatus', 'claimedByUserId'],
      limit: lim
    });
  }

  // 3. Merge: if a person profile has claimedByUserId matching a real user in results,
  //    show only the profile (use profile photo) and remove the real user from results.
  const claimedByUserIds = new Set(
    persons.filter((p) => p.claimedByUserId).map((p) => p.claimedByUserId)
  );
  const filteredRealUsers = realUsers.filter((u) => !claimedByUserIds.has(u.id));

  const personResults = persons.map((p) => ({
    ...p.toJSON(),
    entityType: 'person',
    displayPhoto: p.photo || p.avatar || null
  }));

  const userResults = filteredRealUsers.map((u) => ({
    ...u.toJSON(),
    entityType: 'user',
    displayPhoto: u.avatar || null
  }));

  return [...personResults, ...userResults];
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
  searchPersons,
  unifiedSearch,
  // Export for testing
  generateSlug
};
