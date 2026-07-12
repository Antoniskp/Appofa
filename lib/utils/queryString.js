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
  const filteredParams = Object.entries(params).reduce((current, [key, value]) => {
    if (value === undefined || value === null) return current;
    current[key] = value;
    return current;
  }, {});
  const queryString = new URLSearchParams(filteredParams).toString();
  return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
}
