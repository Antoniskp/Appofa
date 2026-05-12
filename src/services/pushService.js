'use strict';

/**
 * Push notification delivery service.
 *
 * Uses the `web-push` npm package with VAPID keys to deliver Web Push API
 * messages to subscribed devices.  A device subscribes via POST /api/push/subscribe
 * (PushNotificationEnable.js) and the server stores the subscription in the
 * PushSubscriptions table.  Every time a Notification row is created for a user,
 * notificationService calls sendPushToUser() so the Home Screen badge updates
 * immediately — even when the app is not open.
 *
 * Environment variables required (see .env.example):
 *   VAPID_PRIVATE_KEY   — VAPID private key (backend only, keep secret)
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY — VAPID public key (also used server-side for signing)
 *   VAPID_MAILTO        — Admin email passed to push services, e.g. mailto:admin@example.com
 */

const webPush = require('web-push');
const { PushSubscription, Notification } = require('../models');

let _vapidConfigured = false;

function ensureVapidConfigured() {
  if (_vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const mailto = process.env.VAPID_MAILTO;

  if (!publicKey || !privateKey || !mailto) {
    return false;
  }

  try {
    webPush.setVapidDetails(mailto, publicKey, privateKey);
    _vapidConfigured = true;
    return true;
  } catch (err) {
    console.error('[pushService] Failed to configure VAPID:', err.message);
    return false;
  }
}

/**
 * Fetch all active push subscriptions for a user and deliver the payload.
 * Stale/expired subscriptions (410 Gone) are automatically removed.
 *
 * @param {number} userId - The recipient's user ID.
 * @param {object} payload - Must be serialisable to JSON.  The SW expects:
 *   { title: string, body: string, unreadCount: number, url: string }
 */
async function sendPushToUser(userId, payload) {
  if (!ensureVapidConfigured()) {
    // VAPID not configured — push silently skipped.
    return;
  }

  let subscriptions;
  try {
    subscriptions = await PushSubscription.findAll({ where: { userId } });
  } catch (err) {
    console.error('[pushService] DB lookup failed for userId', userId, err.message);
    return;
  }

  if (!subscriptions.length) return;

  const jsonPayload = JSON.stringify(payload);
  const staleIds = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      try {
        await webPush.sendNotification(pushSubscription, jsonPayload);
      } catch (err) {
        // 410 Gone or 404 Not Found = subscription no longer valid
        if (err.statusCode === 410 || err.statusCode === 404) {
          staleIds.push(sub.id);
        } else {
          console.error('[pushService] sendNotification error for sub', sub.id, err.message);
        }
      }
    })
  );

  if (staleIds.length) {
    await PushSubscription.destroy({ where: { id: staleIds } }).catch((err) =>
      console.error('[pushService] Failed to remove stale subscriptions:', err.message)
    );
  }
}

/**
 * Register or refresh a push subscription for a user.
 * If the endpoint already exists it is updated in-place (keys may rotate).
 *
 * @param {number} userId
 * @param {{ endpoint: string, keys: { p256dh: string, auth: string } }} subscription
 * @param {string|null} userAgent
 */
async function saveSubscription(userId, subscription, userAgent = null) {
  const { endpoint, keys: { p256dh, auth } = {} } = subscription || {};

  if (!endpoint || !p256dh || !auth) {
    const err = new Error('Invalid subscription object: missing endpoint, p256dh, or auth.');
    err.status = 400;
    throw err;
  }

  const [record, created] = await PushSubscription.findOrCreate({
    where: { endpoint },
    defaults: { userId, endpoint, p256dh, auth, userAgent }
  });

  if (!created) {
    // Refresh keys and reassign to current user (user may have rotated keys)
    await record.update({ userId, p256dh, auth, userAgent });
  }

  return record;
}

/**
 * Remove a specific push subscription by endpoint (used for unsubscribe).
 *
 * @param {number} userId
 * @param {string} endpoint
 */
async function removeSubscription(userId, endpoint) {
  return PushSubscription.destroy({ where: { userId, endpoint } });
}

/**
 * Get the current unread notification count for a user.
 * Helper used when building the push payload.
 */
async function getUnreadCount(userId) {
  try {
    return await Notification.count({ where: { userId, isRead: false } });
  } catch (err) {
    console.error('[pushService] getUnreadCount failed for user', userId, err.message);
    return 0;
  }
}

module.exports = {
  sendPushToUser,
  saveSubscription,
  removeSubscription,
  getUnreadCount,
};
