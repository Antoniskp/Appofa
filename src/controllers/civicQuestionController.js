'use strict';

const civicQuestionService = require('../services/civicQuestionService');

const toUserObj = (reqUser) => (reqUser ? { id: reqUser.id, role: reqUser.role } : null);

/** Extract the client IP from the request object. */
const getClientIp = (req) =>
  req.ip || (req.ips && req.ips[0]) || req.socket?.remoteAddress;

/** Extract the User-Agent header from the request object. */
const getUserAgent = (req) => req.headers['user-agent'] || 'unknown';

const civicQuestionController = {
  listCivicQuestions: async (req, res) => {
    const result = await civicQuestionService.listCivicQuestions(req.query, toUserObj(req.user));
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      data: result.data.civicQuestions,
      pagination: result.data.pagination,
    });
  },

  getCivicQuestionById: async (req, res) => {
    const clientData = { clientIp: getClientIp(req), userAgent: getUserAgent(req) };
    const result = await civicQuestionService.getCivicQuestionById(req.params.id, toUserObj(req.user), clientData);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  },

  createCivicQuestion: async (req, res) => {
    const result = await civicQuestionService.createCivicQuestion(req.user.id, req.body);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Civic question created successfully.',
      data: result.data,
    });
  },

  updateCivicQuestion: async (req, res) => {
    const result = await civicQuestionService.updateCivicQuestion(req.params.id, req.user.id, req.user.role, req.body);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Civic question updated successfully.',
      data: result.data,
    });
  },

  deleteCivicQuestion: async (req, res) => {
    const result = await civicQuestionService.deleteCivicQuestion(req.params.id, req.user.id, req.user.role);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: 'Civic question deleted successfully.' });
  },

  voteCivicQuestion: async (req, res) => {
    const clientData = { clientIp: getClientIp(req), userAgent: getUserAgent(req) };
    const result = await civicQuestionService.voteCivicQuestion(req.params.id, toUserObj(req.user), req.body, clientData);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Vote recorded successfully.',
      data: result.data,
    });
  },

  getCivicQuestionResults: async (req, res) => {
    const clientData = { clientIp: getClientIp(req), userAgent: getUserAgent(req) };
    const result = await civicQuestionService.getCivicQuestionResults(req.params.id, toUserObj(req.user), clientData);
    if (!result.success) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  },
};

module.exports = civicQuestionController;
