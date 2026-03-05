const { Comment, User, Article, Poll } = require('../models');

const MAX_DEPTH = 5;

/**
 * Fetch entity settings (commentsEnabled, commentsLocked) and owner for a given entity.
 * Returns null if the entity is not found.
 */
async function getEntitySettings(entityType, entityId) {
  if (entityType === 'article') {
    const entity = await Article.findByPk(entityId);
    if (!entity) return null;
    return { entity, ownerId: entity.authorId, enabled: entity.commentsEnabled, locked: entity.commentsLocked };
  } else if (entityType === 'poll') {
    const entity = await Poll.findByPk(entityId);
    if (!entity) return null;
    return { entity, ownerId: entity.creatorId, enabled: entity.commentsEnabled, locked: entity.commentsLocked };
  } else if (entityType === 'user_profile') {
    const entity = await User.findByPk(entityId);
    if (!entity) return null;
    return { entity, ownerId: entity.id, enabled: entity.profileCommentsEnabled, locked: entity.profileCommentsLocked };
  }
  return null;
}

/**
 * Walk up the parent chain to compute the depth of a comment (root = 1).
 * Stops early once MAX_DEPTH + 1 is reached to prevent runaway queries.
 * Since MAX_DEPTH is 5, this executes at most MAX_DEPTH + 2 = 7 queries — a
 * bounded, predictable cost. If deeper nesting is ever introduced, consider
 * replacing this with a single recursive CTE query or storing depth as a
 * denormalized column.
 */
async function computeDepth(commentId) {
  let depth = 1;
  let currentId = commentId;
  while (depth < MAX_DEPTH + 2) {
    const c = await Comment.findByPk(currentId, { attributes: ['parentId'] });
    if (!c || !c.parentId) break;
    depth++;
    currentId = c.parentId;
  }
  return depth;
}

const isAdminOrModerator = (user) => ['admin', 'moderator'].includes(user.role);

const commentController = {
  /**
   * GET /api/comments?entityType=&entityId=
   * Returns all comments for an entity (flat list; frontend builds tree).
   * Hidden comments are returned with their body intact for moderators
   * and with body replaced with null for regular users.
   */
  getComments: async (req, res) => {
    try {
      const { entityType, entityId } = req.query;

      if (!entityType || !entityId) {
        return res.status(400).json({ success: false, message: 'entityType and entityId are required.' });
      }

      const validEntityTypes = ['article', 'poll', 'user_profile'];
      if (!validEntityTypes.includes(entityType)) {
        return res.status(400).json({ success: false, message: 'Invalid entityType.' });
      }

      const parsedEntityId = parseInt(entityId, 10);
      if (isNaN(parsedEntityId)) {
        return res.status(400).json({ success: false, message: 'Invalid entityId.' });
      }

      const comments = await Comment.findAll({
        where: { entityType, entityId: parsedEntityId },
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] },
          { model: User, as: 'moderator', attributes: ['id', 'username'] }
        ],
        order: [['createdAt', 'ASC']]
      });

      const isPrivileged = req.user && isAdminOrModerator(req.user);

      const sanitized = comments.map(c => {
        const data = c.toJSON();
        if (data.status === 'hidden' && !isPrivileged) {
          data.body = null;
        }
        return data;
      });

      return res.json({ success: true, data: { comments: sanitized } });
    } catch (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching comments.' });
    }
  },

  /**
   * POST /api/comments
   * Create a new comment on an entity.
   * Body: { entityType, entityId, parentId?, body }
   */
  createComment: async (req, res) => {
    try {
      const { entityType, entityId, parentId, body } = req.body;

      const validEntityTypes = ['article', 'poll', 'user_profile'];
      if (!entityType || !validEntityTypes.includes(entityType)) {
        return res.status(400).json({ success: false, message: 'Invalid entityType.' });
      }

      const parsedEntityId = parseInt(entityId, 10);
      if (!entityId || isNaN(parsedEntityId)) {
        return res.status(400).json({ success: false, message: 'Invalid entityId.' });
      }

      if (!body || typeof body !== 'string' || body.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Comment body is required.' });
      }

      if (body.trim().length > 10000) {
        return res.status(400).json({ success: false, message: 'Comment body too long.' });
      }

      // Verify entity exists and check comment settings
      const settings = await getEntitySettings(entityType, parsedEntityId);
      if (!settings) {
        return res.status(404).json({ success: false, message: 'Entity not found.' });
      }
      if (!settings.enabled) {
        return res.status(403).json({ success: false, message: 'Comments are disabled for this entity.' });
      }
      if (settings.locked) {
        return res.status(403).json({ success: false, message: 'Comments are locked for this entity.' });
      }

      // Validate parent comment when provided
      if (parentId !== undefined && parentId !== null) {
        const parsedParentId = parseInt(parentId, 10);
        if (isNaN(parsedParentId)) {
          return res.status(400).json({ success: false, message: 'Invalid parentId.' });
        }

        const parent = await Comment.findByPk(parsedParentId);
        if (!parent) {
          return res.status(404).json({ success: false, message: 'Parent comment not found.' });
        }
        if (parent.entityType !== entityType || parent.entityId !== parsedEntityId) {
          return res.status(400).json({ success: false, message: 'Parent comment belongs to a different entity.' });
        }

        // Enforce maximum nesting depth
        const parentDepth = await computeDepth(parsedParentId);
        if (parentDepth >= MAX_DEPTH) {
          return res.status(400).json({ success: false, message: `Maximum comment depth of ${MAX_DEPTH} exceeded.` });
        }
      }

      const comment = await Comment.create({
        entityType,
        entityId: parsedEntityId,
        authorId: req.user.id,
        parentId: (parentId !== undefined && parentId !== null) ? parseInt(parentId, 10) : null,
        body: body.trim()
      });

      const created = await Comment.findByPk(comment.id, {
        include: [{ model: User, as: 'author', attributes: ['id', 'username', 'avatar', 'avatarColor'] }]
      });

      return res.status(201).json({ success: true, message: 'Comment created successfully.', data: { comment: created } });
    } catch (error) {
      console.error('Create comment error:', error);
      return res.status(500).json({ success: false, message: 'Error creating comment.' });
    }
  },

  /**
   * PATCH /api/comments/:id/hide
   * Hide a comment (admin/moderator or entity owner).
   */
  hideComment: async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await Comment.findByPk(id);
      if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

      if (!isAdminOrModerator(req.user)) {
        const settings = await getEntitySettings(comment.entityType, comment.entityId);
        if (!settings || settings.ownerId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
        }
      }

      await comment.update({ status: 'hidden', moderatedByUserId: req.user.id, moderatedAt: new Date() });
      return res.json({ success: true, message: 'Comment hidden.', data: { comment } });
    } catch (error) {
      console.error('Hide comment error:', error);
      return res.status(500).json({ success: false, message: 'Error hiding comment.' });
    }
  },

  /**
   * PATCH /api/comments/:id/unhide
   * Restore a hidden comment to visible (admin/moderator or entity owner).
   */
  unhideComment: async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await Comment.findByPk(id);
      if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

      if (!isAdminOrModerator(req.user)) {
        const settings = await getEntitySettings(comment.entityType, comment.entityId);
        if (!settings || settings.ownerId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
        }
      }

      await comment.update({ status: 'visible', moderatedByUserId: null, moderatedAt: null, moderationReason: null });
      return res.json({ success: true, message: 'Comment unhidden.', data: { comment } });
    } catch (error) {
      console.error('Unhide comment error:', error);
      return res.status(500).json({ success: false, message: 'Error unhiding comment.' });
    }
  },

  /**
   * DELETE /api/comments/:id
   * Hard-delete a comment (author, admin/moderator, or entity owner).
   * Permanently removes the comment record from the database.
   */
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const comment = await Comment.findByPk(id);
      if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

      const isAuthor = comment.authorId === req.user.id;
      const isMod = isAdminOrModerator(req.user);

      if (!isAuthor && !isMod) {
        const settings = await getEntitySettings(comment.entityType, comment.entityId);
        if (!settings || settings.ownerId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
        }
      }

      await comment.destroy();
      return res.json({ success: true, message: 'Comment deleted.' });
    } catch (error) {
      console.error('Delete comment error:', error);
      return res.status(500).json({ success: false, message: 'Error deleting comment.' });
    }
  },

  /**
   * PATCH /api/articles/:id/comment-settings
   * Update commentsEnabled / commentsLocked for an article.
   * Allowed: article author, admin, or editor.
   */
  updateArticleCommentSettings: async (req, res) => {
    try {
      const { id } = req.params;
      const article = await Article.findByPk(id);
      if (!article) return res.status(404).json({ success: false, message: 'Article not found.' });

      const isOwner = article.authorId === req.user.id;
      const isPrivileged = isAdminOrModerator(req.user) || req.user.role === 'editor';
      if (!isOwner && !isPrivileged) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
      }

      const updates = {};
      if (typeof req.body.commentsEnabled === 'boolean') updates.commentsEnabled = req.body.commentsEnabled;
      if (typeof req.body.commentsLocked === 'boolean') updates.commentsLocked = req.body.commentsLocked;

      await article.update(updates);
      return res.json({
        success: true,
        message: 'Comment settings updated.',
        data: { commentsEnabled: article.commentsEnabled, commentsLocked: article.commentsLocked }
      });
    } catch (error) {
      console.error('Update article comment settings error:', error);
      return res.status(500).json({ success: false, message: 'Error updating comment settings.' });
    }
  },

  /**
   * PATCH /api/polls/:id/comment-settings
   * Update commentsEnabled / commentsLocked for a poll.
   * Allowed: poll creator or admin/moderator.
   */
  updatePollCommentSettings: async (req, res) => {
    try {
      const { id } = req.params;
      const poll = await Poll.findByPk(id);
      if (!poll) return res.status(404).json({ success: false, message: 'Poll not found.' });

      const isOwner = poll.creatorId === req.user.id;
      if (!isOwner && !isAdminOrModerator(req.user)) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
      }

      const updates = {};
      if (typeof req.body.commentsEnabled === 'boolean') updates.commentsEnabled = req.body.commentsEnabled;
      if (typeof req.body.commentsLocked === 'boolean') updates.commentsLocked = req.body.commentsLocked;

      await poll.update(updates);
      return res.json({
        success: true,
        message: 'Comment settings updated.',
        data: { commentsEnabled: poll.commentsEnabled, commentsLocked: poll.commentsLocked }
      });
    } catch (error) {
      console.error('Update poll comment settings error:', error);
      return res.status(500).json({ success: false, message: 'Error updating comment settings.' });
    }
  },

  /**
   * PATCH /api/users/:id/profile-comment-settings
   * Update profileCommentsEnabled / profileCommentsLocked for a user profile.
   * Allowed: the user themselves or admin/moderator.
   */
  updateUserProfileCommentSettings: async (req, res) => {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return res.status(400).json({ success: false, message: 'Invalid user id.' });
      }

      if (parsedId !== req.user.id && !isAdminOrModerator(req.user)) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
      }

      const user = await User.findByPk(parsedId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      const updates = {};
      if (typeof req.body.profileCommentsEnabled === 'boolean') updates.profileCommentsEnabled = req.body.profileCommentsEnabled;
      if (typeof req.body.profileCommentsLocked === 'boolean') updates.profileCommentsLocked = req.body.profileCommentsLocked;
      if (typeof req.body.searchable === 'boolean') updates.searchable = req.body.searchable;

      await user.update(updates);
      return res.json({
        success: true,
        message: 'Profile settings updated.',
        data: {
          profileCommentsEnabled: user.profileCommentsEnabled,
          profileCommentsLocked: user.profileCommentsLocked,
          searchable: user.searchable
        }
      });
    } catch (error) {
      console.error('Update user profile comment settings error:', error);
      return res.status(500).json({ success: false, message: 'Error updating profile comment settings.' });
    }
  }
};

module.exports = commentController;
