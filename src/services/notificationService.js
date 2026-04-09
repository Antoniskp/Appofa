const { Notification, User } = require('../models');
const { Op } = require('sequelize');

// ── Core creation ──────────────────────────────────────────────────────────

/**
 * Create a single notification. Never notifies the actor about their own action.
 */
async function createNotification({
  userId,
  actorId = null,
  type,
  entityType = null,
  entityId = null,
  title,
  body = null,
  actionUrl = null,
  metadata = null
}) {
  // Never notify yourself
  if (actorId && actorId === userId) return null;

  return Notification.create({
    userId, actorId, type, entityType, entityId,
    title, body, actionUrl, metadata
  });
}

/**
 * Bulk-create notifications for multiple recipients (e.g. broadcast to followers).
 * Automatically excludes the actor from the recipient list.
 */
async function notifyMany(userIds, payload) {
  const unique = [...new Set(userIds)].filter(id => id !== payload.actorId);
  if (!unique.length) return [];
  return Notification.bulkCreate(unique.map(userId => ({ ...payload, userId })));
}

// ── Convenience helpers ────────────────────────────────────────────────────

/**
 * Called when an admin approves a news article.
 */
async function notifyArticleApproved(article) {
  return createNotification({
    userId: article.authorId,
    type: 'article_approved',
    entityType: 'article',
    entityId: article.id,
    title: 'Your article was approved',
    body: `"${article.title}" is now published.`,
    actionUrl: `/articles/${article.id}`,
    metadata: { articleTitle: article.title }
  });
}

/**
 * Called when a comment is posted on an article or poll.
 * Accepts the full entity object so it works for both articles (authorId) and polls (creatorId).
 */
async function notifyNewComment(entity, comment, commentAuthorId) {
  const ownerId = entity.authorId || entity.creatorId;
  if (!ownerId) return null;
  const actionUrl = entity.authorId
    ? `/articles/${entity.id}#comment-${comment.id}`
    : `/polls/${entity.id}#comment-${comment.id}`;
  return createNotification({
    userId: ownerId,
    actorId: commentAuthorId,
    type: 'article_commented',
    entityType: 'comment',
    entityId: comment.id,
    title: 'Νέο σχόλιο στο περιεχόμενό σου',
    body: `Κάποιος σχολίασε "${entity.title}"`,
    actionUrl,
    metadata: { entityTitle: entity.title }
  });
}

/**
 * Called when a user follows another user.
 */
async function notifyNewFollower(followedUserId, followerUserId) {
  return createNotification({
    userId: followedUserId,
    actorId: followerUserId,
    type: 'new_follower',
    entityType: 'user',
    entityId: followerUserId,
    title: 'You have a new follower',
    actionUrl: `/profile/${followerUserId}`
  });
}

/**
 * Called from badgeService after awarding a badge.
 * Accepts the badge shape produced by badgeService.evaluate(): { slug, tier, name, label }
 */
async function notifyBadgeEarned(userId, badge) {
  return createNotification({
    userId,
    type: 'badge_earned',
    entityType: 'badge',
    title: `You earned the "${badge.name}" badge!`,
    body: badge.label || null,
    actionUrl: `/profile/${userId}#badges`,
    metadata: { badgeName: badge.name, badgeSlug: badge.slug, tier: badge.tier }
  });
}

/**
 * Called when an endorsement is given.
 */
async function notifyEndorsement(endorsedUserId, endorserUserId) {
  return createNotification({
    userId: endorsedUserId,
    actorId: endorserUserId,
    type: 'endorsement_received',
    entityType: 'user',
    entityId: endorserUserId,
    title: 'You received an endorsement',
    actionUrl: `/profile/${endorsedUserId}`
  });
}

// ── Read / Feed queries ────────────────────────────────────────────────────

/**
 * Paginated notification feed for a user.
 */
async function getNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const parsedLimit = Math.min(parseInt(limit) || 20, 50);
  const parsedPage = parseInt(page) || 1;

  const where = { userId };
  if (unreadOnly) where.isRead = false;

  const { rows, count } = await Notification.findAndCountAll({
    where,
    include: [{
      model: User,
      as: 'actor',
      attributes: ['id', 'username', 'avatar'],
      required: false
    }],
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit
  });

  return { notifications: rows, total: count, page: parsedPage, limit: parsedLimit };
}

/**
 * Returns the count of unread notifications for a user.
 */
async function getUnreadCount(userId) {
  return Notification.count({ where: { userId, isRead: false } });
}

/**
 * Mark specific notifications as read (ownership enforced via userId).
 */
async function markAsRead(notificationIds, userId) {
  return Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { id: { [Op.in]: notificationIds }, userId } }
  );
}

/**
 * Mark all unread notifications for a user as read.
 */
async function markAllAsRead(userId) {
  return Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } }
  );
}

/**
 * Hard delete a notification (ownership enforced).
 */
async function deleteNotification(id, userId) {
  return Notification.destroy({ where: { id, userId } });
}

module.exports = {
  createNotification,
  notifyMany,
  notifyArticleApproved,
  notifyNewComment,
  notifyNewFollower,
  notifyBadgeEarned,
  notifyEndorsement,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
