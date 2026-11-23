import { apiRequest } from './client';
export const calendarAPI = {
  list: (params, signal) => apiRequest(`/api/calendar?${new URLSearchParams(params)}`, { signal }),
  nextDay: (params, signal) => apiRequest(`/api/calendar/next?${new URLSearchParams(params)}`, { signal }),
  subscriptions: () => apiRequest('/api/calendar/subscriptions'),
  setSubscription: data => apiRequest('/api/calendar/subscriptions', { method: 'PUT', body: JSON.stringify(data) }),
  detail: id => apiRequest(`/api/calendar/events/${id}`),
  create: data => apiRequest('/api/calendar/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/api/calendar/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
