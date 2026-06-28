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

const DEFAULT_NOTIFICATION_URL = '/notifications';
const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 1800;
const WEB_PUSH_TTL_SECONDS = 60 * 60 * 24;

function truncate(value, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function normalizeInternalUrl(value) {
  if (typeof value !== 'string') return DEFAULT_NOTIFICATION_URL;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return DEFAULT_NOTIFICATION_URL;
  }
  return trimmed || DEFAULT_NOTIFICATION_URL;
}

function normalizeUnreadCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) return 0;
  return Math.min(Math.floor(count), 999);
}

function buildPushPayload(payload = {}) {
  return {
    title: truncate(payload.title, MAX_TITLE_LENGTH) || 'New notification',
    body: truncate(payload.body, MAX_BODY_LENGTH),
    unreadCount: normalizeUnreadCount(payload.unreadCount),
    url: normalizeInternalUrl(payload.url),
  };
}

function ensureVapidConfigured() {
  if (_vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const mailto = process.env.VAPID_MAILTO;

  if (!publicKey || !privateKey || !mailto) {
    console.warn('[pushService] Push notifications are disabled — VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_MAILTO in the environment.');
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
    return { sent: 0, failed: 0, staleRemoved: 0, skipped: true };
  }

  let subscriptions;
  try {
    subscriptions = await PushSubscription.findAll({ where: { userId } });
  } catch (err) {
    console.error('[pushService] DB lookup failed for userId', userId, err.message);
    return { sent: 0, failed: 0, staleRemoved: 0, skipped: true };
  }

  if (!subscriptions.length) {
    return { sent: 0, failed: 0, staleRemoved: 0, skipped: true };
  }

  const jsonPayload = JSON.stringify(buildPushPayload(payload));
  const staleIds = [];
  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      try {
        await webPush.sendNotification(pushSubscription, jsonPayload, {
          TTL: WEB_PUSH_TTL_SECONDS,
          urgency: 'normal',
        });
        sent += 1;
      } catch (err) {
        // 410 Gone or 404 Not Found = subscription no longer valid
        if (err.statusCode === 410 || err.statusCode === 404) {
          staleIds.push(sub.id);
        } else {
          failed += 1;
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

  return { sent, failed, staleRemoved: staleIds.length, skipped: false };
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

  let parsedEndpoint;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    const err = new Error('Invalid subscription endpoint URL.');
    err.status = 400;
    throw err;
  }

  if (parsedEndpoint.protocol !== 'https:') {
    const err = new Error('Invalid subscription endpoint URL: https is required.');
    err.status = 400;
    throw err;
  }

  const safeUserAgent = typeof userAgent === 'string' && userAgent.trim()
    ? userAgent.trim().slice(0, 500)
    : null;

  const [record, created] = await PushSubscription.findOrCreate({
    where: { endpoint },
    defaults: { userId, endpoint, p256dh, auth, userAgent: safeUserAgent }
  });

  if (!created) {
    // Refresh keys and reassign to current user (user may have rotated keys)
    await record.update({ userId, p256dh, auth, userAgent: safeUserAgent });
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
  buildPushPayload,
  sendPushToUser,
  saveSubscription,
  removeSubscription,
  getUnreadCount,
};
