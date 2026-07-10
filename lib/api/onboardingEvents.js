import { apiRequest } from './client.js';

export const onboardingEventAPI = {
  /**
   * Record a single onboarding funnel milestone.
   * Idempotent for once-per-user event types.
   *
   * @param {object} payload
   * @param {string} payload.eventType - one of the allowed event types
   * @param {string|null} [payload.goal] - optional goal context
   * @param {object|null} [payload.metadata] - allowlisted scalar metadata
   */
  record: async ({ eventType, goal = null, metadata = null } = {}) => {
    return apiRequest('/api/onboarding/events', {
      method: 'POST',
      body: JSON.stringify({ eventType, goal, metadata }),
    });
  },
};
