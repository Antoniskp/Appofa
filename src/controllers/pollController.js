const { Poll, PollOption, Vote, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 1000;
const OPTION_TEXT_MIN_LENGTH = 1;
const OPTION_TEXT_MAX_LENGTH = 1000;
const FREE_TEXT_MAX_LENGTH = 2000;
const POLL_STATUSES = ['open', 'closed'];
const POLL_TYPES = ['simple', 'complex'];
const QUESTION_TYPES = ['single-choice', 'ranked-choice', 'free-text'];

const normalizeRequiredText = (value, fieldLabel, minLength, maxLength) => {
  if (typeof value !== 'string') {
    return { error: `${fieldLabel} must be a string.` };
  }
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return { error: `${fieldLabel} is required.` };
  }
  if (minLength != null && trimmedValue.length < minLength) {
    return { error: `${fieldLabel} must be between ${minLength} and ${maxLength} characters.` };
  }
  if (maxLength != null && trimmedValue.length > maxLength) {
    return { error: `${fieldLabel} must be between ${minLength} and ${maxLength} characters.` };
  }
  return { value: trimmedValue };
};

const normalizeOptionalText = (value, fieldLabel, minLength, maxLength) => {
  if (value === undefined) {
    return { value: undefined };
  }
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== 'string') {
    return { error: `${fieldLabel} must be a string.` };
  }
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return { value: null };
  }
  if (minLength != null && trimmedValue.length < minLength) {
    return { error: `${fieldLabel} must be at least ${minLength} characters.` };
  }
  if (maxLength != null && trimmedValue.length > maxLength) {
    return { error: `${fieldLabel} must be ${maxLength} characters or fewer.` };
  }
  return { value: trimmedValue };
};

const normalizeBoolean = (value, fieldLabel) => {
  if (value === undefined) {
    return { value: undefined };
  }
  if (typeof value !== 'boolean') {
    return { error: `${fieldLabel} must be a boolean.` };
  }
  return { value };
};

const normalizeStatus = (status) => {
  if (status === undefined) {
    return { value: undefined };
  }
  if (typeof status !== 'string') {
    return { error: 'Status must be a string.' };
  }
  const trimmedStatus = status.trim();
  if (!POLL_STATUSES.includes(trimmedStatus)) {
    return { error: `Status must be one of: ${POLL_STATUSES.join(', ')}.` };
  }
  return { value: trimmedStatus };
};

const normalizePollType = (type) => {
  if (type === undefined) {
    return { value: undefined };
  }
  if (typeof type !== 'string') {
    return { error: 'Poll type must be a string.' };
  }
  const trimmedType = type.trim();
  if (!POLL_TYPES.includes(trimmedType)) {
    return { error: `Poll type must be one of: ${POLL_TYPES.join(', ')}.` };
  }
  return { value: trimmedType };
};

const normalizeQuestionType = (type) => {
  if (type === undefined) {
    return { value: undefined };
  }
  if (typeof type !== 'string') {
    return { error: 'Question type must be a string.' };
  }
  const trimmedType = type.trim();
  if (!QUESTION_TYPES.includes(trimmedType)) {
    return { error: `Question type must be one of: ${QUESTION_TYPES.join(', ')}.` };
  }
  return { value: trimmedType };
};

const normalizeOptions = (options) => {
  if (!Array.isArray(options)) {
    return { error: 'Options must be an array.' };
  }
  if (options.length < 2) {
    return { error: 'Poll must have at least 2 options.' };
  }
  if (options.length > 50) {
    return { error: 'Poll cannot have more than 50 options.' };
  }

  const normalizedOptions = [];
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    if (typeof option !== 'object' || option === null) {
      return { error: `Option ${i + 1} must be an object.` };
    }

    const textResult = normalizeRequiredText(
      option.optionText,
      `Option ${i + 1} text`,
      OPTION_TEXT_MIN_LENGTH,
      OPTION_TEXT_MAX_LENGTH
    );
    if (textResult.error) {
      return { error: textResult.error };
    }

    normalizedOptions.push({
      optionText: textResult.value,
      optionType: option.optionType || 'text',
      imageUrl: option.imageUrl || null,
      linkUrl: option.linkUrl || null,
      displayName: option.displayName || null,
      metadata: option.metadata || {},
      order: i
    });
  }

  return { value: normalizedOptions };
};

const getClientIp = (req) => {
  return req.ip || req.connection.remoteAddress || 'unknown';
};

const pollController = {
  // Create a new poll
  createPoll: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        title,
        description,
        pollType,
        questionType,
        allowUnauthenticatedVoting,
        allowUserAddOptions,
        settings,
        options
      } = req.body;

      // Validate authentication
      if (!req.user) {
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Validate title
      const titleResult = normalizeRequiredText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
      if (titleResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: titleResult.error
        });
      }

      // Validate description
      const descriptionResult = normalizeOptionalText(description, 'Description', null, DESCRIPTION_MAX_LENGTH);
      if (descriptionResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: descriptionResult.error
        });
      }

      // Validate poll type
      const pollTypeResult = normalizePollType(pollType);
      if (pollTypeResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: pollTypeResult.error
        });
      }

      // Validate question type
      const questionTypeResult = normalizeQuestionType(questionType);
      if (questionTypeResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: questionTypeResult.error
        });
      }

      // Validate options (skip for free-text polls)
      const resolvedQuestionType = questionTypeResult.value || 'single-choice';
      if (resolvedQuestionType !== 'free-text') {
        if (!options) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Options are required for non free-text polls.'
          });
        }

        const optionsResult = normalizeOptions(options);
        if (optionsResult.error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: optionsResult.error
          });
        }
      }

      // Create poll
      const poll = await Poll.create({
        title: titleResult.value,
        description: descriptionResult.value,
        status: 'open',
        creatorId: req.user.id,
        pollType: pollTypeResult.value || 'simple',
        questionType: resolvedQuestionType,
        allowUnauthenticatedVoting: allowUnauthenticatedVoting || false,
        allowUserAddOptions: allowUserAddOptions || false,
        settings: settings || {}
      }, { transaction });

      // Create poll options (if not free-text)
      if (resolvedQuestionType !== 'free-text' && options) {
        const optionsResult = normalizeOptions(options);
        const pollOptions = optionsResult.value.map(opt => ({
          ...opt,
          pollId: poll.id
        }));

        await PollOption.bulkCreate(pollOptions, { transaction });
      }

      await transaction.commit();

      // Fetch created poll with options and creator
      const createdPoll = await Poll.findByPk(poll.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: PollOption,
            as: 'options',
            order: [['order', 'ASC']]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Poll created successfully.',
        data: { poll: createdPoll }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Create poll error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating poll.'
      });
    }
  },

  // Get all polls
  getAllPolls: async (req, res) => {
    try {
      const { status, pollType, creatorId, page = 1, limit = 10 } = req.query;

      // Validate pagination parameters
      const parsedPage = Number(page);
      const parsedLimit = Number(limit);

      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid page parameter.'
        });
      }

      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit parameter. Must be between 1 and 100.'
        });
      }

      const where = {};

      // Filter by status
      if (status) {
        if (!POLL_STATUSES.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${POLL_STATUSES.join(', ')}.`
          });
        }
        where.status = status;
      }

      // Filter by poll type
      if (pollType) {
        if (!POLL_TYPES.includes(pollType)) {
          return res.status(400).json({
            success: false,
            message: `Invalid poll type. Must be one of: ${POLL_TYPES.join(', ')}.`
          });
        }
        where.pollType = pollType;
      }

      // Filter by creator
      if (creatorId !== undefined) {
        const parsedCreatorId = Number(creatorId);
        if (!Number.isInteger(parsedCreatorId) || parsedCreatorId < 1) {
          return res.status(400).json({
            success: false,
            message: 'Invalid creator ID.'
          });
        }
        where.creatorId = parsedCreatorId;
      }

      const offset = (parsedPage - 1) * parsedLimit;

      const { count, rows: polls } = await Poll.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: PollOption,
            as: 'options',
            attributes: ['id', 'optionText', 'order'],
            separate: true,
            order: [['order', 'ASC']]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parsedLimit,
        offset: parseInt(offset)
      });

      // Add vote count and user vote status for each poll
      const pollsWithMetadata = await Promise.all(polls.map(async (poll) => {
        const pollJson = poll.toJSON();
        
        // Get total vote count
        const voteCount = await Vote.count({
          where: { pollId: poll.id }
        });
        
        pollJson.voteCount = voteCount;
        pollJson.optionCount = pollJson.options ? pollJson.options.length : 0;

        // Check if current user has voted (if authenticated)
        if (req.user) {
          const userVote = await Vote.findOne({
            where: {
              pollId: poll.id,
              userId: req.user.id
            }
          });
          pollJson.hasVoted = !!userVote;
        } else {
          pollJson.hasVoted = false;
        }

        return pollJson;
      }));

      res.status(200).json({
        success: true,
        data: {
          polls: pollsWithMetadata,
          pagination: {
            total: count,
            page: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(count / parsedLimit)
          }
        }
      });
    } catch (error) {
      console.error('Get polls error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching polls.'
      });
    }
  },

  // Get single poll by ID
  getPollById: async (req, res) => {
    try {
      const { id } = req.params;

      const poll = await Poll.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: PollOption,
            as: 'options',
            order: [['order', 'ASC']]
          }
        ]
      });

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      const pollJson = poll.toJSON();

      // Calculate vote counts per option
      if (pollJson.options && pollJson.options.length > 0) {
        const voteCounts = await Vote.findAll({
          where: { pollId: poll.id },
          attributes: [
            'optionId',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['optionId']
        });

        const voteCountMap = {};
        voteCounts.forEach(vc => {
          voteCountMap[vc.optionId] = parseInt(vc.dataValues.count);
        });

        pollJson.options = pollJson.options.map(option => ({
          ...option,
          voteCount: voteCountMap[option.id] || 0
        }));
      }

      // Get total vote count
      const totalVotes = await Vote.count({
        where: { pollId: poll.id }
      });
      pollJson.totalVotes = totalVotes;

      // If authenticated, include user's votes
      if (req.user) {
        const userVotes = await Vote.findAll({
          where: {
            pollId: poll.id,
            userId: req.user.id
          },
          include: [
            {
              model: PollOption,
              as: 'option',
              attributes: ['id', 'optionText']
            }
          ]
        });
        pollJson.userVotes = userVotes;
      }

      res.status(200).json({
        success: true,
        data: { poll: pollJson }
      });
    } catch (error) {
      console.error('Get poll error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching poll.'
      });
    }
  },

  // Update poll
  updatePoll: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, status } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const poll = await Poll.findByPk(id);

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      // Check permissions: creator or admin
      if (poll.creatorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this poll.'
        });
      }

      // Check if poll has votes - prevent manipulation
      const voteCount = await Vote.count({
        where: { pollId: poll.id }
      });

      if (voteCount > 0 && (title !== undefined || status === 'closed')) {
        // Allow closing poll but not changing title if votes exist
        if (title !== undefined) {
          return res.status(400).json({
            success: false,
            message: 'Cannot modify poll title after votes have been cast.'
          });
        }
      }

      // Validate and update title
      if (title !== undefined) {
        const titleResult = normalizeOptionalText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
        if (titleResult.error) {
          return res.status(400).json({
            success: false,
            message: titleResult.error
          });
        }
        if (titleResult.value !== undefined && titleResult.value !== null) {
          poll.title = titleResult.value;
        }
      }

      // Validate and update description
      if (description !== undefined) {
        const descriptionResult = normalizeOptionalText(description, 'Description', null, DESCRIPTION_MAX_LENGTH);
        if (descriptionResult.error) {
          return res.status(400).json({
            success: false,
            message: descriptionResult.error
          });
        }
        poll.description = descriptionResult.value;
      }

      // Validate and update status
      if (status !== undefined) {
        const statusResult = normalizeStatus(status);
        if (statusResult.error) {
          return res.status(400).json({
            success: false,
            message: statusResult.error
          });
        }
        if (statusResult.value) {
          poll.status = statusResult.value;
        }
      }

      await poll.save();

      // Fetch updated poll with creator info
      const updatedPoll = await Poll.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: PollOption,
            as: 'options',
            order: [['order', 'ASC']]
          }
        ]
      });

      res.status(200).json({
        success: true,
        message: 'Poll updated successfully.',
        data: { poll: updatedPoll }
      });
    } catch (error) {
      console.error('Update poll error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating poll.'
      });
    }
  },

  // Delete poll
  deletePoll: async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const poll = await Poll.findByPk(id);

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      // Check permissions: creator or admin
      if (poll.creatorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this poll.'
        });
      }

      // Delete poll (cascade will handle options and votes)
      await poll.destroy();

      res.status(200).json({
        success: true,
        message: 'Poll deleted successfully.'
      });
    } catch (error) {
      console.error('Delete poll error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting poll.'
      });
    }
  },

  // Submit a vote
  vote: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { optionId, optionIds, freeTextResponse, sessionId } = req.body;

      const poll = await Poll.findByPk(id, {
        include: [
          {
            model: PollOption,
            as: 'options'
          }
        ]
      });

      if (!poll) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      // Check if poll is open
      if (poll.status !== 'open') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Poll is closed.'
        });
      }

      // Check authentication requirements
      if (!poll.allowUnauthenticatedVoting && !req.user) {
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: 'Authentication required to vote on this poll.'
        });
      }

      const isAuthenticated = !!req.user;
      const userId = req.user ? req.user.id : null;
      const clientIp = getClientIp(req);

      // Check for duplicate votes
      const existingVoteWhere = { pollId: poll.id };
      if (isAuthenticated) {
        existingVoteWhere.userId = userId;
      } else {
        // For unauthenticated, check by sessionId and IP
        if (!sessionId) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Session ID required for unauthenticated voting.'
          });
        }
        existingVoteWhere.sessionId = sessionId;
        existingVoteWhere.ipAddress = clientIp;
      }

      const existingVote = await Vote.findOne({
        where: existingVoteWhere
      });

      if (existingVote) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'You have already voted on this poll.'
        });
      }

      // Handle different question types
      if (poll.questionType === 'free-text') {
        // Free-text response
        if (!freeTextResponse) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Free text response is required.'
          });
        }

        const freeTextResult = normalizeRequiredText(
          freeTextResponse,
          'Free text response',
          1,
          FREE_TEXT_MAX_LENGTH
        );
        if (freeTextResult.error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: freeTextResult.error
          });
        }

        await Vote.create({
          pollId: poll.id,
          userId,
          isAuthenticated,
          freeTextResponse: freeTextResult.value,
          sessionId: sessionId || null,
          ipAddress: clientIp
        }, { transaction });

      } else if (poll.questionType === 'ranked-choice') {
        // Ranked-choice voting
        if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Option IDs array is required for ranked-choice voting.'
          });
        }

        // Validate all options belong to this poll
        const validOptionIds = poll.options.map(opt => opt.id);
        for (const optId of optionIds) {
          if (!validOptionIds.includes(optId)) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: 'Invalid option ID provided.'
            });
          }
        }

        // Create votes with rank positions
        const votes = optionIds.map((optId, index) => ({
          pollId: poll.id,
          optionId: optId,
          userId,
          isAuthenticated,
          rankPosition: index + 1,
          sessionId: sessionId || null,
          ipAddress: clientIp
        }));

        await Vote.bulkCreate(votes, { transaction });

      } else {
        // Single-choice voting
        if (!optionId) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Option ID is required.'
          });
        }

        // Validate option belongs to this poll
        const option = poll.options.find(opt => opt.id === optionId);
        if (!option) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Invalid option ID.'
          });
        }

        await Vote.create({
          pollId: poll.id,
          optionId,
          userId,
          isAuthenticated,
          sessionId: sessionId || null,
          ipAddress: clientIp
        }, { transaction });
      }

      await transaction.commit();

      // Get updated vote counts
      const voteCounts = await Vote.findAll({
        where: { pollId: poll.id },
        attributes: [
          'optionId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['optionId']
      });

      const voteCountMap = {};
      voteCounts.forEach(vc => {
        voteCountMap[vc.optionId] = parseInt(vc.dataValues.count);
      });

      const totalVotes = await Vote.count({
        where: { pollId: poll.id }
      });

      res.status(200).json({
        success: true,
        message: 'Vote submitted successfully.',
        data: {
          voteCounts: voteCountMap,
          totalVotes
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Vote error:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting vote.'
      });
    }
  },

  // Get poll results
  getPollResults: async (req, res) => {
    try {
      const { id } = req.params;

      const poll = await Poll.findByPk(id, {
        include: [
          {
            model: PollOption,
            as: 'options',
            order: [['order', 'ASC']]
          }
        ]
      });

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      const totalVotes = await Vote.count({
        where: { pollId: poll.id }
      });

      if (poll.questionType === 'free-text') {
        // Free-text responses
        const responses = await Vote.findAll({
          where: {
            pollId: poll.id,
            freeTextResponse: { [Op.ne]: null }
          },
          attributes: ['freeTextResponse', 'isAuthenticated', 'createdAt'],
          order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
          success: true,
          data: {
            poll: {
              id: poll.id,
              title: poll.title,
              questionType: poll.questionType
            },
            totalVotes,
            responses: responses.map(r => ({
              text: r.freeTextResponse,
              isAuthenticated: r.isAuthenticated,
              createdAt: r.createdAt
            }))
          }
        });
      }

      // Get vote counts per option
      const voteCounts = await Vote.findAll({
        where: { pollId: poll.id },
        attributes: [
          'optionId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN "isAuthenticated" = true THEN 1 ELSE 0 END')), 'authenticatedCount'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN "isAuthenticated" = false THEN 1 ELSE 0 END')), 'unauthenticatedCount']
        ],
        group: ['optionId'],
        raw: true
      });

      const voteCountMap = {};
      voteCounts.forEach(vc => {
        voteCountMap[vc.optionId] = {
          total: parseInt(vc.count),
          authenticated: parseInt(vc.authenticatedCount) || 0,
          unauthenticated: parseInt(vc.unauthenticatedCount) || 0
        };
      });

      // Build results with percentages
      const results = poll.options.map(option => {
        const counts = voteCountMap[option.id] || { total: 0, authenticated: 0, unauthenticated: 0 };
        const percentage = totalVotes > 0 ? (counts.total / totalVotes * 100).toFixed(2) : 0;

        return {
          id: option.id,
          optionText: option.optionText,
          displayName: option.displayName,
          imageUrl: option.imageUrl,
          voteCount: counts.total,
          authenticatedVotes: counts.authenticated,
          unauthenticatedVotes: counts.unauthenticated,
          percentage: parseFloat(percentage)
        };
      });

      // For ranked-choice, include rank distribution
      let rankDistribution = null;
      if (poll.questionType === 'ranked-choice') {
        const rankData = await Vote.findAll({
          where: {
            pollId: poll.id,
            rankPosition: { [Op.ne]: null }
          },
          attributes: [
            'optionId',
            'rankPosition',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['optionId', 'rankPosition'],
          raw: true
        });

        rankDistribution = {};
        rankData.forEach(rd => {
          if (!rankDistribution[rd.optionId]) {
            rankDistribution[rd.optionId] = {};
          }
          rankDistribution[rd.optionId][rd.rankPosition] = parseInt(rd.count);
        });
      }

      // Prepare chart-ready data
      const chartData = {
        labels: results.map(r => r.optionText || r.displayName),
        values: results.map(r => r.voteCount),
        colors: results.map((_, index) => {
          const hue = (index * 360 / results.length);
          return `hsl(${hue}, 70%, 60%)`;
        })
      };

      res.status(200).json({
        success: true,
        data: {
          poll: {
            id: poll.id,
            title: poll.title,
            questionType: poll.questionType,
            status: poll.status
          },
          totalVotes,
          results,
          rankDistribution,
          chartData
        }
      });
    } catch (error) {
      console.error('Get poll results error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching poll results.'
      });
    }
  },

  // Add poll option
  addPollOption: async (req, res) => {
    try {
      const { id } = req.params;
      const { optionText, optionType, imageUrl, linkUrl, displayName, metadata } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const poll = await Poll.findByPk(id);

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      // Check if poll allows user-added options
      if (!poll.allowUserAddOptions) {
        return res.status(403).json({
          success: false,
          message: 'This poll does not allow user-added options.'
        });
      }

      // Check if poll is open
      if (poll.status !== 'open') {
        return res.status(400).json({
          success: false,
          message: 'Cannot add options to a closed poll.'
        });
      }

      // Validate option text
      const textResult = normalizeRequiredText(
        optionText,
        'Option text',
        OPTION_TEXT_MIN_LENGTH,
        OPTION_TEXT_MAX_LENGTH
      );
      if (textResult.error) {
        return res.status(400).json({
          success: false,
          message: textResult.error
        });
      }

      // Get current max order
      const maxOrderOption = await PollOption.findOne({
        where: { pollId: poll.id },
        order: [['order', 'DESC']],
        attributes: ['order']
      });

      const nextOrder = maxOrderOption ? maxOrderOption.order + 1 : 0;

      // Create new option
      const newOption = await PollOption.create({
        pollId: poll.id,
        optionText: textResult.value,
        optionType: optionType || 'text',
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        displayName: displayName || null,
        metadata: metadata || {},
        createdById: req.user.id,
        order: nextOrder
      });

      res.status(201).json({
        success: true,
        message: 'Option added successfully.',
        data: { option: newOption }
      });
    } catch (error) {
      console.error('Add poll option error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding poll option.'
      });
    }
  }
};

module.exports = pollController;
