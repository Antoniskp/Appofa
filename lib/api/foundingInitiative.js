import { apiRequest } from './client.js';
import { buildQueryEndpoint } from '../utils/queryString.js';

const base = '/api/founding-initiative';

export const foundingInitiativeAPI = {
  getProgress: (recognition = false) => apiRequest(`${base}/progress${recognition ? '?recognition=true' : ''}`),
  getDigitalSignature: () => apiRequest(`${base}/digital-signature`),
  submitDigitalSignature: data => apiRequest(`${base}/digital-signature`, { method: 'POST', body: JSON.stringify(data) }),
  getRecognition: () => apiRequest(`${base}/recognition`),
  publishName: data => apiRequest(`${base}/recognition`, { method: 'PUT', body: JSON.stringify(data) }),
  hideName: () => apiRequest(`${base}/recognition`, { method: 'DELETE' }),
  getMyInterest: () => apiRequest(`${base}/interest`),
  saveInterest: data => apiRequest(`${base}/interest`, { method: 'PUT', body: JSON.stringify(data) }),
  withdrawInterest: () => apiRequest(`${base}/interest`, { method: 'DELETE' }),
  listInterests: (page, status) => apiRequest(buildQueryEndpoint(`${base}/organizers`, { page, status })),
  updateSigningStatus: (id, signingStatus) => apiRequest(`${base}/organizers/${id}`, {
    method: 'PATCH', body: JSON.stringify({ signingStatus }),
  }),
  lockSigningDocument: data => apiRequest(`${base}/organizers/document`, { method: 'POST', body: JSON.stringify(data) }),
  setGovGrSigning: enabled => apiRequest(`${base}/organizers/document/gov-gr`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  verifySignature: (id, data) => apiRequest(`${base}/organizers/${id}/verify`, {
    method: 'POST', body: JSON.stringify(data),
  }),
  removeVerification: id => apiRequest(`${base}/organizers/signatures/${id}`, { method: 'DELETE' }),
};
