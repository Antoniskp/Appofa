'use strict';

const crypto = require('crypto');
const { Poll, PollOption, PollVote, Comment, User, Location, LocationLink, Tag, TaggableItem, sequelize } = require('../models');
const { Op } = require('sequelize');
const {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeBoolean,
  normalizeEnum,
  normalizeInteger,
  normalizeStringArray
} = require('../utils/validators');
const { getDescendantLocationIds, getAncestorLocationIds } = require('../utils/locationUtils');
const { syncTags, attachTags } = require('../utils/tagUtils');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_TYPES = ['simple', 'complex', 'binary'];
const BINARY_STYLES = ['yes_no', 'agree_disagree'];
const POLL_VISIBILITIES = ['public', 'private', 'locals_only'];
const RESULTS_VISIBILITIES = ['always', 'after_vote', 'after_deadline'];
const POLL_STATUSES = ['active', 'closed', 'archived'];
const ANSWER_TYPES = ['person', 'article', 'custom'];

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 2000;
const OPTION_TEXT_MIN_LENGTH = 1;
const OPTION_TEXT_MAX_LENGTH = 500;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Generate a privacy-preserving, per-poll pseudonymous voter reference.
 * Uses HMAC-SHA256 keyed with POLL_EXPORT_HMAC_SECRET so that:
 *  - The real userId is never exposed.
 *  - The ref is stable for the same (pollId, userId) pair.
 *  - The ref cannot be correlated across polls (pollId is part of the HMAC message).
 *
 * @param {number|string} pollId
 * @param {number|string} userId
 * @returns {string} hex HMAC digest
 */
const computeVoterRef = (pollId, userId) => {
  const secret = process.env.POLL_EXPORT_HMAC_SECRET;
  if (!secret) {
    throw new Error('POLL_EXPORT_HMAC_SECRET environment variable is not set.');
  }
  return crypto.createHmac('sha256', secret).update(`${pollId}:${userId}`).digest('hex');
};

/**
 * Determine whether the creator identity should be hidden from the given user.
 * @param {object} poll - plain poll data (with `hideCreator` and `creatorId` fields)
 * @param {object|null} user - plain user object { id, role } or null
 * @returns {boolean}
 */
const shouldHideCreator = (poll, user) => {
  if (!poll?.hideCreator) return false;
  if (!user) return true;
  if (user.role === 'admin' || user.id === poll.creatorId) return false;
  return true;
};

/**
 * Return a poll JSON object with the creator nulled out if appropriate.
 * @param {object} poll - Sequelize instance or plain object
 * @param {object|null} user - plain user object { id, role } or null
 * @returns {object}
 */
const sanitizePoll = (poll, user) => {
  const data = poll?.toJSON ? poll.toJSON() : poll;
  if (shouldHideCreator(data, user)) {
    return { ...data, creator: null };
  }
  return data;
};

/**
 * Returns the poll locationIds that `user` may access for locals_only polls.
 *   - 'all'  → admin user, bypass all location checks
 *   - null   → unauthenticated, no access to locals_only
 *   - []     → authenticated but no homeLocationId, no access to locals_only
 *   - number[] → ancestor location IDs (incl. self) of the user's homeLocationId
 * @param {object|null} user
 * @returns {Promise<'all'|null|number[]>}
 */
const getLocalsOnlyLocationIds = async (user) => {
  if (!user) return null;
  if (user.role === 'admin') return 'all';
  const userRecord = await User.findByPk(user.id, { attributes: ['homeLocationId'] });
  const homeLocationId = userRecord?.homeLocationId;
  if (!homeLocationId) return [];
  return getAncestorLocationIds(homeLocationId, true);
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Create a new poll.
 * @param {number} userId - ID of the authenticated creator
 * @param {object} pollData - fields from req.body
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object, error?: string}>}
 */
const createPoll = async (userId, pollData) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      title,
      description,
      category,
      tags,
      type,
      binaryStyle,
      allowUserContributions,
      allowUnauthenticatedVotes,
      visibility,
      resultsVisibility,
      deadline,
      locationId,
      options,
      hideCreator,
      useCustomColors,
      binaryColors,
      commentsEnabled,
      commentsLocked
    } = pollData;

    // Validate title
    const titleResult = normalizeRequiredText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
    if (titleResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: titleResult.error };
    }

    // Validate description (optional)
    const descriptionResult = normalizeOptionalText(description, 'Description', null, DESCRIPTION_MAX_LENGTH);
    if (descriptionResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: descriptionResult.error };
    }

    // Validate category (optional)
    const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
    if (categoryResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: categoryResult.error };
    }

    // Validate tags (optional)
    const tagsResult = normalizeStringArray(tags, 'Tags');
    if (tagsResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: tagsResult.error };
    }

    // Validate type
    const typeResult = normalizeEnum(type, POLL_TYPES, 'Poll type');
    if (typeResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: typeResult.error };
    }

    // Validate visibility
    const visibilityResult = normalizeEnum(visibility, POLL_VISIBILITIES, 'Visibility');
    if (visibilityResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: visibilityResult.error };
    }

    // Validate results visibility
    const resultsVisibilityResult = normalizeEnum(resultsVisibility, RESULTS_VISIBILITIES, 'Results visibility');
    if (resultsVisibilityResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: resultsVisibilityResult.error };
    }

    // Validate deadline (optional)
    let deadlineValue = null;
    if (deadline) {
      deadlineValue = new Date(deadline);
      if (isNaN(deadlineValue.getTime())) {
        await transaction.rollback();
        return { success: false, status: 400, message: 'Invalid deadline date.' };
      }
      if (deadlineValue <= new Date()) {
        await transaction.rollback();
        return { success: false, status: 400, message: 'Deadline must be in the future.' };
      }
    }

    // Validate locationId (optional)
    let locationIdValue = null;
    if (locationId !== undefined && locationId !== null) {
      const locationIdResult = normalizeInteger(locationId, 'Location ID', 1);
      if (locationIdResult.error) {
        await transaction.rollback();
        return {
          success: false,
          status: 400,
          message: `${locationIdResult.error} Please select a valid location from the dropdown.`
        };
      }
      locationIdValue = locationIdResult.value;

      // Verify location exists
      const location = await Location.findByPk(locationIdValue);
      if (!location) {
        await transaction.rollback();
        return {
          success: false,
          status: 404,
          message: 'Location not found. Please select a valid location from the dropdown.'
        };
      }
    }

    // Validate booleans
    const allowUserContributionsResult = normalizeBoolean(allowUserContributions, 'Allow user contributions');
    if (allowUserContributionsResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: allowUserContributionsResult.error };
    }

    const allowUnauthenticatedVotesResult = normalizeBoolean(allowUnauthenticatedVotes, 'Allow unauthenticated votes');
    if (allowUnauthenticatedVotesResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: allowUnauthenticatedVotesResult.error };
    }

    const hideCreatorResult = normalizeBoolean(hideCreator, 'hideCreator');
    if (hideCreatorResult.error) {
      await transaction.rollback();
      return { success: false, status: 400, message: hideCreatorResult.error };
    }

    // Validate options
    // Binary polls auto-create options; skip the min-options check
    const isBinary = typeResult.value === 'binary';
    // If user contributions are allowed, poll can be created with 0 options
    const minOptionsRequired = (isBinary || allowUserContributionsResult.value) ? 0 : 2;
    if (!isBinary && (!Array.isArray(options) || options.length < minOptionsRequired)) {
      await transaction.rollback();
      const errorMessage =
        minOptionsRequired === 0 ? 'Options must be an array.' : 'At least 2 options are required.';
      return { success: false, status: 400, message: errorMessage };
    }

    // Create poll
    const poll = await Poll.create(
      {
        title: titleResult.value,
        description: descriptionResult.value,
        category: categoryResult.value,
        type: typeResult.value,
        allowUserContributions:
          allowUserContributionsResult.value !== undefined ? allowUserContributionsResult.value : false,
        allowUnauthenticatedVotes:
          allowUnauthenticatedVotesResult.value !== undefined ? allowUnauthenticatedVotesResult.value : false,
        visibility: visibilityResult.value,
        resultsVisibility: resultsVisibilityResult.value,
        deadline: deadlineValue,
        locationId: locationIdValue,
        creatorId: userId,
        status: 'active',
        hideCreator: hideCreatorResult.value !== undefined ? hideCreatorResult.value : false,
        useCustomColors: useCustomColors === true,
        commentsEnabled: commentsEnabled !== false,
        commentsLocked: Boolean(commentsLocked)
      },
      { transaction }
    );

    // Create options
    const createdOptions = [];

    if (isBinary) {
      // Auto-create options based on binaryStyle
      const style = (binaryStyle && BINARY_STYLES.includes(binaryStyle)) ? binaryStyle : 'yes_no';
      const binaryOptions = style === 'agree_disagree'
        ? [{ text: 'Συμφωνώ', order: 0 }, { text: 'Διαφωνώ', order: 1 }]
        : [{ text: 'Ναι', order: 0 }, { text: 'Όχι', order: 1 }];

      for (let i = 0; i < binaryOptions.length; i++) {
        const opt = binaryOptions[i];
        const color = (useCustomColors && Array.isArray(binaryColors) && binaryColors[i])
          ? binaryColors[i]
          : null;
        const pollOption = await PollOption.create(
          { pollId: poll.id, text: opt.text, order: opt.order, color },
          { transaction }
        );
        createdOptions.push(pollOption);
      }
    } else {
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const optionColor = (useCustomColors && option.color) ? option.color : null;

        // For simple polls, text is required
        if (typeResult.value === 'simple') {
          const optionTextResult = normalizeRequiredText(
            option.text,
            `Option ${i + 1} text`,
            OPTION_TEXT_MIN_LENGTH,
            OPTION_TEXT_MAX_LENGTH
          );
          if (optionTextResult.error) {
            await transaction.rollback();
            return { success: false, status: 400, message: optionTextResult.error };
          }

          const pollOption = await PollOption.create(
            {
              pollId: poll.id,
              text: optionTextResult.value,
              order: i,
              color: optionColor
            },
            { transaction }
          );

          createdOptions.push(pollOption);
        } else {
          // For complex polls, answerType is optional
          let answerTypeValue = null;
          if (option.answerType) {
            const answerTypeResult = normalizeEnum(option.answerType, ANSWER_TYPES, 'Answer type');
            if (answerTypeResult.error) {
              await transaction.rollback();
              return { success: false, status: 400, message: answerTypeResult.error };
            }
            answerTypeValue = answerTypeResult.value;
          }

          const pollOption = await PollOption.create(
            {
              pollId: poll.id,
              text: option.text || null,
              photoUrl: option.photoUrl || null,
              linkUrl: option.linkUrl || null,
              displayText: option.displayText || null,
              answerType: answerTypeValue,
              order: i,
              color: optionColor
            },
            { transaction }
          );

          createdOptions.push(pollOption);
        }
      }
    }

    // Create LocationLink if locationId is provided
    if (locationIdValue) {
      await LocationLink.create(
        {
          location_id: locationIdValue,
          entity_type: 'poll',
          entity_id: poll.id
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Sync tags via unified tag system (outside transaction)
    await syncTags('poll', poll.id, tagsResult.value ?? []);

    // Fetch the created poll with associations
    const createdPoll = await Poll.findByPk(poll.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'isVerified']
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order', 'color']
        }
      ]
    });

    const createdPollWithTags = await attachTags('poll', createdPoll.toJSON());
    // user object not available here; caller passes it in for sanitization
    // Return raw poll — controller will sanitize with the req.user object
    return { success: true, data: createdPollWithTags };
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating poll:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to create poll.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Get all polls with filtering and pagination.
 * @param {object} filters - query parameters
 * @param {object|null} user - plain user object { id, role } or null
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object, error?: string}>}
 */
const getAllPolls = async (filters, user, clientIp, userAgent) => {
  try {
    const {
      status,
      type,
      visibility,
      category,
      tag,
      search,
      page = 1,
      limit = 10,
      creatorId,
      locationId
    } = filters;

    const normalizedTag = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
    const normalizedSearch = typeof search === 'string' ? search.trim() : '';
    let localsOnlyIds = undefined;
    if (user) {
      localsOnlyIds = await getLocalsOnlyLocationIds(user);
    }

    // Build where clause
    const where = {};

    // Filter by status
    if (status) {
      const statusResult = normalizeEnum(status, POLL_STATUSES, 'Status');
      if (statusResult.error) {
        return { success: false, status: 400, message: statusResult.error };
      }
      where.status = statusResult.value;
    } else {
      // By default, show only active polls
      where.status = 'active';
    }

    // Filter by type
    if (type) {
      const typeResult = normalizeEnum(type, POLL_TYPES, 'Type');
      if (typeResult.error) {
        return { success: false, status: 400, message: typeResult.error };
      }
      where.type = typeResult.value;
    }

    // Filter by category
    if (category) {
      const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
      if (categoryResult.error) {
        return { success: false, status: 400, message: categoryResult.error };
      }
      where.category = categoryResult.value;
    }

    // Filter by search text
    if (normalizedSearch) {
      const searchOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
      where[Op.or] = [
        { title: { [searchOperator]: `%${normalizedSearch}%` } },
        { description: { [searchOperator]: `%${normalizedSearch}%` } },
        { category: { [searchOperator]: `%${normalizedSearch}%` } }
      ];
    }

    // Filter by visibility based on authentication
    if (visibility) {
      const visibilityResult = normalizeEnum(visibility, POLL_VISIBILITIES, 'Visibility');
      if (visibilityResult.error) {
        return { success: false, status: 400, message: visibilityResult.error };
      }
      const v = visibilityResult.value;

      if (!user && v !== 'public') {
        return { success: false, status: 403, message: 'Access denied.' };
      }

      if (v === 'locals_only' && localsOnlyIds !== 'all') {
        if (!localsOnlyIds || localsOnlyIds.length === 0) {
          return {
            success: true,
            data: {
              polls: [],
              pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: parseInt(limit, 10) || 10
              }
            }
          };
        }
        where.visibility = 'locals_only';
        where.locationId = { [Op.in]: localsOnlyIds };
      } else {
        where.visibility = v;
      }
    } else {
      if (!user) {
        where.visibility = 'public';
      } else if (localsOnlyIds === 'all') {
        // admin - no visibility restriction
      } else if (!localsOnlyIds || localsOnlyIds.length === 0) {
        where.visibility = { [Op.in]: ['public', 'private'] };
      } else {
        where[Op.and] = [
          ...(where[Op.and] || []),
          {
            [Op.or]: [
              { visibility: { [Op.in]: ['public', 'private'] } },
              { visibility: 'locals_only', locationId: { [Op.in]: localsOnlyIds } }
            ]
          }
        ];
      }
    }

    // Filter by creator (only allowed for authenticated users)
    if (creatorId !== undefined) {
      if (!user) {
        return { success: false, status: 401, message: 'Authentication required.' };
      }
      const parsedCreatorId = Number(creatorId);
      if (!Number.isInteger(parsedCreatorId) || parsedCreatorId < 1) {
        return { success: false, status: 400, message: 'Invalid creator ID.' };
      }
      if (user.role !== 'admin' && user.id !== parsedCreatorId) {
        return { success: false, status: 403, message: 'Access denied.' };
      }
      where.creatorId = parsedCreatorId;
      // When filtering by creator, include all statuses (not just active) if not specified
      if (!status) {
        delete where.status;
      }
    }

    // Filter by location (and its descendants) via LocationLink
    if (locationId) {
      const parsedLocationId = parseInt(locationId, 10);
      if (!isNaN(parsedLocationId)) {
        const locationIds = await getDescendantLocationIds(parsedLocationId, true);
        const linkedPollIds = await LocationLink.findAll({
          where: { location_id: { [Op.in]: locationIds }, entity_type: 'poll' },
          attributes: ['entity_id'],
          raw: true
        });
        // Use -1 sentinel when no matches to ensure an empty result set without SQL errors
        where.id = { [Op.in]: linkedPollIds.length > 0 ? linkedPollIds.map(l => l.entity_id) : [-1] };
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return { success: false, status: 400, message: 'Invalid page number.' };
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return { success: false, status: 400, message: 'Limit must be between 1 and 100.' };
    }

    const offset = (pageNum - 1) * limitNum;

    // Filter by tag using TaggableItems (supports partial prefix matching)
    if (normalizedTag) {
      const tagWhere = sequelize.getDialect() === 'postgres'
        ? { name: { [Op.iLike]: `%${normalizedTag}%` } }
        : { name: { [Op.like]: `%${normalizedTag}%` } };
      const matchingTags = await Tag.findAll({
        where: tagWhere,
        attributes: ['id'],
        raw: true
      });
      if (matchingTags.length === 0) {
        return {
          success: true,
          data: {
            polls: [],
            pagination: { currentPage: pageNum, totalPages: 0, totalItems: 0, itemsPerPage: limitNum }
          }
        };
      }
      const matchingTagIds = matchingTags.map((t) => t.id);
      const linkedItems = await TaggableItem.findAll({
        where: { tagId: { [Op.in]: matchingTagIds }, entityType: 'poll' },
        attributes: ['entityId'],
        raw: true
      });
      const linkedIds = [...new Set(linkedItems.map((i) => i.entityId))];
      where.id = { [Op.in]: linkedIds.length > 0 ? linkedIds : [-1] };
    }

    const { count, rows: polls } = await Poll.findAndCountAll({
      where,
      distinct: true,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'isVerified']
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order', 'color'],
          include: [
            {
              model: PollVote,
              as: 'votes',
              attributes: ['id']
            }
          ]
        }
      ],
      limit: limitNum,
      offset: offset,
      order: [['createdAt', 'DESC'], [{ model: PollOption, as: 'options' }, 'order', 'ASC']]
    });

    // Add vote counts to each option
    const pollsWithCounts = polls.map(poll => {
      const pollData = poll.toJSON();
      pollData.options = pollData.options.map(option => ({
        ...option,
        voteCount: option.votes ? option.votes.length : 0,
        votes: undefined
      }));
      pollData.totalVotes = pollData.options.reduce((sum, opt) => sum + opt.voteCount, 0);
      if (shouldHideCreator(pollData, user)) {
        pollData.creator = null;
      }
      return pollData;
    });

    // Attach userVote for each poll when the user is authenticated
    if (user) {
      const pollIds = pollsWithCounts.map(p => p.id);
      if (pollIds.length > 0) {
        const userVotes = await PollVote.findAll({
          where: { pollId: { [Op.in]: pollIds }, userId: user.id },
          attributes: ['pollId', 'optionId', 'createdAt']
        });
        const voteMap = {};
        for (const v of userVotes) {
          voteMap[v.pollId] = { optionId: v.optionId, createdAt: v.createdAt };
        }
        for (const p of pollsWithCounts) {
          if (voteMap[p.id]) {
            p.userVote = voteMap[p.id];
          }
        }
      }
    } else if (clientIp && userAgent) {
      const pollIds = pollsWithCounts.map(p => p.id);
      if (pollIds.length > 0) {
        const anonVotes = await PollVote.findAll({
          where: { pollId: { [Op.in]: pollIds }, userId: null, ipAddress: clientIp, userAgent },
          attributes: ['pollId', 'optionId', 'createdAt']
        });
        const voteMap = {};
        for (const v of anonVotes) {
          voteMap[v.pollId] = { optionId: v.optionId, createdAt: v.createdAt };
        }
        for (const p of pollsWithCounts) {
          if (voteMap[p.id]) {
            p.userVote = voteMap[p.id];
          }
        }
      }
    }

    const pollsWithTags = await attachTags('poll', pollsWithCounts);

    return {
      success: true,
      data: {
        polls: pollsWithTags,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(count / limitNum),
          totalItems: count,
          itemsPerPage: limitNum
        }
      }
    };
  } catch (error) {
    console.error('Error fetching polls:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to fetch polls.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Get a specific poll by ID.
 * @param {number|string} pollId
 * @param {object|null} user - plain user object { id, role } or null
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object, error?: string}>}
 */
const getPollById = async (pollId, user, clientIp, userAgent) => {
  try {
    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'isVerified']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'type']
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order', 'color'],
          include: [
            {
              model: PollVote,
              as: 'votes',
              attributes: ['id', 'isAuthenticated']
            }
          ]
        }
      ],
      order: [[{ model: PollOption, as: 'options' }, 'order', 'ASC']]
    });

    if (!poll) {
      return { success: false, status: 404, message: 'Poll not found.' };
    }

    // Check visibility permissions
    // 'private' = any authenticated user can view (Μόνο Συνδεδεμένοι)
    if (poll.visibility === 'private' && !user) {
      return { success: false, status: 403, message: 'Access denied. This poll is private.' };
    }

    if (poll.visibility === 'locals_only') {
      if (!user) {
        return {
          success: false,
          status: 403,
          message: 'Access denied. Authentication required for local polls.'
        };
      }
      if (user.role !== 'admin') {
        const localsOnlyIds = await getLocalsOnlyLocationIds(user);
        if (
          localsOnlyIds !== 'all'
          && (!poll.locationId || !localsOnlyIds.includes(poll.locationId))
        ) {
          return {
            success: false,
            status: 403,
            message: 'Access denied. This poll is restricted to local members.'
          };
        }
      }
    }

    // Add vote statistics
    const pollData = poll.toJSON();
    pollData.options = pollData.options.map(option => ({
      ...option,
      voteCount: option.votes ? option.votes.length : 0,
      authenticatedVotes: option.votes ? option.votes.filter(v => v.isAuthenticated).length : 0,
      votes: undefined
    }));
    pollData.totalVotes = pollData.options.reduce((sum, opt) => sum + opt.voteCount, 0);
    pollData.totalAuthenticatedVotes = pollData.options.reduce(
      (sum, opt) => sum + opt.authenticatedVotes,
      0
    );

    const responsePoll = shouldHideCreator(pollData, user) ? { ...pollData, creator: null } : pollData;

    // Check if user has voted
    if (user) {
      const userVote = await PollVote.findOne({
        where: { pollId, userId: user.id }
      });
      if (userVote) {
        responsePoll.userVote = {
          optionId: userVote.optionId,
          createdAt: userVote.createdAt
        };
      }
    } else if (clientIp && userAgent) {
      const anonVote = await PollVote.findOne({
        where: { pollId, userId: null, ipAddress: clientIp, userAgent }
      });
      if (anonVote) {
        responsePoll.userVote = {
          optionId: anonVote.optionId,
          createdAt: anonVote.createdAt
        };
      }
    }

    const responsePollWithTags = await attachTags('poll', responsePoll);
    return { success: true, data: responsePollWithTags };
  } catch (error) {
    console.error('Error fetching poll:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to fetch poll.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Update a poll.
 * @param {number|string} pollId
 * @param {number} userId - authenticated user's ID
 * @param {string} userRole - authenticated user's role
 * @param {object} updateData - fields from req.body
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object, error?: string}>}
 */
const updatePoll = async (pollId, userId, userRole, updateData) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      title,
      description,
      category,
      tags,
      deadline,
      status,
      locationId,
      visibility,
      resultsVisibility,
      hideCreator,
      options,
      useCustomColors
    } = updateData;

    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: PollVote,
          as: 'votes'
        }
      ]
    });

    if (!poll) {
      await transaction.rollback();
      return { success: false, status: 404, message: 'Poll not found.' };
    }

    // Binary polls do not allow updating options
    if (poll.type === 'binary' && options !== undefined) {
      await transaction.rollback();
      return { success: false, status: 400, message: 'Cannot modify options of a binary poll.' };
    }

    // Check permissions - must be creator or admin
    if (poll.creatorId !== userId && userRole !== 'admin') {
      await transaction.rollback();
      return {
        success: false,
        status: 403,
        message: 'Access denied. Only the poll creator or admin can update this poll.'
      };
    }

    const updates = {};

    // Validate and update title
    if (title !== undefined) {
      const titleResult = normalizeRequiredText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
      if (titleResult.error) {
        await transaction.rollback();
        return { success: false, status: 400, message: titleResult.error };
      }
      updates.title = titleResult.value;
    }

    // Validate and update description
    if (description !== undefined) {
      const descriptionResult = normalizeOptionalText(
        description,
        'Description',
        null,
        DESCRIPTION_MAX_LENGTH
      );
      if (descriptionResult.error) {
        await transaction.rollback();
        return { success: false, status: 400, message: descriptionResult.error };
      }
      updates.description = descriptionResult.value;
    }

    // Validate and update category
    if (category !== undefined) {
      const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
      if (categoryResult.error) {
        await transaction.rollback();
        return { success: false, status: 400, message: categoryResult.error };
      }
      updates.category = categoryResult.value;
    }

    // Validate and update tags
    let tagsToSync = undefined;
    if (tags !== undefined) {
      const tagsResult = normalizeStringArray(tags, 'Tags');
      if (tagsResult.error) {
        await transaction.rollback();
        return { success: false, status: 400, message: tagsResult.error };
      }
      tagsToSync = tagsResult.value ?? [];
    }

    // Validate and update deadline
    if (deadline !== undefined) {
      if (deadline === null) {
        updates.deadline = null;
      } else {
        const deadlineValue = new Date(deadline);
        if (isNaN(deadlineValue.getTime())) {
          await transaction.rollback();
          return { success: false, status: 400, message: 'Invalid deadline date.' };
        }
        updates.deadline = deadlineValue;
      }
    }

    // Validate and update status
    if (status !== undefined) {
      const statusResult = normalizeEnum(status, POLL_STATUSES, 'Status');
      if (statusResult.error) {
        await transaction.rollback();
        return { success: false, status: 400, message: statusResult.error };
      }
      updates.status = statusResult.value;
    }

    // Validate and update visibility
    if (visibility !== undefined) {
      const visibilityResult = normalizeEnum(visibility, POLL_VISIBILITIES, 'Visibility');
      if (visibilityResult.error) {
        await transaction.rollback();
        return { success: false, status: 400, message: visibilityResult.error };
      }
      updates.visibility = visibilityResult.value;
    }

    // Validate and update results visibility
    if (resultsVisibility !== undefined) {
      const resultsVisibilityResult = normalizeEnum(resultsVisibility, RESULTS_VISIBILITIES, 'Results visibility');
      if (resultsVisibilityResult.error) {
        await transaction.rollback();
        return { success: false, status: 400, message: resultsVisibilityResult.error };
      }
      updates.resultsVisibility = resultsVisibilityResult.value;
    }

    // Validate and update locationId
    if (locationId !== undefined) {
      if (locationId === null) {
        updates.locationId = null;
      } else {
        const locationIdResult = normalizeInteger(locationId, 'Location ID', 1);
        if (locationIdResult.error) {
          await transaction.rollback();
          return {
            success: false,
            status: 400,
            message: `${locationIdResult.error} Please select a valid location from the dropdown.`
          };
        }
        // Verify location exists
        const location = await Location.findByPk(locationIdResult.value);
        if (!location) {
          await transaction.rollback();
          return {
            success: false,
            status: 404,
            message: 'Location not found. Please select a valid location from the dropdown.'
          };
        }
        updates.locationId = locationIdResult.value;
      }
    }

    if (hideCreator !== undefined) {
      const hideCreatorResult = normalizeBoolean(hideCreator, 'hideCreator');
      if (hideCreatorResult.error) {
        await transaction.rollback();
        return { success: false, status: 400, message: hideCreatorResult.error };
      }
      updates.hideCreator = hideCreatorResult.value;
    }

    if (useCustomColors !== undefined) {
      updates.useCustomColors = useCustomColors === true;
    }

    // Update the poll
    await poll.update(updates, { transaction });

    // Update option colors if options array is provided (non-binary polls only)
    if (poll.type !== 'binary' && Array.isArray(options)) {
      for (const optionData of options) {
        if (optionData.id && optionData.color !== undefined) {
          await PollOption.update(
            { color: optionData.color || null },
            { where: { id: optionData.id, pollId }, transaction }
          );
        }
      }
    }

    // Update LocationLink if locationId changed
    if (locationId !== undefined) {
      // Remove existing location link
      await LocationLink.destroy(
        {
          where: {
            entity_type: 'poll',
            entity_id: pollId
          }
        },
        { transaction }
      );

      // Create new location link if locationId is provided
      if (updates.locationId) {
        await LocationLink.create(
          {
            location_id: updates.locationId,
            entity_type: 'poll',
            entity_id: pollId
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Sync tags if provided (outside transaction)
    if (tagsToSync !== undefined) {
      await syncTags('poll', pollId, tagsToSync);
    }

    // Fetch updated poll with associations
    const updatedPoll = await Poll.findByPk(pollId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'isVerified']
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order', 'color']
        }
      ],
      order: [[{ model: PollOption, as: 'options' }, 'order', 'ASC']]
    });

    const updatedPollData = await attachTags('poll', updatedPoll.toJSON());
    // Return the raw poll; the controller sanitizes with req.user
    return { success: true, data: updatedPollData };
  } catch (error) {
    // Safely rollback transaction if it hasn't been committed
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    console.error('Error updating poll:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to update poll.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Delete a poll and all related data.
 * @param {number|string} pollId
 * @param {number} userId
 * @param {string} userRole
 * @returns {Promise<{success: boolean, status?: number, message?: string, error?: string}>}
 */
const deletePoll = async (pollId, userId, userRole) => {
  const transaction = await sequelize.transaction();

  try {
    const poll = await Poll.findByPk(pollId, { transaction });

    if (!poll) {
      await transaction.rollback();
      return { success: false, status: 404, message: 'Poll not found.' };
    }

    // Check permissions - must be creator or admin
    if (poll.creatorId !== userId && userRole !== 'admin') {
      await transaction.rollback();
      return {
        success: false,
        status: 403,
        message: 'Access denied. Only the poll creator or admin can delete this poll.'
      };
    }

    // Delete polymorphic Comments for this poll (no FK cascade, must be explicit)
    await Comment.destroy({
      where: {
        entityType: 'poll',
        entityId: pollId
      },
      transaction
    });

    // Delete LocationLink rows for this poll
    await LocationLink.destroy({
      where: {
        entity_type: 'poll',
        entity_id: pollId
      },
      transaction
    });

    // Delete the poll; DB-level CASCADE handles PollVotes and PollOptions
    await poll.destroy({ transaction });

    await transaction.commit();

    return { success: true, data: null };
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting poll:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to delete poll.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Vote on a poll.
 * @param {number|string} pollId
 * @param {number|string} optionId
 * @param {number|null} userId - null for unauthenticated votes
 * @param {string|null} userRole
 * @param {string} clientIp
 * @param {string} userAgent
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object, error?: string}>}
 */
const votePoll = async (pollId, optionId, userId, userRole, clientIp, userAgent) => {
  let transaction;
  try {
    // Validate optionId
    const optionIdResult = normalizeInteger(optionId, 'Option ID', 1);
    if (optionIdResult.error) {
      return { success: false, status: 400, message: optionIdResult.error };
    }

    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: PollOption,
          as: 'options'
        }
      ]
    });

    if (!poll) {
      return { success: false, status: 404, message: 'Poll not found.' };
    }

    // Check if poll is active
    if (poll.status !== 'active') {
      return { success: false, status: 400, message: 'This poll is not active.' };
    }

    // Check if poll has expired
    if (poll.deadline && new Date(poll.deadline) < new Date()) {
      return { success: false, status: 400, message: 'This poll has expired.' };
    }

    // Verify option belongs to this poll
    const option = poll.options.find(opt => opt.id === optionIdResult.value);
    if (!option) {
      return { success: false, status: 400, message: 'Invalid option for this poll.' };
    }

    // Check if unauthenticated votes are allowed
    if (!userId && !poll.allowUnauthenticatedVotes) {
      return {
        success: false,
        status: 401,
        message: 'Authentication required to vote on this poll.'
      };
    }

    if (poll.visibility === 'locals_only' && poll.locationId) {
      if (!userId) {
        return {
          success: false,
          status: 403,
          message: 'Access denied. This poll is for local members only.'
        };
      }
      if (userRole !== 'admin') {
        const userRecord = await User.findByPk(userId, { attributes: ['homeLocationId'] });
        const homeLocationId = userRecord?.homeLocationId;
        if (!homeLocationId) {
          return {
            success: false,
            status: 403,
            message: 'Access denied. You must have a home location to vote on local polls.'
          };
        }
        const ancestorIds = await getAncestorLocationIds(homeLocationId, true);
        if (!ancestorIds.includes(poll.locationId)) {
          return {
            success: false,
            status: 403,
            message: 'Access denied. This poll is restricted to local members.'
          };
        }
      }
    }

    transaction = await sequelize.transaction();
    let vote;
    const isAuthenticated = !!userId;

    if (isAuthenticated) {
      // Check if user already voted
      const existingVote = await PollVote.findOne({
        where: { pollId, userId },
        transaction
      });

      if (existingVote) {
        // Update existing vote
        await existingVote.update({ optionId: optionIdResult.value }, { transaction });
        vote = existingVote;
      } else {
        // Create new vote
        vote = await PollVote.create(
          {
            pollId,
            optionId: optionIdResult.value,
            userId,
            isAuthenticated: true,
            sessionId: null,
            ipAddress: clientIp
          },
          { transaction }
        );
      }
    } else {
      // Unauthenticated vote - track by IP address + User-Agent (device fingerprint)
      const existingVote = await PollVote.findOne({
        where: {
          pollId,
          userId: null,
          ipAddress: clientIp,
          userAgent
        },
        transaction
      });

      if (existingVote) {
        // Update existing vote from this device
        await existingVote.update({ optionId: optionIdResult.value }, { transaction });
        vote = existingVote;
      } else {
        // Create new vote
        vote = await PollVote.create(
          {
            pollId,
            optionId: optionIdResult.value,
            userId: null,
            isAuthenticated: false,
            sessionId: null,
            ipAddress: clientIp,
            userAgent
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Fetch updated vote counts
    const votes = await PollVote.findAll({
      where: { pollId },
      attributes: ['optionId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['optionId']
    });

    const voteCounts = {};
    votes.forEach(v => {
      voteCounts[v.optionId] = parseInt(v.dataValues.count, 10);
    });

    return {
      success: true,
      data: {
        voteId: vote.id,
        optionId: vote.optionId,
        voteCounts
      }
    };
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error voting on poll:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to record vote.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Add a user-contributed option to a poll.
 * @param {number|string} pollId
 * @param {number} userId - authenticated user's ID
 * @param {object} optionData - { text, photoUrl, linkUrl, displayText, answerType }
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object, error?: string}>}
 */
const addPollOption = async (pollId, userId, optionData) => {
  try {
    const { text, photoUrl, linkUrl, displayText, answerType, color } = optionData;

    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: PollOption,
          as: 'options'
        }
      ]
    });

    if (!poll) {
      return { success: false, status: 404, message: 'Poll not found.' };
    }

    // Check if poll allows user contributions
    if (!poll.allowUserContributions) {
      return {
        success: false,
        status: 403,
        message: 'This poll does not allow user-contributed options.'
      };
    }

    // Check if poll is active
    if (poll.status !== 'active') {
      return { success: false, status: 400, message: 'Cannot add options to an inactive poll.' };
    }

    // Validate based on poll type
    const newOptionData = {
      pollId,
      addedByUserId: userId,
      order: poll.options.length,
      color: (poll.useCustomColors && color) ? color : null
    };

    if (poll.type === 'simple') {
      const textResult = normalizeRequiredText(
        text,
        'Option text',
        OPTION_TEXT_MIN_LENGTH,
        OPTION_TEXT_MAX_LENGTH
      );
      if (textResult.error) {
        return { success: false, status: 400, message: textResult.error };
      }
      newOptionData.text = textResult.value;
    } else {
      // Complex poll - answerType is optional
      let answerTypeValue = null;
      if (answerType) {
        const answerTypeResult = normalizeEnum(answerType, ANSWER_TYPES, 'Answer type');
        if (answerTypeResult.error) {
          return { success: false, status: 400, message: answerTypeResult.error };
        }
        answerTypeValue = answerTypeResult.value;
      }

      newOptionData.text = text || null;
      newOptionData.photoUrl = photoUrl || null;
      newOptionData.linkUrl = linkUrl || null;
      newOptionData.displayText = displayText || null;
      newOptionData.answerType = answerTypeValue;
    }

    const option = await PollOption.create(newOptionData);

    return { success: true, data: option };
  } catch (error) {
    console.error('Error adding poll option:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to add option.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Get poll results.
 * @param {number|string} pollId
 * @param {object|null} user - plain user object { id, role } or null
 * @param {string} clientIp
 * @param {string} userAgent
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object, error?: string}>}
 */
const getResults = async (pollId, user, clientIp, userAgent) => {
  try {
    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'isVerified']
        },
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order', 'color'],
          include: [
            {
              model: PollVote,
              as: 'votes',
              attributes: ['id', 'isAuthenticated', 'createdAt']
            }
          ]
        }
      ],
      order: [[{ model: PollOption, as: 'options' }, 'order', 'ASC']]
    });

    if (!poll) {
      return { success: false, status: 404, message: 'Poll not found.' };
    }

    if (poll.visibility === 'private' && !user) {
      return { success: false, status: 403, message: 'Access denied. This poll is private.' };
    }
    if (poll.visibility === 'locals_only') {
      if (!user) {
        return {
          success: false,
          status: 403,
          message: 'Access denied. Authentication required for local polls.'
        };
      }
      if (user.role !== 'admin') {
        const localsOnlyIds = await getLocalsOnlyLocationIds(user);
        if (
          localsOnlyIds !== 'all'
          && (!poll.locationId || !localsOnlyIds.includes(poll.locationId))
        ) {
          return {
            success: false,
            status: 403,
            message: 'Access denied. This poll is restricted to local members.'
          };
        }
      }
    }

    // Check results visibility rules
    const canViewResults = () => {
      if (poll.resultsVisibility === 'always') {
        return true;
      }

      if (poll.resultsVisibility === 'after_vote') {
        // Check if user has voted
        if (user) {
          return PollVote.findOne({
            where: { pollId, userId: user.id }
          }).then(vote => !!vote);
        } else {
          // Check vote for unauthenticated users by IP address + User-Agent.
          // userId is always null for unauthenticated votes (see vote creation logic),
          // so including it ensures we never match an authenticated user's vote.
          return PollVote.findOne({
            where: { pollId, userId: null, ipAddress: clientIp, userAgent }
          }).then(vote => !!vote);
        }
      }

      if (poll.resultsVisibility === 'after_deadline') {
        if (poll.deadline) {
          return new Date(poll.deadline) < new Date();
        }
        return poll.status !== 'active';
      }

      return false;
    };

    const hasAccess = await canViewResults();

    if (!hasAccess) {
      return { success: false, status: 403, message: 'Results are not yet available for viewing.' };
    }

    // Calculate statistics
    const pollData = poll.toJSON();
    const totalVotes = pollData.options.reduce(
      (sum, opt) => sum + (opt.votes ? opt.votes.length : 0),
      0
    );

    pollData.options = pollData.options.map(option => {
      const voteCount = option.votes ? option.votes.length : 0;
      const authenticatedVotes = option.votes
        ? option.votes.filter(v => v.isAuthenticated).length
        : 0;
      const unauthenticatedVotes = voteCount - authenticatedVotes;
      const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : 0;

      return {
        id: option.id,
        text: option.text,
        photoUrl: option.photoUrl,
        linkUrl: option.linkUrl,
        displayText: option.displayText,
        answerType: option.answerType,
        order: option.order,
        color: option.color || null,
        voteCount,
        authenticatedVotes,
        unauthenticatedVotes,
        percentage: parseFloat(percentage)
      };
    });

    const totalAuthenticatedVotes = pollData.options.reduce(
      (sum, opt) => sum + opt.authenticatedVotes,
      0
    );
    const totalUnauthenticatedVotes = pollData.options.reduce(
      (sum, opt) => sum + opt.unauthenticatedVotes,
      0
    );

    const responseCreator = shouldHideCreator(poll, user) ? null : poll.creator;

    return {
      success: true,
      data: {
        poll: {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          type: poll.type,
          status: poll.status,
          deadline: poll.deadline,
          useCustomColors: poll.useCustomColors,
          creator: responseCreator
        },
        results: {
          options: pollData.options,
          totalVotes,
          totalAuthenticatedVotes,
          totalUnauthenticatedVotes
        }
      }
    };
  } catch (error) {
    console.error('Error fetching poll results:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to fetch poll results.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Get polls that the authenticated user has voted in.
 * @param {number} userId
 * @param {number|string} page
 * @param {number|string} limit
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object, error?: string}>}
 */
const getMyVotedPolls = async (userId, page, limit) => {
  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return { success: false, status: 400, message: 'Invalid page number.' };
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return { success: false, status: 400, message: 'Limit must be between 1 and 100.' };
    }

    const offset = (pageNum - 1) * limitNum;

    // Find all votes by this user
    const { count, rows: votes } = await PollVote.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Poll,
          as: 'poll',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'firstNameNative', 'lastNameNative', 'avatar', 'avatarColor', 'isVerified']
            },
            {
              model: PollOption,
              as: 'options',
              attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order', 'color'],
              include: [
                {
                  model: PollVote,
                  as: 'votes',
                  attributes: ['id']
                }
              ]
            }
          ]
        },
        {
          model: PollOption,
          as: 'option',
          attributes: ['id', 'text']
        }
      ],
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // user object needed for shouldHideCreator — build minimal user object
    const userObj = { id: userId };

    const data = votes.map(vote => {
      const pollData = vote.poll ? vote.poll.toJSON() : null;
      if (pollData) {
        pollData.options = pollData.options.map(option => ({
          ...option,
          voteCount: option.votes ? option.votes.length : 0,
          votes: undefined
        }));
        pollData.totalVotes = pollData.options.reduce((sum, opt) => sum + opt.voteCount, 0);
        if (shouldHideCreator(pollData, userObj)) {
          pollData.creator = null;
        }
      }
      return {
        voteId: vote.id,
        optionId: vote.optionId,
        votedOption: vote.option ? { id: vote.option.id, text: vote.option.text } : null,
        votedAt: vote.createdAt,
        poll: pollData
      };
    });

    return {
      success: true,
      data: {
        votes: data,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(count / limitNum),
          totalItems: count,
          itemsPerPage: limitNum
        }
      }
    };
  } catch (error) {
    console.error('Error fetching voted polls:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to fetch voted polls.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Export auditable poll data (creator / admin only).
 * @param {number|string} pollId
 * @param {number} userId
 * @param {string} userRole
 * @returns {Promise<{success: boolean, status?: number, message?: string, data?: object, error?: string}>}
 */
const exportPoll = async (pollId, userId, userRole) => {
  try {
    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: PollOption,
          as: 'options',
          attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order', 'color'],
          include: [
            {
              model: PollVote,
              as: 'votes',
              attributes: ['id', 'userId', 'isAuthenticated', 'createdAt', 'updatedAt']
            }
          ]
        }
      ],
      order: [[{ model: PollOption, as: 'options' }, 'order', 'ASC']]
    });

    if (!poll) {
      return { success: false, status: 404, message: 'Poll not found.' };
    }

    // Access control: creator or admin only (same as edit rights)
    if (poll.creatorId !== userId && userRole !== 'admin') {
      return {
        success: false,
        status: 403,
        message: 'Access denied. Only the poll creator or admin can export poll data.'
      };
    }

    const pollData = poll.toJSON();

    const options = pollData.options.map(option => {
      const votes = (option.votes || []).map(vote => ({
        vote_id: vote.id,
        voter_ref: vote.userId ? computeVoterRef(poll.id, vote.userId) : null,
        is_authenticated: vote.isAuthenticated,
        voted_at: vote.updatedAt || vote.createdAt
      }));

      return {
        id: option.id,
        text: option.text,
        photoUrl: option.photoUrl || null,
        linkUrl: option.linkUrl || null,
        displayText: option.displayText || null,
        answerType: option.answerType || null,
        order: option.order,
        vote_count: votes.length,
        votes
      };
    });

    const totalVotes = options.reduce((sum, opt) => sum + opt.vote_count, 0);

    return {
      success: true,
      data: {
        exported_at: new Date().toISOString(),
        poll: {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          type: poll.type,
          status: poll.status,
          deadline: poll.deadline,
          createdAt: poll.createdAt,
          updatedAt: poll.updatedAt
        },
        summary: {
          totalVotes,
          totalOptions: options.length
        },
        options
      }
    };
  } catch (error) {
    console.error('Error exporting poll data:', error);
    return {
      success: false,
      status: 500,
      message: 'Failed to export poll data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Get poll counts grouped by category.
 * @param {object} queryParams - { status }
 * @returns {Promise<{success: boolean, data?: object, status?: number, message?: string}>}
 */
const getCategoryCounts = async (queryParams = {}) => {
  try {
    const { status = 'active' } = queryParams;

    const where = { category: { [Op.ne]: null } };
    if (status) where.status = status;

    const rows = await Poll.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['category'],
      raw: true
    });

    const counts = {};
    rows.forEach((row) => {
      if (row.category && row.category.trim()) {
        counts[row.category] = parseInt(row.count, 10);
      }
    });

    return { success: true, data: { counts } };
  } catch (error) {
    console.error('Get poll category counts error:', error);
    return { success: false, status: 500, message: 'Error fetching poll category counts.' };
  }
};

module.exports = {
  // Constants (exported for use in controller or tests if needed)
  POLL_TYPES,
  POLL_VISIBILITIES,
  RESULTS_VISIBILITIES,
  POLL_STATUSES,
  ANSWER_TYPES,

  // Helpers
  computeVoterRef,
  shouldHideCreator,
  sanitizePoll,

  // Service functions
  createPoll,
  getAllPolls,
  getPollById,
  updatePoll,
  deletePoll,
  votePoll,
  addPollOption,
  getResults,
  getMyVotedPolls,
  exportPoll,
  getCategoryCounts
};
