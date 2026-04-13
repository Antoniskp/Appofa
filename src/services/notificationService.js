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

  // Check user's notification preferences (fail-open: if lookup fails, proceed)
  try {
    const user = await User.findByPk(userId, { attributes: ['notificationPreferences'] });
    if (user?.notificationPreferences?.[type] === false) return null;
  } catch { /* fail-open: proceed with creation */ }

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

// ── Retention / cleanup ───────────────────────────────────────────────────

const RETENTION_DAYS = 90;

/**
 * Hard-deletes all Notification rows older than RETENTION_DAYS.
 * Called by the scheduled job — never exposed via HTTP.
 */
async function purgeOldNotifications() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await Notification.destroy({
    where: {
      createdAt: { [Op.lt]: cutoff }
    }
  });
  console.log(`[notificationService] purgeOldNotifications: deleted ${deleted} rows older than ${RETENTION_DAYS} days`);
  return deleted;
}

// ── Per-user preferences ──────────────────────────────────────────────────

const VALID_NOTIFICATION_TYPES = [
  'article_approved', 'article_commented', 'article_liked',
  'new_follower', 'endorsement_received', 'poll_result',
  'badge_earned', 'mention', 'report_resolved', 'system_announcement'
];

/**
 * Update a user's notification preferences.
 * @param {number} userId
 * @param {object} preferences - map of notification type → boolean
 * @returns {object} sanitized preferences that were saved
 */
async function updateNotificationPreferences(userId, preferences) {
  const sanitized = {};
  for (const [key, val] of Object.entries(preferences)) {
    if (VALID_NOTIFICATION_TYPES.includes(key) && typeof val === 'boolean') {
      sanitized[key] = val;
    }
  }
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  user.notificationPreferences = sanitized;
  await user.save();
  return sanitized;
}

// ── Admin broadcast ───────────────────────────────────────────────────────

/**
 * Sends a system_announcement to all users (or all users of a specific role).
 * @param {object} payload - { title, body, actionUrl }
 * @param {string|null} targetRole - role to target, or null for all users
 * @returns {number} count of notifications created
 */
async function broadcastNotification(payload, targetRole = null) {
  const where = { claimStatus: null };
  if (targetRole) where.role = targetRole;

  const users = await User.findAll({ where, attributes: ['id'] });
  const userIds = users.map(u => u.id);

  if (userIds.length === 0) return 0;

  const notifications = userIds.map(userId => ({
    userId,
    actorId: null,
    type: 'system_announcement',
    entityType: null,
    entityId: null,
    title: payload.title,
    body: payload.body || null,
    actionUrl: payload.actionUrl || null,
    isRead: false,
    metadata: payload.metadata || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await Notification.bulkCreate(notifications, { ignoreDuplicates: true });
  console.log(`[notificationService] broadcastNotification: sent to ${userIds.length} users`);
  return userIds.length;
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
  deleteNotification,
  purgeOldNotifications,
  updateNotificationPreferences,
  broadcastNotification
};
