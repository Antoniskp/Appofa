import { messageAPI } from './messages.js';
import { personAPI } from './persons.js';
import { personRemovalRequestAPI } from './personRemovalRequests.js';
import { reportAPI } from './reports.js';
import { candidateRegistrationAPI } from './candidateRegistrations.js';

const totalFromPagination = (pagination = {}) => (
  pagination.total ?? pagination.totalItems ?? 0
);

export const adminSummaryAPI = {
  getQueueCounts: async () => {
    const paths = ['/admin/reports', '/admin/messages', '/admin/persons/claims', '/admin/removal-requests', '/admin/candidates'];
    const results = await Promise.allSettled([
      reportAPI.getAll({ status: 'pending', page: 1, limit: 1 }),
      messageAPI.getAll({ status: 'pending', limit: 1 }),
      personAPI.getPendingClaims({ page: 1, limit: 1 }),
      personRemovalRequestAPI.getAll({ status: 'pending', page: 1, limit: 1 }),
      candidateRegistrationAPI.getAll({ status: 'submitted', page: 1, limit: 1 }),
    ]);

    return Object.fromEntries(results.map((result, index) => [paths[index],
      result.status === 'fulfilled' && result.value?.success !== false && result.value?.data?.pagination
        ? totalFromPagination(result.value.data.pagination) : null,
    ]));
  },
};
