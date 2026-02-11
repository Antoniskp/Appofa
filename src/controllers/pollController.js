const { Poll, PollOption, PollVote, User, Location, LocationLink, sequelize } = require('../models');
const { Op } = require('sequelize');
const {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeBoolean,
  normalizeEnum,
  normalizeInteger
} = require('../utils/validators');

const POLL_TYPES = ['simple', 'complex'];
const POLL_VISIBILITIES = ['public', 'private', 'locals_only'];
const RESULTS_VISIBILITIES = ['always', 'after_vote', 'after_deadline'];
const POLL_STATUSES = ['active', 'closed', 'archived'];
const ANSWER_TYPES = ['person', 'article', 'custom'];

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 2000;
const OPTION_TEXT_MIN_LENGTH = 1;
const OPTION_TEXT_MAX_LENGTH = 500;

const shouldHideCreator = (poll, user) => {
  if (!poll?.hideCreator) return false;
  if (!user) return true;
  if (user.role === 'admin' || user.id === poll.creatorId) return false;
  return true;
};

const sanitizePoll = (poll, user) => {
  const data = poll?.toJSON ? poll.toJSON() : poll;
  if (shouldHideCreator(data, user)) {
    return {
      ...data,
      creator: null
    };
  }
  return data;
};

// Helper to get client IP address
const getClientIp = (req) => {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
};

// Helper to get user agent
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

const pollController = {
  // Create a new poll
  createPoll: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        title,
        description,
        category,
        type,
        allowUserContributions,
        allowUnauthenticatedVotes,
        visibility,
        resultsVisibility,
        deadline,
        locationId,
        options,
        hideCreator
      } = req.body;

      // Validate title
      const titleResult = normalizeRequiredText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
      if (titleResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: titleResult.error
        });
      }

      // Validate description (optional)
      const descriptionResult = normalizeOptionalText(description, 'Description', null, DESCRIPTION_MAX_LENGTH);
      if (descriptionResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: descriptionResult.error
        });
      }

      // Validate category (optional)
      const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
      if (categoryResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: categoryResult.error
        });
      }

      // Validate type
      const typeResult = normalizeEnum(type, POLL_TYPES, 'Poll type');
      if (typeResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: typeResult.error
        });
      }

      // Validate visibility
      const visibilityResult = normalizeEnum(visibility, POLL_VISIBILITIES, 'Visibility');
      if (visibilityResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: visibilityResult.error
        });
      }

      // Validate results visibility
      const resultsVisibilityResult = normalizeEnum(resultsVisibility, RESULTS_VISIBILITIES, 'Results visibility');
      if (resultsVisibilityResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: resultsVisibilityResult.error
        });
      }

      // Validate deadline (optional)
      let deadlineValue = null;
      if (deadline) {
        deadlineValue = new Date(deadline);
        if (isNaN(deadlineValue.getTime())) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Invalid deadline date.'
          });
        }
        if (deadlineValue <= new Date()) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Deadline must be in the future.'
          });
        }
      }

      // Validate locationId (optional)
      let locationIdValue = null;
      if (locationId !== undefined && locationId !== null) {
        const locationIdResult = normalizeInteger(locationId, 'Location ID', 1);
        if (locationIdResult.error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `${locationIdResult.error} Please select a valid location from the dropdown.`
          });
        }
        locationIdValue = locationIdResult.value;

        // Verify location exists
        const location = await Location.findByPk(locationIdValue);
        if (!location) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'Location not found. Please select a valid location from the dropdown.'
          });
        }
      }

      // Validate booleans
      const allowUserContributionsResult = normalizeBoolean(allowUserContributions, 'Allow user contributions');
      if (allowUserContributionsResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: allowUserContributionsResult.error
        });
      }

      const allowUnauthenticatedVotesResult = normalizeBoolean(allowUnauthenticatedVotes, 'Allow unauthenticated votes');
      if (allowUnauthenticatedVotesResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: allowUnauthenticatedVotesResult.error
        });
      }

      const hideCreatorResult = normalizeBoolean(hideCreator, 'hideCreator');
      if (hideCreatorResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: hideCreatorResult.error
        });
      }

      // Validate options
      // If user contributions are allowed, poll can be created with 0 options
      const minOptionsRequired = allowUserContributionsResult.value ? 0 : 2;
      if (!Array.isArray(options) || options.length < minOptionsRequired) {
        await transaction.rollback();
        // When minOptionsRequired is 0, the only failure is invalid array type
        // When minOptionsRequired is 2, we need at least 2 options
        const errorMessage = minOptionsRequired === 0 
          ? 'Options must be an array.'
          : 'At least 2 options are required.';
        return res.status(400).json({
          success: false,
          message: errorMessage
        });
      }

      // Create poll
      const poll = await Poll.create({
        title: titleResult.value,
        description: descriptionResult.value,
        category: categoryResult.value,
        type: typeResult.value,
        allowUserContributions: allowUserContributionsResult.value !== undefined ? allowUserContributionsResult.value : false,
        allowUnauthenticatedVotes: allowUnauthenticatedVotesResult.value !== undefined ? allowUnauthenticatedVotesResult.value : false,
        visibility: visibilityResult.value,
        resultsVisibility: resultsVisibilityResult.value,
        deadline: deadlineValue,
        locationId: locationIdValue,
        creatorId: req.user.id,
        status: 'active',
        hideCreator: hideCreatorResult.value !== undefined ? hideCreatorResult.value : false
      }, { transaction });

      // Create options
      const createdOptions = [];
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        
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
            return res.status(400).json({
              success: false,
              message: optionTextResult.error
            });
          }
          
          const pollOption = await PollOption.create({
            pollId: poll.id,
            text: optionTextResult.value,
            order: i
          }, { transaction });
          
          createdOptions.push(pollOption);
        } else {
          // For complex polls, answerType is optional
          let answerTypeValue = null;
          if (option.answerType) {
            const answerTypeResult = normalizeEnum(option.answerType, ANSWER_TYPES, 'Answer type');
            if (answerTypeResult.error) {
              await transaction.rollback();
              return res.status(400).json({
                success: false,
                message: answerTypeResult.error
              });
            }
            answerTypeValue = answerTypeResult.value;
          }

          const pollOption = await PollOption.create({
            pollId: poll.id,
            text: option.text || null,
            photoUrl: option.photoUrl || null,
            linkUrl: option.linkUrl || null,
            displayText: option.displayText || null,
            answerType: answerTypeValue,
            order: i
          }, { transaction });
          
          createdOptions.push(pollOption);
        }
      }

      // Create LocationLink if locationId is provided
      if (locationIdValue) {
        await LocationLink.create({
          location_id: locationIdValue,
          entity_type: 'poll',
          entity_id: poll.id
        }, { transaction });
      }

      await transaction.commit();

      // Fetch the created poll with associations
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
            attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order']
          }
        ]
      });

      const responsePoll = sanitizePoll(createdPoll, req.user);

      return res.status(201).json({
        success: true,
        message: 'Poll created successfully.',
        data: responsePoll
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating poll:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create poll.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all polls with filtering and pagination
  getAllPolls: async (req, res) => {
    try {
      const {
        status,
        type,
        visibility,
        category,
        page = 1,
        limit = 10
      } = req.query;

      // Build where clause
      const where = {};

      // Filter by status
      if (status) {
        const statusResult = normalizeEnum(status, POLL_STATUSES, 'Status');
        if (statusResult.error) {
          return res.status(400).json({
            success: false,
            message: statusResult.error
          });
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
          return res.status(400).json({
            success: false,
            message: typeResult.error
          });
        }
        where.type = typeResult.value;
      }

      // Filter by category
      if (category) {
        const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
        if (categoryResult.error) {
          return res.status(400).json({
            success: false,
            message: categoryResult.error
          });
        }
        where.category = categoryResult.value;
      }

      // Filter by visibility based on authentication
      if (visibility) {
        const visibilityResult = normalizeEnum(visibility, POLL_VISIBILITIES, 'Visibility');
        if (visibilityResult.error) {
          return res.status(400).json({
            success: false,
            message: visibilityResult.error
          });
        }
        where.visibility = visibilityResult.value;
      } else {
        // Show only public polls for unauthenticated users
        if (!req.user) {
          where.visibility = 'public';
        }
      }

      // Pagination
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid page number.'
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100.'
        });
      }

      const offset = (pageNum - 1) * limitNum;

      const { count, rows: polls } = await Poll.findAndCountAll({
        where,
        distinct: true,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: PollOption,
            as: 'options',
            attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order'],
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
        offset,
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
        if (shouldHideCreator(pollData, req.user)) {
          pollData.creator = null;
        }
        return pollData;
      });

      return res.status(200).json({
        success: true,
        data: pollsWithCounts,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(count / limitNum),
          totalItems: count,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      console.error('Error fetching polls:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch polls.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get a specific poll by ID
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
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'type']
          },
          {
            model: PollOption,
            as: 'options',
            attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order'],
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
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      // Check visibility permissions
      if (poll.visibility === 'private' && (!req.user || req.user.id !== poll.creatorId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This poll is private.'
        });
      }

      if (poll.visibility === 'locals_only' && !req.user) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Authentication required for local polls.'
        });
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
      pollData.totalAuthenticatedVotes = pollData.options.reduce((sum, opt) => sum + opt.authenticatedVotes, 0);

      const responsePoll = shouldHideCreator(pollData, req.user)
        ? { ...pollData, creator: null }
        : pollData;

      // Check if user has voted
      if (req.user) {
        const userVote = await PollVote.findOne({
          where: { pollId: id, userId: req.user.id }
        });
        if (userVote) {
          pollData.userVote = {
            optionId: userVote.optionId,
            createdAt: userVote.createdAt
          };
        }
      }

      return res.status(200).json({
        success: true,
        data: responsePoll
      });
    } catch (error) {
      console.error('Error fetching poll:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch poll.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Update a poll
  updatePoll: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { title, description, category, deadline, status, locationId, hideCreator } = req.body;

      const poll = await Poll.findByPk(id, {
        include: [
          {
            model: PollVote,
            as: 'votes'
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

      // Check permissions - must be creator or admin
      if (poll.creatorId !== req.user.id && req.user.role !== 'admin') {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only the poll creator or admin can update this poll.'
        });
      }

      const updateData = {};

      // Validate and update title
      if (title !== undefined) {
        const titleResult = normalizeRequiredText(title, 'Title', TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
        if (titleResult.error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: titleResult.error
          });
        }
        updateData.title = titleResult.value;
      }

      // Validate and update description
      if (description !== undefined) {
        const descriptionResult = normalizeOptionalText(description, 'Description', null, DESCRIPTION_MAX_LENGTH);
        if (descriptionResult.error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: descriptionResult.error
          });
        }
        updateData.description = descriptionResult.value;
      }

      // Validate and update category
      if (category !== undefined) {
        const categoryResult = normalizeOptionalText(category, 'Category', null, 100);
        if (categoryResult.error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: categoryResult.error
          });
        }
        updateData.category = categoryResult.value;
      }

      // Validate and update deadline
      if (deadline !== undefined) {
        if (deadline === null) {
          updateData.deadline = null;
        } else {
          const deadlineValue = new Date(deadline);
          if (isNaN(deadlineValue.getTime())) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: 'Invalid deadline date.'
            });
          }
          updateData.deadline = deadlineValue;
        }
      }

      // Validate and update status
      if (status !== undefined) {
        const statusResult = normalizeEnum(status, POLL_STATUSES, 'Status');
        if (statusResult.error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: statusResult.error
          });
        }
        updateData.status = statusResult.value;
      }

      // Validate and update locationId
      if (locationId !== undefined) {
        if (locationId === null) {
          updateData.locationId = null;
        } else {
          const locationIdResult = normalizeInteger(locationId, 'Location ID', 1);
          if (locationIdResult.error) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `${locationIdResult.error} Please select a valid location from the dropdown.`
            });
          }
          // Verify location exists
          const location = await Location.findByPk(locationIdResult.value);
          if (!location) {
            await transaction.rollback();
            return res.status(404).json({
              success: false,
              message: 'Location not found. Please select a valid location from the dropdown.'
            });
          }
          updateData.locationId = locationIdResult.value;
        }
      }

      if (hideCreator !== undefined) {
        const hideCreatorResult = normalizeBoolean(hideCreator, 'hideCreator');
        if (hideCreatorResult.error) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: hideCreatorResult.error
          });
        }
        updateData.hideCreator = hideCreatorResult.value;
      }

      // Update the poll
      await poll.update(updateData, { transaction });

      // Update LocationLink if locationId changed
      if (locationId !== undefined) {
        // Remove existing location link
        await LocationLink.destroy({
          where: {
            entity_type: 'poll',
            entity_id: id
          }
        }, { transaction });

        // Create new location link if locationId is provided
        if (updateData.locationId) {
          await LocationLink.create({
            location_id: updateData.locationId,
            entity_type: 'poll',
            entity_id: id
          }, { transaction });
        }
      }

      await transaction.commit();

      // Fetch updated poll with associations
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
            attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order']
          }
        ],
        order: [[{ model: PollOption, as: 'options' }, 'order', 'ASC']]
      });

      const responsePoll = sanitizePoll(updatedPoll, req.user);

      return res.status(200).json({
        success: true,
        message: 'Poll updated successfully.',
        data: responsePoll
      });
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
      return res.status(500).json({
        success: false,
        message: 'Failed to update poll.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Delete a poll
  deletePoll: async (req, res) => {
    try {
      const { id } = req.params;

      const poll = await Poll.findByPk(id, {
        include: [
          {
            model: PollVote,
            as: 'votes'
          }
        ]
      });

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      // Check permissions - must be creator or admin
      if (poll.creatorId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only the poll creator or admin can delete this poll.'
        });
      }

      // If poll has votes, soft delete (archive)
      if (poll.votes && poll.votes.length > 0) {
        await poll.update({ status: 'archived' });
        return res.status(200).json({
          success: true,
          message: 'Poll archived successfully (poll had votes).'
        });
      }

      // Hard delete if no votes
      await poll.destroy();

      return res.status(200).json({
        success: true,
        message: 'Poll deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting poll:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete poll.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Vote on a poll
  votePoll: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { optionId } = req.body;

      // Validate optionId
      const optionIdResult = normalizeInteger(optionId, 'Option ID', 1);
      if (optionIdResult.error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: optionIdResult.error
        });
      }

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

      // Check if poll is active
      if (poll.status !== 'active') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'This poll is not active.'
        });
      }

      // Check if poll has expired
      if (poll.deadline && new Date(poll.deadline) < new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'This poll has expired.'
        });
      }

      // Verify option belongs to this poll
      const option = poll.options.find(opt => opt.id === optionIdResult.value);
      if (!option) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid option for this poll.'
        });
      }

      // Check if unauthenticated votes are allowed
      if (!req.user && !poll.allowUnauthenticatedVotes) {
        await transaction.rollback();
        return res.status(401).json({
          success: false,
          message: 'Authentication required to vote on this poll.'
        });
      }

      let vote;
      const isAuthenticated = !!req.user;

      if (isAuthenticated) {
        // Check if user already voted
        const existingVote = await PollVote.findOne({
          where: { pollId: id, userId: req.user.id },
          transaction
        });

        if (existingVote) {
          // Update existing vote
          await existingVote.update({
            optionId: optionIdResult.value
          }, { transaction });
          vote = existingVote;
        } else {
          // Create new vote
          vote = await PollVote.create({
            pollId: id,
            optionId: optionIdResult.value,
            userId: req.user.id,
            isAuthenticated: true,
            sessionId: null,
            ipAddress: getClientIp(req)
          }, { transaction });
        }
      } else {
        // Unauthenticated vote - track by IP address + User-Agent (device fingerprint)
        const ipAddress = getClientIp(req);
        const userAgent = getUserAgent(req);

        // Check if this device has already voted on this poll
        const existingVote = await PollVote.findOne({
          where: { 
            pollId: id, 
            userId: null,
            ipAddress: ipAddress,
            userAgent: userAgent
          },
          transaction
        });

        if (existingVote) {
          // Update existing vote from this device
          await existingVote.update({
            optionId: optionIdResult.value
          }, { transaction });
          vote = existingVote;
        } else {
          // Create new vote
          vote = await PollVote.create({
            pollId: id,
            optionId: optionIdResult.value,
            userId: null,
            isAuthenticated: false,
            sessionId: null,
            ipAddress,
            userAgent
          }, { transaction });
        }
      }

      await transaction.commit();

      // Fetch updated vote counts
      const votes = await PollVote.findAll({
        where: { pollId: id },
        attributes: ['optionId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['optionId']
      });

      const voteCounts = {};
      votes.forEach(v => {
        voteCounts[v.optionId] = parseInt(v.dataValues.count, 10);
      });

      return res.status(200).json({
        success: true,
        message: 'Vote recorded successfully.',
        data: {
          voteId: vote.id,
          optionId: vote.optionId,
          voteCounts
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error voting on poll:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to record vote.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Add a user-contributed option to a poll
  addPollOption: async (req, res) => {
    try {
      const { id } = req.params;
      const { text, photoUrl, linkUrl, displayText, answerType } = req.body;

      const poll = await Poll.findByPk(id, {
        include: [
          {
            model: PollOption,
            as: 'options'
          }
        ]
      });

      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      // Check if poll allows user contributions
      if (!poll.allowUserContributions) {
        return res.status(403).json({
          success: false,
          message: 'This poll does not allow user-contributed options.'
        });
      }

      // Check if poll is active
      if (poll.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot add options to an inactive poll.'
        });
      }

      // Validate based on poll type
      let optionData = {
        pollId: id,
        addedByUserId: req.user.id,
        order: poll.options.length
      };

      if (poll.type === 'simple') {
        const textResult = normalizeRequiredText(text, 'Option text', OPTION_TEXT_MIN_LENGTH, OPTION_TEXT_MAX_LENGTH);
        if (textResult.error) {
          return res.status(400).json({
            success: false,
            message: textResult.error
          });
        }
        optionData.text = textResult.value;
      } else {
        // Complex poll - answerType is optional
        let answerTypeValue = null;
        if (answerType) {
          const answerTypeResult = normalizeEnum(answerType, ANSWER_TYPES, 'Answer type');
          if (answerTypeResult.error) {
            return res.status(400).json({
              success: false,
              message: answerTypeResult.error
            });
          }
          answerTypeValue = answerTypeResult.value;
        }

        optionData.text = text || null;
        optionData.photoUrl = photoUrl || null;
        optionData.linkUrl = linkUrl || null;
        optionData.displayText = displayText || null;
        optionData.answerType = answerTypeValue;
      }

      const option = await PollOption.create(optionData);

      return res.status(201).json({
        success: true,
        message: 'Option added successfully.',
        data: option
      });
    } catch (error) {
      console.error('Error adding poll option:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add option.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get poll results
  getResults: async (req, res) => {
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
            attributes: ['id', 'text', 'photoUrl', 'linkUrl', 'displayText', 'answerType', 'order'],
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
        return res.status(404).json({
          success: false,
          message: 'Poll not found.'
        });
      }

      // Check results visibility rules
      const canViewResults = () => {
        if (poll.resultsVisibility === 'always') {
          return true;
        }

        if (poll.resultsVisibility === 'after_vote') {
          // Check if user has voted
          if (req.user) {
            return PollVote.findOne({
              where: { pollId: id, userId: req.user.id }
            }).then(vote => !!vote);
          } else {
            // Check session vote for unauthenticated users
            const sessionId = getSessionId(req);
            return PollVote.findOne({
              where: { pollId: id, sessionId }
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
        return res.status(403).json({
          success: false,
          message: 'Results are not yet available for viewing.'
        });
      }

      // Calculate statistics
      const pollData = poll.toJSON();
      const totalVotes = pollData.options.reduce((sum, opt) => sum + (opt.votes ? opt.votes.length : 0), 0);
      
      pollData.options = pollData.options.map(option => {
        const voteCount = option.votes ? option.votes.length : 0;
        const authenticatedVotes = option.votes ? option.votes.filter(v => v.isAuthenticated).length : 0;
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
          voteCount,
          authenticatedVotes,
          unauthenticatedVotes,
          percentage: parseFloat(percentage)
        };
      });

      const totalAuthenticatedVotes = pollData.options.reduce((sum, opt) => sum + opt.authenticatedVotes, 0);
      const totalUnauthenticatedVotes = pollData.options.reduce((sum, opt) => sum + opt.unauthenticatedVotes, 0);

      const responseCreator = shouldHideCreator(poll, req.user) ? null : poll.creator;

      return res.status(200).json({
        success: true,
        data: {
          poll: {
            id: poll.id,
            title: poll.title,
            description: poll.description,
            type: poll.type,
            status: poll.status,
            deadline: poll.deadline,
            creator: responseCreator
          },
          results: {
            options: pollData.options,
            totalVotes,
            totalAuthenticatedVotes,
            totalUnauthenticatedVotes
          }
        }
      });
    } catch (error) {
      console.error('Error fetching poll results:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch poll results.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = pollController;
