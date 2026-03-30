'use strict';

const { Report, User } = require('../models');
const { Op } = require('sequelize');

const CONTENT_TYPES = ['article', 'person', 'poll', 'comment', 'candidate', 'user'];
const CATEGORIES = ['misinformation', 'harassment', 'spam', 'privacy_violation', 'impersonation', 'inappropriate_content', 'other'];

const reportController = {
  // POST /api/reports — public (optionalAuth)
  submitReport: async (req, res) => {
    const { contentType, contentId, category, message, reporterName, reporterEmail } = req.body;

    // Validate contentType
    if (!contentType || !CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing contentType.' });
    }

    // Validate contentId
    const parsedContentId = parseInt(contentId);
    if (!contentId || !Number.isInteger(parsedContentId) || parsedContentId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid or missing contentId.' });
    }

    // Validate category
    if (!category || !CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing category.' });
    }

    const isAuthenticated = !!req.user;

    // If not authenticated, require name and email
    if (!isAuthenticated) {
      if (!reporterName || !reporterEmail) {
        return res.status(400).json({ success: false, message: 'Name and email are required for unauthenticated reports.' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(reporterEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email address.' });
      }
    }

    // Check for duplicate pending report
    const duplicateWhere = { contentType, contentId: parsedContentId, status: 'pending' };
    if (isAuthenticated) {
      duplicateWhere.reportedByUserId = req.user.id;
    } else {
      duplicateWhere.reporterEmail = reporterEmail;
    }

    const existing = await Report.findOne({ where: duplicateWhere });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already submitted a pending report for this content.' });
    }

    const report = await Report.create({
      contentType,
      contentId: parsedContentId,
      category,
      message: message || null,
      reporterName: isAuthenticated ? null : reporterName,
      reporterEmail: isAuthenticated ? null : reporterEmail,
      reportedByUserId: isAuthenticated ? req.user.id : null,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      data: { report: { id: report.id, contentType: report.contentType, contentId: report.contentId, status: report.status } },
      message: 'Report submitted.'
    });
  },

  // GET /api/reports — admin/moderator
  getReports: async (req, res) => {
    const { page = 1, limit = 20, status, contentType } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (contentType) where.contentType = contentType;

    const { count, rows } = await Report.findAndCountAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username'], required: false },
        { model: User, as: 'reviewer', attributes: ['id', 'username'], required: false }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        reports: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  },

  // GET /api/reports/:id — admin/moderator
  getReportById: async (req, res) => {
    const report = await Report.findByPk(req.params.id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username'], required: false },
        { model: User, as: 'reviewer', attributes: ['id', 'username'], required: false }
      ]
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    return res.status(200).json({ success: true, data: { report } });
  },

  // POST /api/reports/:id/review — admin/moderator
  reviewReport: async (req, res) => {
    const { action, adminNotes } = req.body;

    if (!action || !['dismiss', 'action'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "dismiss" or "action".' });
    }

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    await report.update({
      status: action === 'dismiss' ? 'dismissed' : 'actioned',
      adminNotes: adminNotes || null,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    });

    return res.status(200).json({ success: true, data: { report } });
  },

  // GET /api/reports/content/:contentType/:contentId — admin/moderator
  getReportsByContent: async (req, res) => {
    const { contentType, contentId } = req.params;

    if (!CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ success: false, message: 'Invalid contentType.' });
    }

    const parsedContentId = parseInt(contentId);
    if (!Number.isInteger(parsedContentId) || parsedContentId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid contentId.' });
    }

    const reports = await Report.findAll({
      where: { contentType, contentId: parsedContentId },
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username'], required: false },
        { model: User, as: 'reviewer', attributes: ['id', 'username'], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ success: true, data: { reports } });
  }
};

module.exports = reportController;
