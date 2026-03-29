'use strict';

const pollService = require('../services/pollService');

// ---------------------------------------------------------------------------
// Request helpers (stay in the controller — they read from req)
// ---------------------------------------------------------------------------

/** Extract the client IP from the request object. */
const getClientIp = (req) =>
  req.ip || (req.ips && req.ips[0]) || req.socket?.remoteAddress;

/** Extract the User-Agent header from the request object. */
const getUserAgent = (req) => req.headers['user-agent'] || 'unknown';

/**
 * Build a minimal plain user object from req.user.
 * Returns null when the request is unauthenticated.
 */
const toUserObj = (reqUser) =>
  reqUser ? { id: reqUser.id, role: reqUser.role } : null;

// ---------------------------------------------------------------------------
// Controller — thin HTTP layer
// ---------------------------------------------------------------------------

const pollController = {
  // Create a new poll
  createPoll: async (req, res) => {
    const result = await pollService.createPoll(req.user.id, req.body);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    const responsePoll = pollService.sanitizePoll(result.data, toUserObj(req.user));
    return res.status(201).json({
      success: true,
      message: 'Poll created successfully.',
      data: responsePoll
    });
  },

  // Get all polls with filtering and pagination
  getAllPolls: async (req, res) => {
    const result = await pollService.getAllPolls(req.query, toUserObj(req.user));
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    return res.status(200).json({
      success: true,
      data: result.data.polls,
      pagination: result.data.pagination
    });
  },

  // Get a specific poll by ID
  getPollById: async (req, res) => {
    const result = await pollService.getPollById(req.params.id, toUserObj(req.user));
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  },

  // Update a poll
  updatePoll: async (req, res) => {
    const result = await pollService.updatePoll(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    const responsePoll = pollService.sanitizePoll(result.data, toUserObj(req.user));
    return res.status(200).json({
      success: true,
      message: 'Poll updated successfully.',
      data: responsePoll
    });
  },

  // Delete a poll
  deletePoll: async (req, res) => {
    const result = await pollService.deletePoll(req.params.id, req.user.id, req.user.role);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Poll and all related data deleted successfully.'
    });
  },

  // Vote on a poll
  votePoll: async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const result = await pollService.votePoll(
      req.params.id,
      req.body.optionId,
      userId,
      getClientIp(req),
      getUserAgent(req)
    );
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Vote recorded successfully.',
      data: result.data
    });
  },

  // Add a user-contributed option to a poll
  addPollOption: async (req, res) => {
    const { text, photoUrl, linkUrl, displayText, answerType } = req.body;
    const result = await pollService.addPollOption(req.params.id, req.user.id, {
      text,
      photoUrl,
      linkUrl,
      displayText,
      answerType
    });
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    return res.status(201).json({
      success: true,
      message: 'Option added successfully.',
      data: result.data
    });
  },

  // Get poll results
  getResults: async (req, res) => {
    const result = await pollService.getResults(
      req.params.id,
      toUserObj(req.user),
      getClientIp(req),
      getUserAgent(req)
    );
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  },

  // Get polls that the authenticated user has voted in
  getMyVotedPolls: async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await pollService.getMyVotedPolls(req.user.id, page, limit);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    return res.status(200).json({
      success: true,
      data: result.data.votes,
      pagination: result.data.pagination
    });
  },

  // Export auditable poll data (creator / admin only)
  exportPoll: async (req, res) => {
    const result = await pollService.exportPoll(req.params.id, req.user.id, req.user.role);
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
        ...(result.error !== undefined && { error: result.error })
      });
    }
    return res.status(200).json({
      success: true,
      data: result.data
    });
  },

  // Get poll counts grouped by category
  getCategoryCounts: async (req, res) => {
    const result = await pollService.getCategoryCounts(req.query);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    return res.status(200).json(result);
  }
};

module.exports = pollController;
