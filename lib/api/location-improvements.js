import { apiRequest } from './client';

const base = locationId => `/api/locations/${locationId}/improvements`;
export const locationImprovementAPI = {
  list: (locationId, view = 'history', page = 1) => apiRequest(`${base(locationId)}?view=${view}&page=${page}`),
  create: (locationId, data) => apiRequest(base(locationId), { method: 'POST', body: JSON.stringify(data) }),
  revise: (locationId, id, data) => apiRequest(`${base(locationId)}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  review: (locationId, id, data) => apiRequest(`${base(locationId)}/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) }),
};
