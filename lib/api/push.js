import { apiRequest } from './client.js';

/**
 * Push notification API module.
 *
 * Sends a device's PushSubscription to the backend so the server can deliver
 * Web Push messages to this device via POST /api/push/subscribe.
 */
export const pushAPI = {
  status: () =>
    apiRequest('/api/push/status', {
      method: 'GET',
    }),

  test: () =>
    apiRequest('/api/push/test', {
      method: 'POST',
    }),

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
