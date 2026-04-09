const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
    const result = await notificationService.getNotifications(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch unread count.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
    }
    const [affectedRows] = await notificationService.markAsRead([id], req.user.id);
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
    }
    const deleted = await notificationService.deleteNotification(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const prefs = req.user.notificationPreferences || {};
    return res.status(200).json({ success: true, data: { preferences: prefs } });
  } catch (err) {
    console.error('getPreferences error:', err);
    return res.status(500).json({ success: false, message: 'Error fetching preferences.' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
      return res.status(400).json({ success: false, message: 'preferences must be an object.' });
    }
    const updated = await notificationService.updateNotificationPreferences(req.user.id, preferences);
    return res.status(200).json({ success: true, data: { preferences: updated }, message: 'Preferences updated.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    console.error('updatePreferences error:', err);
    return res.status(500).json({ success: false, message: 'Error updating preferences.' });
  }
};

exports.adminBroadcast = async (req, res) => {
  try {
    const { title, body, actionUrl, targetRole } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'title is required.' });
    }
    if (title.length > 200) {
      return res.status(400).json({ success: false, message: 'title must be 200 chars or fewer.' });
    }
    const VALID_ROLES = ['admin', 'moderator', 'candidate', 'citizen', 'editor', 'viewer'];
    if (targetRole && !VALID_ROLES.includes(targetRole)) {
      return res.status(400).json({ success: false, message: `targetRole must be one of: ${VALID_ROLES.join(', ')}.` });
    }
    const count = await notificationService.broadcastNotification(
      { title: title.trim(), body, actionUrl },
      targetRole || null
    );
    return res.status(200).json({
      success: true,
      data: { count },
      message: `Broadcast sent to ${count} users.`
    });
  } catch (err) {
    console.error('adminBroadcast error:', err);
    return res.status(500).json({ success: false, message: 'Error sending broadcast.' });
  }
};
