import { apiRequest } from './client.js';

/**
 * Link Preview API methods
 */
export const linkPreviewAPI = {
  /**
   * Fetch link preview metadata for a YouTube or TikTok URL.
   * @param {string} url
   * @returns {Promise<{success: boolean, data: object}>}
   */
  fetch: async (url) => {
    return apiRequest('/api/link-preview', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },
};
