const { Message, User, Location } = require('../models');
const { Op } = require('sequelize');
const {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeEmail,
  normalizeEnum,
  normalizeInteger
} = require('../utils/validators');
const notificationService = require('../services/notificationService');
const newsletterService = require('../services/newsletterService');

// Allowed values for message type
const MESSAGE_TYPES = ['contact', 'moderator_application', 'general', 'bug_report', 'feature_request'];
const MESSAGE_STATUSES = ['pending', 'read', 'in_progress', 'responded', 'archived'];

const messageController = {
  /**
   * Create a new message (public - no auth required)
   * POST /api/messages
   */
  createMessage: async (req, res) => {
    try {
      const { type, email, name, subject, message, locationId, metadata } = req.body;
      const userId = req.user ? req.user.id : null;

      // Validate type
      const typeResult = normalizeEnum(type || 'contact', MESSAGE_TYPES, 'Type');
      if (typeResult.error) {
        return res.status(400).json({
          success: false,
          message: typeResult.error
        });
      }

      // Validate subject
      const subjectResult = normalizeRequiredText(subject, 'Subject', 1, 200);
      if (subjectResult.error) {
        return res.status(400).json({
          success: false,
          message: subjectResult.error
        });
      }

      // Validate message content
      const messageResult = normalizeRequiredText(message, 'Message', 1, 5000);
      if (messageResult.error) {
        return res.status(400).json({
          success: false,
          message: messageResult.error
        });
      }

      // For non-authenticated users, email and name are required
      let validatedEmail = null;
      let validatedName = null;

      if (!userId) {
        const emailResult = normalizeEmail(email);
        if (emailResult.error) {
          return res.status(400).json({
            success: false,
            message: emailResult.error
          });
        }
        validatedEmail = emailResult.value;

        const nameResult = normalizeRequiredText(name, 'Name', 1, 200);
        if (nameResult.error) {
          return res.status(400).json({
            success: false,
            message: nameResult.error
          });
        }
        validatedName = nameResult.value;
      } else {
        // For authenticated users, use provided email/name if present, otherwise leave null
        if (email) {
          const emailResult = normalizeEmail(email);
          if (emailResult.error) {
            return res.status(400).json({
              success: false,
              message: emailResult.error
            });
          }
          validatedEmail = emailResult.value;
        }
        if (name) {
          const nameResult = normalizeOptionalText(name, 'Name', 1, 200);
          if (nameResult.error) {
            return res.status(400).json({
              success: false,
              message: nameResult.error
            });
          }
          validatedName = nameResult.value;
        }
      }

      // For moderator applications, locationId is required
      let validatedLocationId = null;
      if (typeResult.value === 'moderator_application') {
        // Prevent duplicate pending applications for authenticated users
        if (userId) {
          const existing = await Message.findOne({
            where: {
              userId,
              type: 'moderator_application',
              status: { [Op.in]: ['pending', 'read', 'in_progress'] },
            },
          });
          if (existing) {
            return res.status(409).json({
              success: false,
              message: 'You already have a pending moderator application.',
              data: { existingApplicationId: existing.id },
            });
          }
        }

        if (!locationId) {
          return res.status(400).json({
            success: false,
            message: 'Location is required for moderator applications.'
          });
        }

        const locationIdResult = normalizeInteger(locationId, 'Location ID', 1);
        if (locationIdResult.error) {
          return res.status(400).json({
            success: false,
            message: locationIdResult.error
          });
        }

        // Verify location exists
        const location = await Location.findByPk(locationIdResult.value);
        if (!location) {
          return res.status(400).json({
            success: false,
            message: 'Invalid location specified.'
          });
        }
        validatedLocationId = locationIdResult.value;
      } else if (locationId) {
        // Optional location for other message types
        const locationIdResult = normalizeInteger(locationId, 'Location ID', 1);
        if (!locationIdResult.error) {
          const location = await Location.findByPk(locationIdResult.value);
          if (location) {
            validatedLocationId = locationIdResult.value;
          }
        }
      }

      // Create the message
      const newMessage = await Message.create({
        type: typeResult.value,
        userId,
        email: validatedEmail,
        name: validatedName,
        subject: subjectResult.value,
        message: messageResult.value,
        locationId: validatedLocationId,
        metadata: metadata || null,
        status: 'pending',
        priority: 'normal'
      });

      res.status(201).json({
        success: true,
        message: 'Message submitted successfully.',
        data: {
          messageId: newMessage.id
        }
      });

      // Send a submission confirmation notification for moderator applications
      if (typeResult.value === 'moderator_application' && userId) {
        notificationService.createNotification({
          userId,
          type: 'system_announcement',
          entityType: 'message',
          entityId: newMessage.id,
          title: 'Η αίτησή σου για Moderator υποβλήθηκε',
          body: 'Θα σε ενημερώσουμε όταν η αίτησή σου εξεταστεί.',
          actionUrl: '/become-moderator',
          metadata: { messageId: newMessage.id },
        }).catch((err) => console.error('Error creating moderator application notification:', err));
      }
    } catch (error) {
      console.error('Create message error:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting message.'
      });
    }
  },

  /**
   * Get all messages (admin/moderator only)
   * GET /api/messages?type=&status=&userId=&limit=&offset=
   */
  getAllMessages: async (req, res) => {
    try {
      const { type, status, userId, limit = 30, offset = 0 } = req.query;

      const where = {};
      
      if (type) {
        const typeResult = normalizeEnum(type, MESSAGE_TYPES, 'Type');
        if (!typeResult.error) {
          where.type = typeResult.value;
        }
      }

      if (status) {
        const statusResult = normalizeEnum(status, MESSAGE_STATUSES, 'Status');
        if (!statusResult.error) {
          where.status = statusResult.value;
        }
      }

      if (userId) {
        const userIdResult = normalizeInteger(userId, 'User ID', 1);
        if (!userIdResult.error) {
          where.userId = userIdResult.value;
        }
      }

      const limitNum = Math.min(parseInt(limit) || 30, 100);
      const offsetNum = parseInt(offset) || 0;

      const { count, rows: messages } = await Message.findAndCountAll({
        where,
        limit: limitNum,
        offset: offsetNum,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstNameNative', 'lastNameNative']
          },
          {
            model: User,
            as: 'responder',
            attributes: ['id', 'username', 'firstNameNative', 'lastNameNative']
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'type', 'slug']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            total: count,
            limit: limitNum,
            offset: offsetNum,
            totalPages: Math.ceil(count / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('Get all messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching messages.'
      });
    }
  },

  /**
   * Get single message by ID (admin/moderator only)
   * GET /api/messages/:id
   */
  getMessage: async (req, res) => {
    try {
      const { id } = req.params;

      const idResult = normalizeInteger(id, 'Message ID', 1);
      if (idResult.error) {
        return res.status(400).json({
          success: false,
          message: idResult.error
        });
      }

      const message = await Message.findByPk(idResult.value, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstNameNative', 'lastNameNative']
          },
          {
            model: User,
            as: 'responder',
            attributes: ['id', 'username', 'firstNameNative', 'lastNameNative']
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'type', 'slug', 'parent_id']
          }
        ]
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found.'
        });
      }

      res.json({
        success: true,
        data: { message }
      });
    } catch (error) {
      console.error('Get message error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching message.'
      });
    }
  },

  /**
   * Update message status (admin/moderator only)
   * PUT /api/messages/:id/status
   */
  updateMessageStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const idResult = normalizeInteger(id, 'Message ID', 1);
      if (idResult.error) {
        return res.status(400).json({
          success: false,
          message: idResult.error
        });
      }

      const statusResult = normalizeEnum(status, MESSAGE_STATUSES, 'Status');
      if (statusResult.error) {
        return res.status(400).json({
          success: false,
          message: statusResult.error
        });
      }

      const message = await Message.findByPk(idResult.value);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found.'
        });
      }

      message.status = statusResult.value;
      await message.save();

      res.json({
        success: true,
        message: 'Message status updated successfully.',
        data: { message }
      });
    } catch (error) {
      console.error('Update message status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating message status.'
      });
    }
  },

  /**
   * Respond to a message (admin/moderator only)
   * PUT /api/messages/:id/respond
   */
  respondToMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { response, adminNotes } = req.body;

      const idResult = normalizeInteger(id, 'Message ID', 1);
      if (idResult.error) {
        return res.status(400).json({
          success: false,
          message: idResult.error
        });
      }

      const responseResult = normalizeRequiredText(response, 'Response', 1, 5000);
      if (responseResult.error) {
        return res.status(400).json({
          success: false,
          message: responseResult.error
        });
      }

      let validatedAdminNotes = null;
      if (adminNotes) {
        const notesResult = normalizeOptionalText(adminNotes, 'Admin Notes', 1, 5000);
        if (notesResult.error) {
          return res.status(400).json({
            success: false,
            message: notesResult.error
          });
        }
        validatedAdminNotes = notesResult.value;
      }

      const message = await Message.findByPk(idResult.value);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found.'
        });
      }

      message.response = responseResult.value;
      message.adminNotes = validatedAdminNotes;
      message.respondedBy = req.user.id;
      message.respondedAt = new Date();
      message.status = 'responded';
      await message.save();

      const updatedMessage = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstNameNative', 'lastNameNative']
          },
          {
            model: User,
            as: 'responder',
            attributes: ['id', 'username', 'firstNameNative', 'lastNameNative']
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'type', 'slug']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Response submitted successfully.',
        data: { message: updatedMessage }
      });

      // Notify the user via the platform if they are registered
      if (updatedMessage.userId) {
        notificationService.createNotification({
          userId: updatedMessage.userId,
          type: 'report_resolved', // Appropriate existing type
          title: 'Λάβατε μια απάντηση στο μήνυμά σας',
          body: `Θέμα: ${updatedMessage.subject}`,
          actionUrl: '/profile', // User can see their messages there (if implemented) or just a general notification
          metadata: { messageId: updatedMessage.id }
        }).catch(err => console.error('Error creating message response notification:', err));
      }

      // Send email notification to user
      const userEmail = updatedMessage.user ? updatedMessage.user.email : updatedMessage.email;
      if (userEmail) {
        const emailSubject = `Re: ${updatedMessage.subject}`;
        const emailBody = `
          <p>Γεια σας,</p>
          <p>Λάβατε μια απάντηση στο μήνυμα που στείλατε στο Appofa με θέμα "<strong>${updatedMessage.subject}</strong>".</p>
          <hr />
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #2563eb;">
            <p style="white-space: pre-wrap;">${updatedMessage.response}</p>
          </div>
          <hr />
          <p>Σας ευχαριστούμε για τη συμμετοχή σας,</p>
          <p>Η ομάδα του Appofa</p>
        `;
        const emailText = `
          Γεια σας,
          Λάβατε μια απάντηση στο μήνυμα που στείλατε στο Appofa με θέμα "${updatedMessage.subject}".

          ---
          ${updatedMessage.response}
          ---

          Σας ευχαριστούμε για τη συμμετοχή σας,
          Η ομάδα του Appofa
        `;

        newsletterService.sendMail({
          to: userEmail,
          subject: emailSubject,
          html: emailBody,
          text: emailText
        }).catch(err => console.error('Error sending message response email:', err));
      }
    } catch (error) {
      console.error('Respond to message error:', error);
      res.status(500).json({
        success: false,
        message: 'Error responding to message.'
      });
    }
  },

  /**
   * Delete a message (admin only)
   * DELETE /api/messages/:id
   */
  deleteMessage: async (req, res) => {
    try {
      const { id } = req.params;

      const idResult = normalizeInteger(id, 'Message ID', 1);
      if (idResult.error) {
        return res.status(400).json({
          success: false,
          message: idResult.error
        });
      }

      const message = await Message.findByPk(idResult.value);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found.'
        });
      }

      await message.destroy();

      res.json({
        success: true,
        message: 'Message deleted successfully.'
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting message.'
      });
    }
  },

  /**
   * Get the current user's latest moderator application status.
   * Exposes only safe public-facing fields — never adminNotes or other users' data.
   * GET /api/messages/mine/moderator-application
   */
  getMyModeratorApplication: async (req, res) => {
    // Map internal Message status → user-facing stage
    const STAGE_MAP = {
      pending: 'submitted',
      read: 'under_review',
      in_progress: 'under_review',
      responded: 'decision_available',
      archived: 'closed',
    };

    try {
      const userId = req.user.id;

      // Derive approval from the user's actual platform role
      const user = await User.findByPk(userId, { attributes: ['id', 'role'] });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isApprovedModerator = user.role === 'moderator' || user.role === 'admin';

      const application = await Message.findOne({
        where: { userId, type: 'moderator_application' },
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'status', 'subject', 'locationId', 'createdAt', 'updatedAt', 'response', 'respondedAt'],
        include: [
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'type', 'slug'],
          },
        ],
      });

      if (!application) {
        return res.json({
          success: true,
          data: {
            application: null,
            isApprovedModerator,
          },
        });
      }

      return res.json({
        success: true,
        data: {
          application: {
            id: application.id,
            status: application.status,
            stage: STAGE_MAP[application.status] || 'submitted',
            subject: application.subject,
            locationId: application.locationId,
            location: application.location || null,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            // Include response so user can see admin reply, but never adminNotes
            response: application.response || null,
            respondedAt: application.respondedAt || null,
          },
          isApprovedModerator,
        },
      });
    } catch (error) {
      console.error('Get my moderator application error:', error);
      res.status(500).json({ success: false, message: 'Error fetching moderator application.' });
    }
  },
};

module.exports = messageController;
