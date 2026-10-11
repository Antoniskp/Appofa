import { apiRequest } from './client.js';

export const homepageAPI = {
  get: (locationId, sections, options) => {
    const query = new URLSearchParams();
    if (locationId) query.set('locationId', locationId);
    if (sections?.length) query.set('sections', sections.join(','));
    return apiRequest(`/api/homepage${query.size ? `?${query}` : ''}`, options);
  },
};
