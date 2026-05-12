'use strict';

const pushService = require('../services/pushService');

/**
 * POST /api/push/subscribe
 * Store (or refresh) a Web Push subscription for the authenticated user.
 *
 * Body: { endpoint, keys: { p256dh, auth } }
 */
exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription: endpoint, keys.p256dh and keys.auth are required.'
      });
    }
    const userAgent = req.headers['user-agent'] || null;
    await pushService.saveSubscription(req.user.id, { endpoint, keys }, userAgent);
    return res.status(200).json({ success: true, message: 'Push subscription saved.' });
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error('[pushController] subscribe error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save push subscription.' });
  }
};

/**
 * DELETE /api/push/subscribe
 * Remove a Web Push subscription (unsubscribe from push on this device).
 *
 * Body: { endpoint }
 */
exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'endpoint is required.' });
    }
    await pushService.removeSubscription(req.user.id, endpoint);
    return res.status(200).json({ success: true, message: 'Push subscription removed.' });
  } catch (err) {
    console.error('[pushController] unsubscribe error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove push subscription.' });
  }
};
