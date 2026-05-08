'use strict';

const { Op } = require('sequelize');
const {
  CivicQuestion,
  CivicQuestionVote,
  User,
  Location,
  sequelize,
} = require('../models');
const {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeEnum,
  normalizeUrl,
  normalizeBoolean,
} = require('../utils/validators');
const { getAncestorLocationIds } = require('../utils/locationUtils');

const SOURCE_TYPES = ['parliament', 'european_commission', 'municipal_council', 'regional_council', 'other'];
const CIVIC_QUESTION_STATUSES = ['open', 'closed', 'archived'];
const CIVIC_QUESTION_VISIBILITIES = ['public', 'private', 'locals_only'];
const CIVIC_QUESTION_VOTE_RESTRICTIONS = ['authenticated', 'locals_only'];
const CIVIC_QUESTION_RESULTS_VISIBILITIES = ['always', 'after_vote', 'after_deadline'];
const CIVIC_QUESTION_CHOICES = ['agree', 'disagree', 'present'];
const CIVIC_QUESTION_SORT_OPTIONS = ['newest', 'closing_soon', 'most_voted'];

const CHOICE_ORDER = ['agree', 'disagree', 'present'];

const parsePositiveInteger = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeLikeSearchTerm = (value) => String(value).replace(/[%_]/g, '').trim();

const normalizeDate = (value, fieldLabel) => {
  if (value === undefined) return { value: undefined };
  if (value === null || value === '') return { value: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { error: `${fieldLabel} must be a valid date.` };
  }
  return { value: date };
};

const getUserRecord = async (user) => {
  if (!user?.id) return null;
  return User.findByPk(user.id, { attributes: ['id', 'homeLocationId', 'role'] });
};

const hasLocalAccess = async (user, locationId) => {
  if (!locationId) return true;
  if (!user) return false;
  if (user.role === 'admin') return true;

  const userRecord = await getUserRecord(user);
  if (!userRecord?.homeLocationId) return false;

  const ancestorIds = await getAncestorLocationIds(userRecord.homeLocationId, true);
  return ancestorIds.includes(locationId);
};

const canViewQuestion = async (question, user) => {
  if (question.visibility === 'public') return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (question.visibility === 'private') return true;
  if (question.visibility === 'locals_only') {
    return hasLocalAccess(user, question.locationId);
  }
  return false;
};

const buildVisibilityWhere = async (user) => {
  if (!user) return { visibility: 'public' };
  if (user.role === 'admin') return {};

  const userRecord = await getUserRecord(user);
  const basePublicOrPrivate = { visibility: { [Op.in]: ['public', 'private'] } };

  if (!userRecord?.homeLocationId) {
    return basePublicOrPrivate;
  }

  const ancestorIds = await getAncestorLocationIds(userRecord.homeLocationId, true);
  return {
    [Op.or]: [
      basePublicOrPrivate,
      {
        [Op.and]: [
          { visibility: 'locals_only' },
          { locationId: { [Op.in]: ancestorIds } },
        ],
      },
    ],
  };
};

const parseLocation = async (locationId) => {
  if (locationId === undefined) return { value: undefined };
  if (locationId === null || locationId === '') return { value: null };

  const parsedLocationId = parsePositiveInteger(locationId);
  if (!parsedLocationId) {
    return { error: 'Invalid locationId.' };
  }

  const location = await Location.findByPk(parsedLocationId, { attributes: ['id'] });
  if (!location) {
    return { error: 'Location not found.' };
  }

  return { value: parsedLocationId };
};

const attachVoteData = async (question, userId = null) => {
  const questionId = question.id;

  const voteRows = await CivicQuestionVote.findAll({
    attributes: [
      'choice',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: { civicQuestionId: questionId },
    group: ['choice'],
    raw: true,
  });

  const voteCounts = CHOICE_ORDER.reduce((acc, choice) => {
    acc[choice] = 0;
    return acc;
  }, {});

  for (const row of voteRows) {
    voteCounts[row.choice] = parseInt(row.count, 10) || 0;
  }

  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
  const percentages = CHOICE_ORDER.reduce((acc, choice) => {
    acc[choice] = totalVotes > 0 ? Number(((voteCounts[choice] / totalVotes) * 100).toFixed(1)) : 0;
    return acc;
  }, {});

  let myVote = null;
  if (userId) {
    const existing = await CivicQuestionVote.findOne({
      where: { civicQuestionId: questionId, userId },
      attributes: ['choice'],
    });
    myVote = existing?.choice || null;
  }

  return {
    ...question,
    voteCounts,
    totalVotes,
    percentages,
    myVote,
  };
};

const canViewResults = async (question, user) => {
  if (!question) return false;
  if (user && (user.role === 'admin' || question.creatorId === user.id)) return true;

  if (question.resultsVisibility === 'always') return true;
  if (question.resultsVisibility === 'after_deadline') {
    const isClosedStatus = question.status === 'closed' || question.status === 'archived';
    const deadlinePassed = Boolean(question.deadline) && new Date(question.deadline) <= new Date();
    return isClosedStatus || deadlinePassed;
  }

  if (question.resultsVisibility === 'after_vote') {
    if (!user?.id) return false;
    const existing = await CivicQuestionVote.findOne({
      where: { civicQuestionId: question.id, userId: user.id },
      attributes: ['id'],
    });
    return Boolean(existing);
  }

  return false;
};

const validateCreatePayload = async (payload) => {
  const titleResult = normalizeRequiredText(payload.title, 'Title', 5, 200);
  if (titleResult.error) return titleResult;

  const originalLinkResult = normalizeUrl(payload.originalLink, 'Original link', false);
  if (originalLinkResult.error) return originalLinkResult;

  const sourceTypeResult = normalizeEnum(payload.sourceType || 'other', SOURCE_TYPES, 'Source type');
  if (sourceTypeResult.error) return sourceTypeResult;

  const sourceNameResult = normalizeOptionalText(payload.sourceName, 'Source name', 2, 200);
  if (sourceNameResult.error) return sourceNameResult;

  const simplifiedResult = normalizeOptionalText(payload.simplified, 'Simplified text', 3, 20000);
  if (simplifiedResult.error) return simplifiedResult;

  const prosResult = normalizeOptionalText(payload.pros, 'Pros', 3, 20000);
  if (prosResult.error) return prosResult;

  const consResult = normalizeOptionalText(payload.cons, 'Cons', 3, 20000);
  if (consResult.error) return consResult;

  const dateAskedResult = normalizeDate(payload.dateAsked, 'Date asked');
  if (dateAskedResult.error) return dateAskedResult;

  const deadlineResult = normalizeDate(payload.deadline, 'Deadline');
  if (deadlineResult.error) return deadlineResult;

  const statusResult = normalizeEnum(payload.status || 'open', CIVIC_QUESTION_STATUSES, 'Status');
  if (statusResult.error) return statusResult;

  const locationResult = await parseLocation(payload.locationId);
  if (locationResult.error) return locationResult;

  const visibilityResult = normalizeEnum(payload.visibility || 'public', CIVIC_QUESTION_VISIBILITIES, 'Visibility');
  if (visibilityResult.error) return visibilityResult;

  const voteRestrictionResult = normalizeEnum(payload.voteRestriction || 'authenticated', CIVIC_QUESTION_VOTE_RESTRICTIONS, 'Vote restriction');
  if (voteRestrictionResult.error) return voteRestrictionResult;

  const resultsVisibilityResult = normalizeEnum(payload.resultsVisibility || 'always', CIVIC_QUESTION_RESULTS_VISIBILITIES, 'Results visibility');
  if (resultsVisibilityResult.error) return resultsVisibilityResult;

  const categoryResult = normalizeOptionalText(payload.category, 'Category', 2, 100);
  if (categoryResult.error) return categoryResult;

  const officialIdentifierResult = normalizeOptionalText(payload.officialIdentifier, 'Official identifier', 2, 120);
  if (officialIdentifierResult.error) return officialIdentifierResult;

  const commentsEnabledResult = normalizeBoolean(payload.commentsEnabled, 'commentsEnabled');
  if (commentsEnabledResult.error) return commentsEnabledResult;

  const commentsLockedResult = normalizeBoolean(payload.commentsLocked, 'commentsLocked');
  if (commentsLockedResult.error) return commentsLockedResult;

  if (voteRestrictionResult.value === 'locals_only' && !locationResult.value) {
    return { error: 'Location is required when vote restriction is locals_only.' };
  }

  return {
    value: {
      title: titleResult.value,
      originalLink: originalLinkResult.value,
      sourceType: sourceTypeResult.value,
      sourceName: sourceNameResult.value,
      simplified: simplifiedResult.value,
      pros: prosResult.value,
      cons: consResult.value,
      dateAsked: dateAskedResult.value,
      deadline: deadlineResult.value,
      status: statusResult.value,
      locationId: locationResult.value,
      visibility: visibilityResult.value,
      voteRestriction: voteRestrictionResult.value,
      resultsVisibility: resultsVisibilityResult.value,
      category: categoryResult.value,
      officialIdentifier: officialIdentifierResult.value,
      commentsEnabled: commentsEnabledResult.value ?? true,
      commentsLocked: commentsLockedResult.value ?? false,
    },
  };
};

const validateUpdatePayload = async (payload) => {
  const updates = {};

  if (payload.title !== undefined) {
    const result = normalizeRequiredText(payload.title, 'Title', 5, 200);
    if (result.error) return result;
    updates.title = result.value;
  }

  if (payload.originalLink !== undefined) {
    const result = normalizeUrl(payload.originalLink, 'Original link', false);
    if (result.error) return result;
    updates.originalLink = result.value;
  }

  if (payload.sourceType !== undefined) {
    const result = normalizeEnum(payload.sourceType, SOURCE_TYPES, 'Source type');
    if (result.error) return result;
    updates.sourceType = result.value;
  }

  if (payload.sourceName !== undefined) {
    const result = normalizeOptionalText(payload.sourceName, 'Source name', 2, 200);
    if (result.error) return result;
    updates.sourceName = result.value;
  }

  if (payload.simplified !== undefined) {
    const result = normalizeOptionalText(payload.simplified, 'Simplified text', 3, 20000);
    if (result.error) return result;
    updates.simplified = result.value;
  }

  if (payload.pros !== undefined) {
    const result = normalizeOptionalText(payload.pros, 'Pros', 3, 20000);
    if (result.error) return result;
    updates.pros = result.value;
  }

  if (payload.cons !== undefined) {
    const result = normalizeOptionalText(payload.cons, 'Cons', 3, 20000);
    if (result.error) return result;
    updates.cons = result.value;
  }

  if (payload.dateAsked !== undefined) {
    const result = normalizeDate(payload.dateAsked, 'Date asked');
    if (result.error) return result;
    updates.dateAsked = result.value;
  }

  if (payload.deadline !== undefined) {
    const result = normalizeDate(payload.deadline, 'Deadline');
    if (result.error) return result;
    updates.deadline = result.value;
  }

  if (payload.status !== undefined) {
    const result = normalizeEnum(payload.status, CIVIC_QUESTION_STATUSES, 'Status');
    if (result.error) return result;
    updates.status = result.value;
  }

  if (payload.locationId !== undefined) {
    const result = await parseLocation(payload.locationId);
    if (result.error) return result;
    updates.locationId = result.value;
  }

  if (payload.visibility !== undefined) {
    const result = normalizeEnum(payload.visibility, CIVIC_QUESTION_VISIBILITIES, 'Visibility');
    if (result.error) return result;
    updates.visibility = result.value;
  }

  if (payload.voteRestriction !== undefined) {
    const result = normalizeEnum(payload.voteRestriction, CIVIC_QUESTION_VOTE_RESTRICTIONS, 'Vote restriction');
    if (result.error) return result;
    updates.voteRestriction = result.value;
  }

  if (payload.resultsVisibility !== undefined) {
    const result = normalizeEnum(payload.resultsVisibility, CIVIC_QUESTION_RESULTS_VISIBILITIES, 'Results visibility');
    if (result.error) return result;
    updates.resultsVisibility = result.value;
  }

  if (payload.category !== undefined) {
    const result = normalizeOptionalText(payload.category, 'Category', 2, 100);
    if (result.error) return result;
    updates.category = result.value;
  }

  if (payload.officialIdentifier !== undefined) {
    const result = normalizeOptionalText(payload.officialIdentifier, 'Official identifier', 2, 120);
    if (result.error) return result;
    updates.officialIdentifier = result.value;
  }

  if (payload.commentsEnabled !== undefined) {
    const result = normalizeBoolean(payload.commentsEnabled, 'commentsEnabled');
    if (result.error) return result;
    updates.commentsEnabled = result.value;
  }

  if (payload.commentsLocked !== undefined) {
    const result = normalizeBoolean(payload.commentsLocked, 'commentsLocked');
    if (result.error) return result;
    updates.commentsLocked = result.value;
  }

  return { value: updates };
};

const listCivicQuestions = async (query, user) => {
  try {
    const page = Math.max(1, parsePositiveInteger(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parsePositiveInteger(query.limit) || 12));
    const offset = (page - 1) * limit;

    const where = {};

    const statusFilter = normalizeEnum(query.status, CIVIC_QUESTION_STATUSES, 'Status');
    if (statusFilter.error) return { success: false, status: 400, message: statusFilter.error };
    if (statusFilter.value) where.status = statusFilter.value;

    const sourceTypeFilter = normalizeEnum(query.sourceType, SOURCE_TYPES, 'Source type');
    if (sourceTypeFilter.error) return { success: false, status: 400, message: sourceTypeFilter.error };
    if (sourceTypeFilter.value) where.sourceType = sourceTypeFilter.value;

    const sortByFilter = normalizeEnum(query.sortBy || query.sort, CIVIC_QUESTION_SORT_OPTIONS, 'Sort');
    if (sortByFilter.error) return { success: false, status: 400, message: sortByFilter.error };
    const sortBy = sortByFilter.value || 'newest';

    if (query.locationId !== undefined) {
      const locationId = parsePositiveInteger(query.locationId);
      if (!locationId) return { success: false, status: 400, message: 'Invalid locationId.' };
      where.locationId = locationId;
    }

    if (query.category) {
      const category = normalizeLikeSearchTerm(query.category);
      if (category) {
        where.category = { [Op.like]: `%${category}%` };
      }
    }

    if (query.search) {
      const search = normalizeLikeSearchTerm(query.search);
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { simplified: { [Op.like]: `%${search}%` } },
          { sourceName: { [Op.like]: `%${search}%` } },
        ];
      }
    }

    const include = [
      { model: User, as: 'creator', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
      { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'population', 'population_override'], required: false },
    ];

    if (query.location) {
      const locationSearch = normalizeLikeSearchTerm(query.location);
      if (locationSearch) {
        include[1].required = true;
        include[1].where = {
          name: { [Op.like]: `%${locationSearch}%` },
        };
      }
    }

    const visibilityWhere = await buildVisibilityWhere(user);
    const fullWhere = Object.keys(visibilityWhere).length > 0
      ? { [Op.and]: [where, visibilityWhere] }
      : where;

    if (sortBy === 'most_voted') {
      const allRows = await CivicQuestion.findAll({
        where: fullWhere,
        include,
        order: [['createdAt', 'DESC']],
      });

      const allEnriched = await Promise.all(allRows.map((row) => attachVoteData(row.toJSON(), user?.id || null)));
      allEnriched.sort((a, b) => {
        if ((b.totalVotes || 0) !== (a.totalVotes || 0)) {
          return (b.totalVotes || 0) - (a.totalVotes || 0);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      const paged = allEnriched.slice(offset, offset + limit);
      const total = allEnriched.length;

      return {
        success: true,
        status: 200,
        data: {
          civicQuestions: paged,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    }

    const order = sortBy === 'closing_soon'
      ? [
          [sequelize.literal("CASE WHEN status = 'open' AND deadline IS NOT NULL AND deadline > CURRENT_TIMESTAMP THEN 0 WHEN status = 'open' THEN 1 ELSE 2 END"), 'ASC'],
          ['deadline', 'ASC'],
          ['createdAt', 'DESC'],
        ]
      : [['createdAt', 'DESC']];

    const { rows, count } = await CivicQuestion.findAndCountAll({
      where: fullWhere,
      include,
      order,
      limit,
      offset,
      distinct: true,
    });

    const enriched = await Promise.all(rows.map((row) => attachVoteData(row.toJSON(), user?.id || null)));

    return {
      success: true,
      status: 200,
      data: {
        civicQuestions: enriched,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    };
  } catch (error) {
    console.error('List civic questions error:', error);
    return { success: false, status: 500, message: 'Error fetching civic questions.' };
  }
};

const getCivicQuestionById = async (id, user) => {
  try {
    const questionId = parsePositiveInteger(id);
    if (!questionId) {
      return { success: false, status: 400, message: 'Invalid civic question ID.' };
    }

    const question = await CivicQuestion.findByPk(questionId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'population', 'population_override'], required: false },
      ],
    });

    if (!question) {
      return { success: false, status: 404, message: 'Civic question not found.' };
    }

    const plain = question.toJSON();
    const allowed = await canViewQuestion(plain, user);
    if (!allowed) {
      return { success: false, status: 403, message: 'Access denied.' };
    }

    const withVoteData = await attachVoteData(plain, user?.id || null);
    const resultsAllowed = await canViewResults(plain, user);

    if (!resultsAllowed) {
      withVoteData.voteCounts = null;
      withVoteData.totalVotes = null;
      withVoteData.percentages = null;
    }

    withVoteData.canViewResults = resultsAllowed;

    return { success: true, status: 200, data: withVoteData };
  } catch (error) {
    console.error('Get civic question by ID error:', error);
    return { success: false, status: 500, message: 'Error fetching civic question.' };
  }
};

const createCivicQuestion = async (userId, payload) => {
  try {
    const validated = await validateCreatePayload(payload);
    if (validated.error) {
      return { success: false, status: 400, message: validated.error };
    }

    const created = await CivicQuestion.create({
      ...validated.value,
      creatorId: userId,
    });

    const withIncludes = await CivicQuestion.findByPk(created.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'population', 'population_override'], required: false },
      ],
    });

    return {
      success: true,
      status: 201,
      data: await attachVoteData(withIncludes.toJSON(), userId),
    };
  } catch (error) {
    console.error('Create civic question error:', error);
    return { success: false, status: 500, message: 'Error creating civic question.' };
  }
};

const updateCivicQuestion = async (id, userId, userRole, payload) => {
  try {
    const questionId = parsePositiveInteger(id);
    if (!questionId) {
      return { success: false, status: 400, message: 'Invalid civic question ID.' };
    }

    const question = await CivicQuestion.findByPk(questionId);
    if (!question) {
      return { success: false, status: 404, message: 'Civic question not found.' };
    }

    const canEdit = question.creatorId === userId || ['admin', 'moderator'].includes(userRole);
    if (!canEdit) {
      return { success: false, status: 403, message: 'Forbidden.' };
    }

    const validated = await validateUpdatePayload(payload);
    if (validated.error) {
      return { success: false, status: 400, message: validated.error };
    }

    const nextVoteRestriction = validated.value.voteRestriction !== undefined
      ? validated.value.voteRestriction
      : question.voteRestriction;
    const nextLocationId = validated.value.locationId !== undefined ? validated.value.locationId : question.locationId;
    if (nextVoteRestriction === 'locals_only' && !nextLocationId) {
      return { success: false, status: 400, message: 'Location is required when vote restriction is locals_only.' };
    }

    await question.update(validated.value);

    const withIncludes = await CivicQuestion.findByPk(question.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'population', 'population_override'], required: false },
      ],
    });

    return {
      success: true,
      status: 200,
      data: await attachVoteData(withIncludes.toJSON(), userId),
    };
  } catch (error) {
    console.error('Update civic question error:', error);
    return { success: false, status: 500, message: 'Error updating civic question.' };
  }
};

const deleteCivicQuestion = async (id, userId, userRole) => {
  try {
    const questionId = parsePositiveInteger(id);
    if (!questionId) {
      return { success: false, status: 400, message: 'Invalid civic question ID.' };
    }

    const question = await CivicQuestion.findByPk(questionId);
    if (!question) {
      return { success: false, status: 404, message: 'Civic question not found.' };
    }

    const canDelete = question.creatorId === userId || ['admin', 'moderator'].includes(userRole);
    if (!canDelete) {
      return { success: false, status: 403, message: 'Forbidden.' };
    }

    await question.destroy();
    return { success: true, status: 200 };
  } catch (error) {
    console.error('Delete civic question error:', error);
    return { success: false, status: 500, message: 'Error deleting civic question.' };
  }
};

const voteCivicQuestion = async (id, user, payload) => {
  try {
    const questionId = parsePositiveInteger(id);
    if (!questionId) {
      return { success: false, status: 400, message: 'Invalid civic question ID.' };
    }

    const choiceResult = normalizeEnum(payload.choice, CIVIC_QUESTION_CHOICES, 'Choice');
    if (choiceResult.error) {
      return { success: false, status: 400, message: choiceResult.error };
    }

    const question = await CivicQuestion.findByPk(questionId);
    if (!question) {
      return { success: false, status: 404, message: 'Civic question not found.' };
    }

    const plain = question.toJSON();

    const canView = await canViewQuestion(plain, user);
    if (!canView) {
      return { success: false, status: 403, message: 'Access denied.' };
    }

    if (question.status !== 'open') {
      return { success: false, status: 400, message: 'Voting is closed for this civic question.' };
    }

    if (question.deadline && new Date(question.deadline) <= new Date()) {
      return { success: false, status: 400, message: 'Voting deadline has passed for this civic question.' };
    }

    if (question.voteRestriction === 'locals_only') {
      const allowed = await hasLocalAccess(user, question.locationId);
      if (!allowed) {
        return { success: false, status: 403, message: 'This civic question is restricted to local users.' };
      }
    }

    const existing = await CivicQuestionVote.findOne({
      where: { civicQuestionId: questionId, userId: user.id },
    });

    if (existing) {
      await existing.update({ choice: choiceResult.value });
    } else {
      await CivicQuestionVote.create({
        civicQuestionId: questionId,
        userId: user.id,
        choice: choiceResult.value,
      });
    }

    const refreshed = await CivicQuestion.findByPk(question.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'population', 'population_override'], required: false },
      ],
    });

    return {
      success: true,
      status: 200,
      data: await attachVoteData(refreshed.toJSON(), user.id),
    };
  } catch (error) {
    console.error('Vote civic question error:', error);
    return { success: false, status: 500, message: 'Error processing civic question vote.' };
  }
};

const getCivicQuestionResults = async (id, user) => {
  try {
    const questionId = parsePositiveInteger(id);
    if (!questionId) {
      return { success: false, status: 400, message: 'Invalid civic question ID.' };
    }

    const question = await CivicQuestion.findByPk(questionId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'slug', 'population', 'population_override'], required: false },
      ],
    });

    if (!question) {
      return { success: false, status: 404, message: 'Civic question not found.' };
    }

    const plain = question.toJSON();
    const allowed = await canViewQuestion(plain, user);
    if (!allowed) {
      return { success: false, status: 403, message: 'Access denied.' };
    }

    const canView = await canViewResults(plain, user);
    if (!canView) {
      return { success: false, status: 403, message: 'Results are not available yet.' };
    }

    return {
      success: true,
      status: 200,
      data: await attachVoteData(plain, user?.id || null),
    };
  } catch (error) {
    console.error('Get civic question results error:', error);
    return { success: false, status: 500, message: 'Error fetching civic question results.' };
  }
};

module.exports = {
  SOURCE_TYPES,
  CIVIC_QUESTION_STATUSES,
  CIVIC_QUESTION_VISIBILITIES,
  CIVIC_QUESTION_VOTE_RESTRICTIONS,
  CIVIC_QUESTION_RESULTS_VISIBILITIES,
  CIVIC_QUESTION_CHOICES,
  listCivicQuestions,
  getCivicQuestionById,
  createCivicQuestion,
  updateCivicQuestion,
  deleteCivicQuestion,
  voteCivicQuestion,
  getCivicQuestionResults,
};
