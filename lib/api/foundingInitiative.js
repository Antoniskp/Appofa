import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

const base = '/api/founding-initiative';

export const foundingInitiativeAPI = {
  getMyInterest: () => apiRequest(`${base}/interest`),
  saveInterest: data => apiRequest(`${base}/interest`, { method: 'PUT', body: JSON.stringify(data) }),
  withdrawInterest: () => apiRequest(`${base}/interest`, { method: 'DELETE' }),
  listInterests: (page, status) => apiRequest(buildQueryEndpoint(`${base}/organizers`, { page, status })),
  updateSigningStatus: (id, signingStatus) => apiRequest(`${base}/organizers/${id}`, {
    method: 'PATCH', body: JSON.stringify({ signingStatus }),
  }),
};
