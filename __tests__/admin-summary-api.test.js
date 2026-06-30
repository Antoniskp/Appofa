jest.mock('../lib/api/reports.js', () => ({
  reportAPI: {
    getAll: jest.fn(),
  },
}));

jest.mock('../lib/api/messages.js', () => ({
  messageAPI: {
    getAll: jest.fn(),
  },
}));

jest.mock('../lib/api/persons.js', () => ({
  personAPI: {
    getPendingClaims: jest.fn(),
  },
}));

jest.mock('../lib/api/personRemovalRequests.js', () => ({
  personRemovalRequestAPI: {
    getAll: jest.fn(),
  },
}));

const { reportAPI } = require('../lib/api/reports.js');
const { messageAPI } = require('../lib/api/messages.js');
const { personAPI } = require('../lib/api/persons.js');
const { personRemovalRequestAPI } = require('../lib/api/personRemovalRequests.js');
const { adminSummaryAPI } = require('../lib/api/adminSummary.js');

describe('adminSummaryAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches compact pending counts for admin queues', async () => {
    reportAPI.getAll.mockResolvedValue({ data: { pagination: { total: 4 } } });
    messageAPI.getAll.mockResolvedValue({ data: { pagination: { total: 2 } } });
    personAPI.getPendingClaims.mockResolvedValue({ data: { pagination: { totalItems: 3 } } });
    personRemovalRequestAPI.getAll.mockResolvedValue({ data: { pagination: { total: 1 } } });

    await expect(adminSummaryAPI.getQueueCounts()).resolves.toEqual({
      '/admin/reports': 4,
      '/admin/messages': 2,
      '/admin/persons/claims': 3,
      '/admin/removal-requests': 1,
    });

    expect(reportAPI.getAll).toHaveBeenCalledWith({ status: 'pending', page: 1, limit: 1 });
    expect(messageAPI.getAll).toHaveBeenCalledWith({ status: 'pending', limit: 1 });
    expect(personAPI.getPendingClaims).toHaveBeenCalledWith({ page: 1, limit: 1 });
    expect(personRemovalRequestAPI.getAll).toHaveBeenCalledWith({ status: 'pending', page: 1, limit: 1 });
  });
});
