import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

const endpoint = '/api/tiktok-creators';

export const tiktokCreatorAPI = {
  getAll: (filters) => apiRequest(buildQueryEndpoint(endpoint, filters)),
  submit: (data) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  getReviewQueue: (filters) => apiRequest(buildQueryEndpoint(`${endpoint}/review`, filters)),
  review: (id, data) => apiRequest(`${endpoint}/review/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
