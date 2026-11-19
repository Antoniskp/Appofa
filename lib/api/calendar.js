import { apiRequest } from './client';
export const calendarAPI = {
  list: params => apiRequest(`/api/calendar?${new URLSearchParams(params)}`),
  nextDay: (params, signal) => apiRequest(`/api/calendar/next?${new URLSearchParams(params)}`, { signal }),
  detail: id => apiRequest(`/api/calendar/events/${id}`),
  create: data => apiRequest('/api/calendar/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/api/calendar/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
