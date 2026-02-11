const { ModeratorApplication, User, Location, sequelize } = require('../models');
const { Op } = require('sequelize');

const moderatorApplicationController = {
  // Submit a new moderator application
  createApplication: async (req, res) => {
    try {
      const { locationId, reason, experience } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!locationId) {
        return res.status(400).json({
          success: false,
          message: 'Location ID is required'
        });
      }

      if (!reason || reason.trim().length < 20) {
        return res.status(400).json({
          success: false,
          message: 'Reason must be at least 20 characters long'
        });
      }

      if (!experience || experience.trim().length < 20) {
        return res.status(400).json({
          success: false,
          message: 'Experience must be at least 20 characters long'
        });
      }

      // Check if location exists
      const location = await Location.findByPk(locationId);
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Check if user already has a pending or approved application for this location
      const existingApplication = await ModeratorApplication.findOne({
        where: {
          userId,
          locationId,
          type: 'moderator_application',
          status: {
            [Op.in]: ['pending', 'approved']
          }
        }
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending or approved application for this location'
        });
      }

      // Create the application
      const application = await ModeratorApplication.create({
        type: 'moderator_application',
        userId,
        locationId,
        reason: reason.trim(),
        experience: experience.trim(),
        status: 'pending'
      });

      // Fetch the created application with associations
      const createdApplication = await ModeratorApplication.findByPk(application.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'name_local', 'type']
          }
        ]
      });

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          application: createdApplication
        }
      });
    } catch (error) {
      console.error('Error creating moderator application:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit application'
      });
    }
  },

  // Submit a contact message
  createContactMessage: async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      const userId = req.user ? req.user.id : null;

      // Validate required fields
      if (!message || message.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Message must be at least 10 characters long'
        });
      }

      // For non-authenticated users, require name and email
      if (!userId) {
        if (!name || name.trim().length < 2) {
          return res.status(400).json({
            success: false,
            message: 'Name is required'
          });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Valid email is required'
          });
        }
      }

      // Create the contact message
      const contactMessage = await ModeratorApplication.create({
        type: 'contact',
        userId,
        name: userId ? null : name.trim(),
        email: userId ? null : email.trim(),
        subject: subject ? subject.trim() : null,
        message: message.trim(),
        status: 'pending'
      });

      // Fetch the created message with associations
      const createdMessage = await ModeratorApplication.findByPk(contactMessage.id, {
        include: userId ? [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ] : []
      });

      return res.status(201).json({
        success: true,
        message: 'Contact message sent successfully',
        data: {
          contactMessage: createdMessage
        }
      });
    } catch (error) {
      console.error('Error creating contact message:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send contact message'
      });
    }
  },

  // Get all applications (admin only)
  getAllApplications: async (req, res) => {
    try {
      const { status, type, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status && ['pending', 'approved', 'rejected', 'read', 'archived'].includes(status)) {
        where.status = status;
      }
      if (type && ['moderator_application', 'contact'].includes(type)) {
        where.type = type;
      }

      const { count, rows: applications } = await ModeratorApplication.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role'],
            required: false
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'name_local', 'type'],
            required: false
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'username', 'firstName', 'lastName'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        success: true,
        data: {
          applications,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching moderator applications:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch applications'
      });
    }
  },

  // Update application status (admin only)
  updateApplicationStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const reviewerId = req.user.id;

      // Find the application
      const application = await ModeratorApplication.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            required: false
          },
          {
            model: Location,
            as: 'location',
            required: false
          }
        ]
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Validate status based on type
      if (application.type === 'moderator_application') {
        if (!status || !['approved', 'rejected'].includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid status for moderator application. Must be "approved" or "rejected"'
          });
        }

        // Check if already processed
        if (application.status !== 'pending') {
          return res.status(400).json({
            success: false,
            message: 'Application has already been processed'
          });
        }
      } else if (application.type === 'contact') {
        if (!status || !['read', 'archived'].includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid status for contact message. Must be "read" or "archived"'
          });
        }
      }

      // Update application status
      application.status = status;
      application.adminNotes = notes || null;
      application.reviewedBy = reviewerId;
      application.reviewedAt = new Date();
      await application.save();

      // If approved moderator application, update user role to moderator
      if (application.type === 'moderator_application' && status === 'approved' && application.user && application.user.role !== 'admin') {
        await application.user.update({ role: 'moderator' });
      }

      // Fetch updated application with associations
      const updatedApplication = await ModeratorApplication.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role'],
            required: false
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'name_local', 'type'],
            required: false
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ]
      });

      return res.json({
        success: true,
        message: `${application.type === 'moderator_application' ? 'Application' : 'Contact message'} ${status} successfully`,
        data: {
          application: updatedApplication
        }
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update application status'
      });
    }
  }
};

module.exports = moderatorApplicationController;
