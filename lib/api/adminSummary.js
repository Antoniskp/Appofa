import { messageAPI } from './messages.js';
import { personAPI } from './persons.js';
import { personRemovalRequestAPI } from './personRemovalRequests.js';
import { reportAPI } from './reports.js';

const totalFromPagination = (pagination = {}) => (
  pagination.total ?? pagination.totalItems ?? 0
);

export const adminSummaryAPI = {
  getQueueCounts: async () => {
    const [
      reports,
      messages,
      personClaims,
      removalRequests,
    ] = await Promise.all([
      reportAPI.getAll({ status: 'pending', page: 1, limit: 1 }),
      messageAPI.getAll({ status: 'pending', limit: 1 }),
      personAPI.getPendingClaims({ page: 1, limit: 1 }),
      personRemovalRequestAPI.getAll({ status: 'pending', page: 1, limit: 1 }),
    ]);

    return {
      '/admin/reports': totalFromPagination(reports.data?.pagination),
      '/admin/messages': totalFromPagination(messages.data?.pagination),
      '/admin/persons/claims': totalFromPagination(personClaims.data?.pagination),
      '/admin/removal-requests': totalFromPagination(removalRequests.data?.pagination),
    };
  },
};
