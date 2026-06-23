import { apiRequest } from './client.js';

export const politicalAffiliationAPI = {
  /**
   * Get all political affiliations for a user.
   * @param {number} userId
   */
  getAll: async (userId) =>
    apiRequest(`/api/users/${userId}/political-affiliations`),

  /**
   * Add a political affiliation for a user.
   * @param {number} userId
   * @param {{ organizationId: number, endorsementLevel?: string }} data
   */
  add: async (userId, data) =>
    apiRequest(`/api/users/${userId}/political-affiliations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update the endorsement level of an existing affiliation.
   * @param {number} userId
   * @param {number} organizationId
   * @param {string} endorsementLevel
   */
  update: async (userId, organizationId, endorsementLevel) =>
    apiRequest(`/api/users/${userId}/political-affiliations/${organizationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ endorsementLevel }),
    }),

  /**
   * Remove a political affiliation.
   * @param {number} userId
   * @param {number} organizationId
   */
  remove: async (userId, organizationId) =>
    apiRequest(`/api/users/${userId}/political-affiliations/${organizationId}`, {
      method: 'DELETE',
    }),
};
