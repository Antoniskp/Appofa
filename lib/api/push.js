import { apiRequest } from './client.js';

/**
 * Push notification API module.
 *
 * TODO: Implement POST /api/push/subscribe on the backend to persist
 *       the PushSubscription and associate it with the logged-in user.
 *       Use the `web-push` npm package together with VAPID keys for delivery.
 */
export const pushAPI = {
  /**
   * Send a PushSubscription object to the backend so the server can deliver
   * push messages to this device.
   *
   * @param {PushSubscription} subscription - the subscription returned by pushManager.subscribe()
   */
  subscribe: (subscription) =>
    apiRequest('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    }),
};
