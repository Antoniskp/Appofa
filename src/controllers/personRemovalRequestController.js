'use strict';

const { PersonRemovalRequest, User } = require('../models');
const { Op } = require('sequelize');

const personRemovalRequestController = {
  // POST /api/person-removal-requests — public
  submitRemovalRequest: async (req, res) => {
    const { userId, requesterName, requesterEmail, message } = req.body;

    // Validate required fields
    if (!userId || !requesterName || !requesterEmail || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Validate email format (simple, non-backtracking pattern)
    if (!/^[^@\s]{1,64}@[^@\s]{1,255}$/.test(requesterEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    // Check person (unclaimed User profile) exists
    const person = await User.findByPk(userId);
    if (!person || person.claimStatus === null) {
      return res.status(404).json({ success: false, message: 'Person profile not found.' });
    }

    const removalRequest = await PersonRemovalRequest.create({
      userId,
      requesterName,
      requesterEmail,
      message,
      status: 'pending'
    });

    return res.status(201).json({ success: true, data: { request: removalRequest } });
  },

  // GET /api/person-removal-requests — admin/moderator
  getRemovalRequests: async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await PersonRemovalRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'person', attributes: ['id', 'firstNameNative', 'lastNameNative', 'slug'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username'], required: false }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        requests: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  },

  // GET /api/person-removal-requests/:id — admin/moderator
  getRemovalRequestById: async (req, res) => {
    const removalRequest = await PersonRemovalRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: 'person', attributes: ['id', 'firstNameNative', 'lastNameNative', 'slug'] },
        { model: User, as: 'reviewer', attributes: ['id', 'username'], required: false }
      ]
    });

    if (!removalRequest) {
      return res.status(404).json({ success: false, message: 'Removal request not found.' });
    }

    return res.status(200).json({ success: true, data: { request: removalRequest } });
  },

  // POST /api/person-removal-requests/:id/review — admin/moderator
  reviewRemovalRequest: async (req, res) => {
    const { action, adminNotes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject".' });
    }

    const removalRequest = await PersonRemovalRequest.findByPk(req.params.id);
    if (!removalRequest) {
      return res.status(404).json({ success: false, message: 'Removal request not found.' });
    }

    await removalRequest.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      adminNotes: adminNotes || null,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    });

    return res.status(200).json({ success: true, data: { request: removalRequest } });
  }
};

module.exports = personRemovalRequestController;
