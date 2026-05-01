const { Op } = require('sequelize');
const { User, Location, LocationLink, Article, Poll, PollOption, PollVote, Bookmark, Follow, sequelize, UserLocationRole } = require('../models');
const {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeInteger,
  normalizePassword
} = require('../utils/validators');
const { getDescendantLocationIds, getAncestorLocationIds, getManageableLocationIdsFromAssignments } = require('../utils/locationUtils');
const dbConfig = require('../config/database');
const { normalizeGreek, sanitizeForLike } = require('../utils/greekNormalize');
const {
  normalizeLegacyProfession,
  normalizeProfessions,
  validateProfessionalIdentity,
  validateExpertiseTagIds,
  normalizeExpertiseTags,
} = require('../utils/professionTaxonomy');
const politicalParties = require('../../config/politicalParties.json');

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;
const NAME_MAX_LENGTH = 100;
const MOBILE_TEL_MAX_LENGTH = 30;
const BIO_MAX_LENGTH = 280;
const PASSWORD_MIN_LENGTH = 6;
const VALID_HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/;
const ALLOWED_SOCIAL_KEYS = new Set(['website', 'x', 'twitter', 'instagram', 'facebook', 'linkedin', 'github', 'youtube', 'tiktok']);
const VALID_PARTY_IDS = new Set(politicalParties.parties.map((p) => p.id));
const MAX_PROFESSIONS = 5;
const MAX_INTERESTS = 10;
const MAX_EXPERTISE_AREAS = 5;
const DAYS_PER_YEAR = 365.25;

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ServiceError';
  }
}

async function buildUserStats() {
  const totalUsers = await User.count();
  const roles = ['admin', 'moderator', 'editor', 'viewer'];
  const counts = await User.findAll({
    attributes: [
      'role',
      [sequelize.fn('COUNT', sequelize.col('role')), 'count']
    ],
    group: ['role']
  });
  const byRole = roles.reduce((acc, role) => {
    acc[role] = 0;
    return acc;
  }, {});
  counts.forEach((item) => {
    const role = item.get('role');
    if (byRole[role] !== undefined) {
      byRole[role] = parseInt(item.get('count'), 10);
    }
  });

  return { total: totalUsers, byRole };
}

function buildUserStatsFromList(users = []) {
  const byRole = { admin: 0, moderator: 0, editor: 0, viewer: 0 };
  users.forEach((user) => {
    if (byRole[user.role] !== undefined) {
      byRole[user.role] += 1;
    }
  });
  return { total: users.length, byRole };
}

/**
 * Get all location IDs that a moderator is allowed to manage.
 * This is the union of all their assigned locations plus their descendants.
 * @param {number} moderatorUserId
 * @returns {Promise<number[]>}
 */
async function getModeratorScopeLocationIds(moderatorUserId) {
  const assignments = await UserLocationRole.findAll({
    where: { userId: moderatorUserId, roleKey: 'moderator' },
    attributes: ['locationId'],
  });
  return getManageableLocationIdsFromAssignments(assignments);
}

async function getUserStatsForModeratorScope(moderatorUserId) {
  const manageableLocationIds = await getModeratorScopeLocationIds(moderatorUserId);
  if (manageableLocationIds.length === 0) {
    return { total: 0, byRole: { admin: 0, moderator: 0, editor: 0, viewer: 0 } };
  }

  const users = await User.findAll({
    where: { homeLocationId: { [Op.in]: manageableLocationIds } },
    attributes: ['id', 'role']
  });

  return buildUserStatsFromList(users);
}

async function getUserProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Location,
        as: 'homeLocation',
        attributes: ['id', 'name', 'type', 'slug'],
        include: [
          {
            model: Location,
            as: 'parent',
            attributes: ['id', 'name', 'type', 'slug'],
            include: [
              {
                model: Location,
                as: 'parent',
                attributes: ['id', 'name', 'type', 'slug'],
                include: [
                  {
                    model: Location,
                    as: 'parent',
                    attributes: ['id', 'name', 'type', 'slug']
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  });

  if (!user) throw new ServiceError(404, 'User not found.');

  const userJson = user.toJSON();
  const rawUser = await User.findByPk(userId, { attributes: ['password'] });
  userJson.hasPassword = !!(rawUser && rawUser.password);

  return userJson;
}

async function updateUserProfile(userId, data) {
  const { username, firstNameNative, lastNameNative, firstNameEn, lastNameEn, nickname, avatar, avatarColor, homeLocationId, searchable, mobileTel, bio, socialLinks, dateOfBirth, professions, interests, expertiseArea, partyId, nationality, twitchChannel } = data;

  const user = await User.findByPk(userId);
  if (!user) throw new ServiceError(404, 'User not found.');

  if (username !== undefined) {
    const usernameResult = normalizeRequiredText(username, 'Username', USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH);
    if (usernameResult.error) throw new ServiceError(400, usernameResult.error);

    if (usernameResult.value !== user.username) {
      const existingUser = await User.findOne({
        where: { username: usernameResult.value, id: { [Op.ne]: user.id } }
      });
      if (existingUser) throw new ServiceError(400, 'Username is already taken.');
      user.username = usernameResult.value;
    }
  }

  const firstNameNativeResult = normalizeOptionalText(firstNameNative, 'First name', undefined, NAME_MAX_LENGTH);
  if (firstNameNativeResult.error) throw new ServiceError(400, firstNameNativeResult.error);
  if (firstNameNativeResult.value !== undefined) user.firstNameNative = firstNameNativeResult.value;

  const lastNameNativeResult = normalizeOptionalText(lastNameNative, 'Last name', undefined, NAME_MAX_LENGTH);
  if (lastNameNativeResult.error) throw new ServiceError(400, lastNameNativeResult.error);
  if (lastNameNativeResult.value !== undefined) user.lastNameNative = lastNameNativeResult.value;

  const firstNameEnResult = normalizeOptionalText(firstNameEn, 'First name (English)', undefined, NAME_MAX_LENGTH);
  if (firstNameEnResult.error) throw new ServiceError(400, firstNameEnResult.error);
  if (firstNameEnResult.value !== undefined) user.firstNameEn = firstNameEnResult.value;

  const lastNameEnResult = normalizeOptionalText(lastNameEn, 'Last name (English)', undefined, NAME_MAX_LENGTH);
  if (lastNameEnResult.error) throw new ServiceError(400, lastNameEnResult.error);
  if (lastNameEnResult.value !== undefined) user.lastNameEn = lastNameEnResult.value;

  const nicknameResult = normalizeOptionalText(nickname, 'Nickname', undefined, NAME_MAX_LENGTH);
  if (nicknameResult.error) throw new ServiceError(400, nicknameResult.error);
  if (nicknameResult.value !== undefined) user.nickname = nicknameResult.value;

  if (avatar !== undefined) {
    if (avatar === null) {
      user.avatar = null;
    } else if (typeof avatar === 'string') {
      const trimmedAvatar = avatar.trim();
      if (trimmedAvatar.length === 0) {
        user.avatar = null;
      } else if (trimmedAvatar.startsWith('/uploads/')) {
        // Allow server-generated upload paths (set by the avatar upload endpoint)
        user.avatar = trimmedAvatar;
      } else {
        let avatarUrl;
        try {
          avatarUrl = new URL(trimmedAvatar);
        } catch {
          throw new ServiceError(400, 'Avatar URL is malformed.');
        }
        if (!['http:', 'https:'].includes(avatarUrl.protocol)) {
          throw new ServiceError(400, 'Avatar URL must use HTTP or HTTPS protocol.');
        }
        user.avatar = trimmedAvatar;
      }
    } else {
      throw new ServiceError(400, 'Avatar must be a string.');
    }
  }

  if (avatarColor !== undefined) {
    if (avatarColor === null) {
      user.avatarColor = null;
    } else if (typeof avatarColor === 'string') {
      const trimmedColor = avatarColor.trim();
      if (trimmedColor.length === 0) {
        user.avatarColor = null;
      } else if (!VALID_HEX_COLOR_REGEX.test(trimmedColor)) {
        throw new ServiceError(400, 'Avatar color must be a valid hex color (#RGB or #RRGGBB).');
      } else {
        user.avatarColor = trimmedColor;
      }
    } else {
      throw new ServiceError(400, 'Avatar color must be a string.');
    }
  }

  if (homeLocationId !== undefined) {
    if (homeLocationId === null) {
      if (user.homeLocationId !== null) {
        await LocationLink.destroy({
          where: {
            entity_type: 'user',
            entity_id: user.id,
            location_id: user.homeLocationId
          }
        });
      }
      user.homeLocationId = null;
    } else {
      const locationId = parseInt(homeLocationId);
      if (isNaN(locationId)) throw new ServiceError(400, 'Home location ID must be a number.');

      const location = await Location.findByPk(locationId);
      if (!location) throw new ServiceError(404, 'Location not found.');

      user.homeLocationId = locationId;

      const [link, created] = await LocationLink.findOrCreate({
        where: { entity_type: 'user', entity_id: user.id },
        defaults: { location_id: locationId }
      });

      if (!created && link.location_id !== locationId) {
        link.location_id = locationId;
        await link.save();
      }
    }
  }

  if (searchable !== undefined) {
    if (typeof searchable !== 'boolean') throw new ServiceError(400, 'Searchable must be a boolean.');
    user.searchable = searchable;
  }

  if (mobileTel !== undefined) {
    if (mobileTel === null || mobileTel === '') {
      user.mobileTel = null;
    } else if (typeof mobileTel !== 'string') {
      throw new ServiceError(400, 'Mobile phone must be a string.');
    } else {
      const trimmed = mobileTel.trim();
      if (trimmed.length > MOBILE_TEL_MAX_LENGTH) {
        throw new ServiceError(400, `Mobile phone must be at most ${MOBILE_TEL_MAX_LENGTH} characters.`);
      }
      user.mobileTel = trimmed || null;
    }
  }

  if (bio !== undefined) {
    if (bio === null || bio === '') {
      user.bio = null;
    } else if (typeof bio !== 'string') {
      throw new ServiceError(400, 'Bio must be a string.');
    } else {
      const trimmed = bio.trim();
      if (trimmed.length > BIO_MAX_LENGTH) {
        throw new ServiceError(400, `Bio must be at most ${BIO_MAX_LENGTH} characters.`);
      }
      user.bio = trimmed || null;
    }
  }

  if (socialLinks !== undefined) {
    if (socialLinks === null) {
      user.socialLinks = null;
    } else if (typeof socialLinks !== 'object' || Array.isArray(socialLinks)) {
      throw new ServiceError(400, 'Social links must be an object.');
    } else {
      const sanitized = {};
      for (const [key, val] of Object.entries(socialLinks)) {
        if (!ALLOWED_SOCIAL_KEYS.has(key)) {
          throw new ServiceError(400, `Unknown social link key: ${key}.`);
        }
        if (val === null || val === '') continue;
        if (typeof val !== 'string') {
          throw new ServiceError(400, `Social link value for "${key}" must be a string.`);
        }
        let parsedUrl;
        try {
          parsedUrl = new URL(val.trim());
        } catch {
          throw new ServiceError(400, `Social link "${key}" is not a valid URL.`);
        }
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new ServiceError(400, `Social link "${key}" must use HTTP or HTTPS.`);
        }
        sanitized[key] = val.trim();
      }
      user.socialLinks = Object.keys(sanitized).length > 0 ? sanitized : null;
    }
  }

  if (dateOfBirth !== undefined) {
    if (dateOfBirth === null || dateOfBirth === '') {
      user.dateOfBirth = null;
    } else {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new ServiceError(400, 'Date of birth is not a valid date.');
      }
      const ageDiff = Date.now() - dob.getTime();
      const ageYears = Math.floor(ageDiff / (1000 * 60 * 60 * 24 * DAYS_PER_YEAR));
      if (ageYears < 13) {
        throw new ServiceError(400, 'You must be at least 13 years old.');
      }
      if (ageYears > 120) {
        throw new ServiceError(400, 'Date of birth indicates an age over 120 years, which is not valid.');
      }
      user.dateOfBirth = dateOfBirth;
    }
  }

  if (professions !== undefined) {
    if (professions === null) {
      user.professions = null;
    } else if (!Array.isArray(professions)) {
      throw new ServiceError(400, 'Professions must be an array.');
    } else if (professions.length > MAX_PROFESSIONS) {
      throw new ServiceError(400, `You can add at most ${MAX_PROFESSIONS} professions.`);
    } else {
      // Normalize legacy entries to canonical format before validation
      const normalized = normalizeProfessions(professions);
      try {
        const validated = normalized.map(validateProfessionalIdentity);
        user.professions = validated.length > 0 ? validated : null;
      } catch (err) {
        throw new ServiceError(400, err.message);
      }
    }
  }

  if (interests !== undefined) {
    if (interests === null) {
      user.interests = null;
    } else if (!Array.isArray(interests)) {
      throw new ServiceError(400, 'Interests must be an array.');
    } else if (interests.length > MAX_INTERESTS) {
      throw new ServiceError(400, `You can add at most ${MAX_INTERESTS} interests.`);
    } else {
      for (const item of interests) {
        if (!item || typeof item !== 'object') throw new ServiceError(400, 'Each interest must be an object.');
        if (!item.categoryId || typeof item.categoryId !== 'string') throw new ServiceError(400, 'Each interest must have a categoryId.');
        if (!item.interestId || typeof item.interestId !== 'string') throw new ServiceError(400, 'Each interest must have an interestId.');
      }
      user.interests = interests.length > 0 ? interests : null;
    }
  }

  if (expertiseArea !== undefined) {
    if (expertiseArea === null) {
      user.expertiseArea = null;
    } else if (!Array.isArray(expertiseArea)) {
      throw new ServiceError(400, 'Expertise area must be an array.');
    } else if (expertiseArea.length > MAX_EXPERTISE_AREAS) {
      throw new ServiceError(400, `You can add at most ${MAX_EXPERTISE_AREAS} expertise areas.`);
    } else {
      // Normalize legacy string labels to tag IDs before validation
      const normalized = normalizeExpertiseTags(expertiseArea);
      try {
        const validated = validateExpertiseTagIds(normalized);
        user.expertiseArea = validated.length > 0 ? validated : null;
      } catch (err) {
        throw new ServiceError(400, err.message);
      }
    }
  }

  if (partyId !== undefined) {
    if (partyId === null || partyId === '') {
      user.partyId = null;
    } else if (!VALID_PARTY_IDS.has(partyId)) {
      throw new ServiceError(400, 'Invalid political party.');
    } else {
      user.partyId = partyId;
    }
  }

  if (nationality !== undefined) {
    if (nationality === null || nationality === '') {
      user.nationality = null;
    } else {
      const trimmed = String(nationality).trim().toUpperCase();
      if (trimmed.length > 5) {
        throw new ServiceError(400, 'Nationality code must be at most 5 characters.');
      }
      user.nationality = trimmed || null;
    }
  }

  if (twitchChannel !== undefined) {
    const isEligible = user.isVerified === true || ['admin', 'moderator', 'editor'].includes(user.role);
    if (!isEligible) {
      throw new ServiceError(403, 'Only verified users or privileged roles can set a Twitch channel.');
    }
    if (twitchChannel === null || twitchChannel === '') {
      user.twitchChannel = null;
    } else if (typeof twitchChannel !== 'string') {
      throw new ServiceError(400, 'Twitch channel must be a string.');
    } else {
      const trimmed = twitchChannel.trim();
      if (!/^[a-zA-Z0-9_]{1,50}$/.test(trimmed)) {
        throw new ServiceError(400, 'Twitch channel name may only contain letters, numbers, and underscores (max 50 characters).');
      }
      user.twitchChannel = trimmed;
    }
  }

  await user.save();

  const updatedUser = await User.findByPk(user.id, {
    attributes: { exclude: ['password'] }
  });

  return updatedUser;
}

async function deleteUserAccount(userId, password, mode) {
  if (!mode || !['purge', 'anonymize'].includes(mode)) {
    throw new ServiceError(400, 'Invalid mode. Must be "purge" or "anonymize".');
  }

  const user = await User.findByPk(userId);
  if (!user) throw new ServiceError(404, 'User not found.');

  if (user.password) {
    const passwordResult = normalizePassword(password, 'Password', PASSWORD_MIN_LENGTH);
    if (passwordResult.error) throw new ServiceError(400, passwordResult.error);

    const isValidPassword = await user.comparePassword(passwordResult.value);
    if (!isValidPassword) throw new ServiceError(400, 'Incorrect password.');
  }

  if (mode === 'purge') {
    await sequelize.transaction(async (t) => {
      await Follow.destroy({
        where: { [Op.or]: [{ followerId: user.id }, { followingId: user.id }] },
        transaction: t
      });
      await Bookmark.destroy({ where: { userId: user.id }, transaction: t });
      await PollVote.destroy({ where: { userId: user.id }, transaction: t });
      await Article.destroy({ where: { authorId: user.id }, transaction: t });
      const userPolls = await Poll.findAll({ where: { creatorId: user.id }, attributes: ['id'], transaction: t });
      if (userPolls.length > 0) {
        const pollIds = userPolls.map((p) => p.id);
        await PollVote.destroy({ where: { pollId: pollIds }, transaction: t });
        await PollOption.destroy({ where: { pollId: pollIds }, transaction: t });
        await Poll.destroy({ where: { creatorId: user.id }, transaction: t });
      }
      await user.destroy({ transaction: t });
    });
  } else {
    const anonymousId = `deleted-user-${user.id}`;
    await User.update({
      username: anonymousId,
      email: `${anonymousId}@deleted.invalid`,
      password: null,
      role: 'viewer',
      firstNameNative: null,
      lastNameNative: null,
      firstNameEn: null,
      lastNameEn: null,
      nickname: null,
      avatar: null,
      avatarColor: null,
      homeLocationId: null,
      searchable: false,
      githubId: null,
      githubAccessToken: null,
      googleId: null,
      googleAccessToken: null,
      professions: null,
      interests: null,
      dateOfBirth: null,
      partyId: null
    }, { where: { id: user.id }, individualHooks: false });
  }
}

async function adminDeleteUser(actorId, actorRole, targetId) {
  if (actorRole !== 'admin') {
    throw new ServiceError(403, 'Only admins can delete users.');
  }

  if (actorId === targetId) {
    throw new ServiceError(400, 'You cannot delete your own account using this action.');
  }

  const target = await User.findByPk(targetId);
  if (!target) throw new ServiceError(404, 'User not found.');

  if (target.role === 'admin') {
    throw new ServiceError(403, 'Cannot delete another admin.');
  }

  if (target.claimStatus !== null) {
    throw new ServiceError(400, 'Cannot delete person profiles here. Use the person profiles admin instead.');
  }

  await sequelize.transaction(async (t) => {
    await Follow.destroy({
      where: { [Op.or]: [{ followerId: target.id }, { followingId: target.id }] },
      transaction: t
    });
    await Bookmark.destroy({ where: { userId: target.id }, transaction: t });
    await PollVote.destroy({ where: { userId: target.id }, transaction: t });
    await Article.destroy({ where: { authorId: target.id }, transaction: t });
    const userPolls = await Poll.findAll({ where: { creatorId: target.id }, attributes: ['id'], transaction: t });
    if (userPolls.length > 0) {
      const pollIds = userPolls.map((p) => p.id);
      await PollVote.destroy({ where: { pollId: pollIds }, transaction: t });
      await PollOption.destroy({ where: { pollId: pollIds }, transaction: t });
      await Poll.destroy({ where: { creatorId: target.id }, transaction: t });
    }
    await target.destroy({ transaction: t });
  });
}

async function getUsers(actorId, actorRole) {
  const baseQuery = {
    attributes: ['id', 'username', 'email', 'role', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'homeLocationId', 'createdAt', 'isVerified', 'claimStatus'],
    include: [
      {
        model: Location,
        as: 'homeLocation',
        attributes: ['id', 'name', 'type', 'slug'],
        required: false
      }
    ],
    order: [['createdAt', 'DESC']]
  };

  let users;
  let stats;

  if (actorRole === 'admin') {
    users = await User.findAll(baseQuery);
    stats = await buildUserStats();
  } else {
    const actor = await User.findByPk(actorId, {
      attributes: ['id', 'role']
    });

    if (!actor || actor.role !== 'moderator') {
      throw new ServiceError(403, 'Insufficient permissions.');
    }

    const manageableLocationIds = await getModeratorScopeLocationIds(actorId);

    if (manageableLocationIds.length === 0) {
      throw new ServiceError(403, 'Moderator must have an assigned location to manage moderators.');
    }

    users = await User.findAll({
      ...baseQuery,
      where: { homeLocationId: { [Op.in]: manageableLocationIds } }
    });

    stats = buildUserStatsFromList(users);
  }

  return { users, stats };
}

async function getAdminUsers(actorId, actorRole, { search, role, verified, placeholder, page, limit } = {}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = {};

  // Search by text (username, email, name)
  if (search && typeof search === 'string' && search.trim()) {
    const isPostgres = dbConfig.getDialect() === 'postgres';
    const likeOp = isPostgres ? Op.iLike : Op.like;
    const sanitizedRaw = sanitizeForLike(search.trim());
    const sanitizedNorm = sanitizeForLike(normalizeGreek(search.trim()));
    const conditions = [
      { username: { [likeOp]: `%${sanitizedRaw}%` } },
      { email: { [likeOp]: `%${sanitizedRaw}%` } },
      { firstNameNative: { [likeOp]: `%${sanitizedRaw}%` } },
      { lastNameNative: { [likeOp]: `%${sanitizedRaw}%` } },
      { firstNameEn: { [likeOp]: `%${sanitizedRaw}%` } },
      { lastNameEn: { [likeOp]: `%${sanitizedRaw}%` } },
      { nickname: { [likeOp]: `%${sanitizedRaw}%` } },
    ];
    if (sanitizedNorm !== sanitizedRaw) {
      conditions.push(
        { username: { [likeOp]: `%${sanitizedNorm}%` } },
        { firstNameNative: { [likeOp]: `%${sanitizedNorm}%` } },
        { lastNameNative: { [likeOp]: `%${sanitizedNorm}%` } },
        { firstNameEn: { [likeOp]: `%${sanitizedNorm}%` } },
        { lastNameEn: { [likeOp]: `%${sanitizedNorm}%` } },
        { nickname: { [likeOp]: `%${sanitizedNorm}%` } }
      );
    }
    whereClause[Op.or] = conditions;
  }

  // Filter by role
  if (role && typeof role === 'string') {
    whereClause.role = role;
  }

  // Filter by verification status
  if (verified === 'true') {
    whereClause.isVerified = true;
  } else if (verified === 'false') {
    whereClause.isVerified = false;
  }

  // Filter by claim status (person profiles have claimStatus !== null)
  if (placeholder === 'true') {
    whereClause.claimStatus = { [Op.ne]: null };
  } else if (placeholder === 'false') {
    whereClause.claimStatus = null;
  }

  // Scope for moderators
  if (actorRole !== 'admin') {
    const actor = await User.findByPk(actorId, {
      attributes: ['id', 'role']
    });

    if (!actor || actor.role !== 'moderator') {
      throw new ServiceError(403, 'Insufficient permissions.');
    }

    const manageableLocationIds = await getModeratorScopeLocationIds(actorId);
    if (manageableLocationIds.length > 0) {
      whereClause.homeLocationId = { [Op.in]: manageableLocationIds };
    } else {
      return { users: [], stats: null, pagination: { currentPage: pageNum, totalPages: 0, totalItems: 0, itemsPerPage: limitNum } };
    }
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    attributes: ['id', 'username', 'email', 'role', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'homeLocationId', 'createdAt', 'isVerified', 'claimStatus'],
    include: [
      {
        model: Location,
        as: 'homeLocation',
        attributes: ['id', 'name', 'type', 'slug'],
        required: false
      },
      {
        model: UserLocationRole,
        as: 'locationRoleAssignments',
        attributes: ['id', 'locationId', 'roleKey'],
        include: [
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'type', 'slug'],
            required: false
          }
        ],
        required: false
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset
  });

  const totalPages = Math.ceil(count / limitNum);
  const stats = actorRole === 'admin' ? await buildUserStats() : buildUserStatsFromList(users);

  return {
    users,
    stats,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: count,
      itemsPerPage: limitNum
    }
  };
}

async function getUserStats(actorId, actorRole) {
  if (actorRole === 'admin') {
    return await buildUserStats();
  }

  const actor = await User.findByPk(actorId, {
    attributes: ['id', 'role']
  });

  if (!actor || actor.role !== 'moderator') {
    throw new ServiceError(403, 'Insufficient permissions.');
  }

  const manageableLocationIds = await getModeratorScopeLocationIds(actorId);
  if (manageableLocationIds.length === 0) {
    throw new ServiceError(403, 'Moderator must have an assigned location to view scoped stats.');
  }

  const users = await User.findAll({
    where: { homeLocationId: { [Op.in]: manageableLocationIds } },
    attributes: ['id', 'role']
  });

  return buildUserStatsFromList(users);
}

async function updateUserRole(actorId, actorRole, targetId, role, locationId) {
  const allowedRoles = ['admin', 'moderator', 'editor', 'viewer'];
  if (!allowedRoles.includes(role)) {
    throw new ServiceError(400, 'Invalid role.');
  }

  let updatedUser = null;
  let roleAlreadySet = false;
  let validatedModeratorLocationId = null;

  if (role === 'moderator') {
    const locationValidation = normalizeInteger(locationId, 'Location ID', 1);
    if (locationValidation.error) {
      throw new ServiceError(400, 'Location ID is required when assigning moderator role.');
    }

    const location = await Location.findByPk(locationValidation.value, { attributes: ['id'] });
    if (!location) throw new ServiceError(404, 'Location not found.');

    validatedModeratorLocationId = locationValidation.value;
  }

  const actingUser = await User.findByPk(actorId, {
    attributes: ['id', 'role']
  });

  if (!actingUser) throw new ServiceError(401, 'Authentication required.');

  let moderatorManageableLocationIds = [];
  if (actingUser.role === 'moderator') {
    moderatorManageableLocationIds = await getModeratorScopeLocationIds(actorId);

    if (moderatorManageableLocationIds.length === 0) {
      throw new ServiceError(403, 'Moderator must have an assigned location to manage moderators.');
    }

    if (role === 'admin') {
      throw new ServiceError(403, 'Moderators cannot assign admin role.');
    }
  }

  await sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(targetId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    if (actingUser.role === 'moderator') {
      const targetManagedLocationId = role === 'moderator' ? validatedModeratorLocationId : user.homeLocationId;

      if (!targetManagedLocationId || !moderatorManageableLocationIds.includes(Number(targetManagedLocationId))) {
        const err = new Error('Moderators can only manage moderator assignments in child locations.');
        err.status = 403;
        throw err;
      }

      const roleTransitionAllowed = role === 'moderator' || user.role === 'moderator';
      if (!roleTransitionAllowed) {
        const err = new Error('Moderators can only assign or revoke moderator roles in child locations.');
        err.status = 403;
        throw err;
      }
    }

    // For moderator role assignment: validate that the target location is an
    // ancestor (or exact home) of the target user's homeLocationId.
    if (role === 'moderator' && user.homeLocationId) {
      const ancestorIds = await getAncestorLocationIds(user.homeLocationId, true);
      if (!ancestorIds.includes(Number(validatedModeratorLocationId))) {
        const err = new Error(
          'Moderator location must be the user\'s home location or one of its ancestor locations.'
        );
        err.status = 400;
        throw err;
      }
    }

    const isSameRole = user.role === role;

    if (isSameRole && role !== 'moderator') {
      roleAlreadySet = true;
      updatedUser = user;
      return;
    }

    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.count({
        where: { role: 'admin' },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (adminCount <= 1) {
        const err = new Error('At least one admin must remain.');
        err.status = 400;
        throw err;
      }
    }

    // Update the user's global role (homeLocationId is NOT changed for moderator assignments)
    user.role = role;
    await user.save({ transaction });

    // Upsert the UserLocationRole record for moderator assignments
    if (role === 'moderator') {
      await UserLocationRole.findOrCreate({
        where: { userId: user.id, locationId: validatedModeratorLocationId, roleKey: 'moderator' },
        transaction,
      });
    } else {
      // When demoting from moderator, remove all moderator location assignments
      if (!isSameRole) {
        await UserLocationRole.destroy({
          where: { userId: user.id, roleKey: 'moderator' },
          transaction,
        });
      }
    }

    updatedUser = await User.findByPk(user.id, {
      transaction,
      attributes: ['id', 'username', 'email', 'role', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'homeLocationId', 'createdAt'],
      include: [
        {
          model: Location,
          as: 'homeLocation',
          attributes: ['id', 'name', 'type', 'slug'],
          required: false
        }
      ]
    });
  });

  const stats = actorRole === 'admin'
    ? await buildUserStats()
    : await getUserStatsForModeratorScope(actorId);

  return { user: updatedUser, stats, roleAlreadySet };
}

async function verifyUser(actorId, actorRole, actorHomeLocationId, targetId, isVerified) {
  if (!targetId) throw new ServiceError(400, 'Invalid user id.');
  if (typeof isVerified !== 'boolean') throw new ServiceError(400, 'isVerified must be a boolean.');

  const actor = await User.findByPk(actorId, { attributes: ['id', 'role'] });
  if (!actor) throw new ServiceError(403, 'Insufficient permissions.');

  const target = await User.findByPk(targetId);
  if (!target) throw new ServiceError(404, 'User not found.');

  if (actor.role === 'moderator') {
    const manageableIds = await getModeratorScopeLocationIds(actorId);
    if (manageableIds.length === 0) {
      throw new ServiceError(403, 'Moderator must have an assigned location.');
    }
    if (!target.homeLocationId || !manageableIds.includes(Number(target.homeLocationId))) {
      throw new ServiceError(403, 'Target user is not within your manageable scope.');
    }
  }

  if (isVerified) {
    target.isVerified = true;
    target.verifiedAt = new Date();
    target.verifiedByUserId = actor.id;
    // For scope tracking, use the first assigned moderator location
    if (actor.role !== 'admin') {
      const firstAssignment = await UserLocationRole.findOne({
        where: { userId: actorId, roleKey: 'moderator' },
        order: [['createdAt', 'ASC']],
        attributes: ['locationId'],
      });
      target.verifiedScopeLocationId = firstAssignment ? firstAssignment.locationId : null;
    } else {
      target.verifiedScopeLocationId = null;
    }
  } else {
    target.isVerified = false;
    target.verifiedAt = null;
    target.verifiedByUserId = null;
    target.verifiedScopeLocationId = null;
  }

  await target.save();

  const updatedUser = await User.findByPk(target.id, { attributes: { exclude: ['password'] } });
  return updatedUser;
}

async function getPublicUserProfile(userId) {
  if (!userId) throw new ServiceError(400, 'Invalid user id.');

  const user = await User.findOne({
    where: { id: userId, searchable: true },
    attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'avatar', 'avatarColor', 'createdAt', 'bio', 'socialLinks', 'isVerified', 'professions', 'interests', 'expertiseArea', 'displayBadgeSlug', 'displayBadgeTier', 'partyId', 'twitchChannel']
  });

  if (!user) throw new ServiceError(404, 'User not found or not visible.');
  return user;
}

async function getPublicUserProfileByUsername(username) {
  if (!username || typeof username !== 'string' || username.trim() === '') {
    throw new ServiceError(400, 'Invalid username.');
  }

  const user = await User.findOne({
    where: { username: username.trim(), searchable: true },
    attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'avatar', 'avatarColor', 'createdAt', 'bio', 'socialLinks', 'isVerified', 'professions', 'interests', 'expertiseArea', 'displayBadgeSlug', 'displayBadgeTier', 'partyId', 'twitchChannel']
  });

  if (!user) throw new ServiceError(404, 'User not found or not visible.');
  return user;
}

async function searchUsers(search, page, limit, expertiseArea, locationId) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = { searchable: true, claimStatus: null };

  if (search && typeof search === 'string') {
    const isPostgres = dbConfig.getDialect() === 'postgres';
    const likeOp = isPostgres ? Op.iLike : Op.like;
    const sanitizedRaw = sanitizeForLike(search);
    const sanitizedNorm = sanitizeForLike(normalizeGreek(search));
    const conditions = [
      { username: { [likeOp]: `%${sanitizedRaw}%` } },
      { firstNameNative: { [likeOp]: `%${sanitizedRaw}%` } },
      { lastNameNative: { [likeOp]: `%${sanitizedRaw}%` } },
      { firstNameEn: { [likeOp]: `%${sanitizedRaw}%` } },
      { lastNameEn: { [likeOp]: `%${sanitizedRaw}%` } },
      { nickname: { [likeOp]: `%${sanitizedRaw}%` } },
    ];
    if (sanitizedNorm !== sanitizedRaw) {
      conditions.push(
        { username: { [likeOp]: `%${sanitizedNorm}%` } },
        { firstNameNative: { [likeOp]: `%${sanitizedNorm}%` } },
        { lastNameNative: { [likeOp]: `%${sanitizedNorm}%` } },
        { firstNameEn: { [likeOp]: `%${sanitizedNorm}%` } },
        { lastNameEn: { [likeOp]: `%${sanitizedNorm}%` } },
        { nickname: { [likeOp]: `%${sanitizedNorm}%` } }
      );
    }
    whereClause[Op.or] = conditions;
  }

  if (expertiseArea && typeof expertiseArea === 'string') {
    const isPostgres = dbConfig.getDialect() === 'postgres';
    const likeOp = isPostgres ? Op.iLike : Op.like;
    whereClause.expertiseArea = { [likeOp]: `%${expertiseArea.replace(/[%_\\]/g, '\\$&')}%` };
  }

  if (locationId) {
    const parsedLocationId = parseInt(locationId, 10);
    if (!isNaN(parsedLocationId)) {
      const locationIds = await getDescendantLocationIds(parsedLocationId, true);
      whereClause.homeLocationId = { [Op.in]: locationIds };
    }
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname', 'avatar', 'avatarColor', 'isVerified', 'claimStatus', 'expertiseArea', 'partyId', 'createdAt', 'displayBadgeSlug', 'displayBadgeTier'],
    order: [['username', 'ASC']],
    limit: limitNum,
    offset
  });

  const totalPages = Math.ceil(count / limitNum);

  return {
    users,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: count,
      itemsPerPage: limitNum
    }
  };
}

async function getPublicUserStats() {
  const stats = await User.findAll({
    attributes: [
      'searchable',
      [sequelize.fn('COUNT', sequelize.col('searchable')), 'count']
    ],
    group: ['searchable']
  });

  let totalUsers = 0;
  let searchableUsers = 0;
  let nonSearchableUsers = 0;

  stats.forEach((item) => {
    const count = parseInt(item.get('count'), 10);
    totalUsers += count;
    if (item.get('searchable')) {
      searchableUsers = count;
    } else {
      nonSearchableUsers = count;
    }
  });

  return { totalUsers, searchableUsers, nonSearchableUsers };
}

async function isUsernameAvailable(username, excludeUserId) {
  const where = { username };
  if (excludeUserId) {
    where.id = { [Op.ne]: excludeUserId };
  }
  const existing = await User.findOne({ where, attributes: ['id'] });
  return !existing;
}

module.exports = {
  ServiceError,
  buildUserStats,
  buildUserStatsFromList,
  getUserStatsForModeratorScope,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  adminDeleteUser,
  getUsers,
  getAdminUsers,
  getUserStats,
  updateUserRole,
  verifyUser,
  getPublicUserProfile,
  getPublicUserProfileByUsername,
  searchUsers,
  getPublicUserStats,
  isUsernameAvailable
};
