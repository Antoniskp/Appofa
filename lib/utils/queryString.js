/**
 * Utility functions for building API endpoints with query strings
 */

/**
 * Build an API endpoint with query parameters
 * @param {string} baseEndpoint - The base endpoint path (e.g., '/api/articles')
 * @param {Object} params - Query parameters object
 * @returns {string} The endpoint with query string appended if params exist
 */
export function buildQueryEndpoint(baseEndpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
}
