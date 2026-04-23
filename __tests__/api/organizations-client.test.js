const { apiRequest } = require('../../lib/api/client.js');
const { buildQueryEndpoint } = require('../../lib/utils/queryString.js');
const { organizationAPI } = require('../../lib/api/organizations.js');
const { officialPostsAPI } = require('../../lib/api/officialPosts.js');

jest.mock('../../lib/api/client.js', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('../../lib/utils/queryString.js', () => ({
  buildQueryEndpoint: jest.fn((base, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return query ? `${base}?${query}` : base;
  }),
}));

describe('organizationAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds list endpoint with query params', async () => {
    apiRequest.mockResolvedValue({ success: true, data: { organizations: [] } });

    await organizationAPI.getAll({ page: 2, type: 'company' });

    expect(buildQueryEndpoint).toHaveBeenCalledWith('/api/organizations', { page: 2, type: 'company' });
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations?page=2&type=company');
  });

  it('calls get by slug endpoint', async () => {
    await organizationAPI.getBySlug('open-civic-lab');

    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/open-civic-lab');
  });

  it('posts create payload', async () => {
    await organizationAPI.create({ name: 'Open Civic Lab', type: 'organization' });

    expect(apiRequest).toHaveBeenCalledWith('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Open Civic Lab', type: 'organization' }),
    });
  });

  it('puts update payload', async () => {
    await organizationAPI.update(12, { name: 'Renamed Org' });

    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/12', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Renamed Org' }),
    });
  });

  it('deletes organization', async () => {
    await organizationAPI.delete(14);

    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/14', {
      method: 'DELETE',
    });
  });

  it('calls members endpoint', async () => {
    await organizationAPI.getMembers(99);

    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/99/members');
  });

  it('joins and leaves organization', async () => {
    await organizationAPI.join(3);
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/3/join', {
      method: 'POST',
    });

    await organizationAPI.leave(3);
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/3/leave', {
      method: 'DELETE',
    });
  });

  it('calls member management endpoints', async () => {
    await organizationAPI.inviteMember(7, 42);
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/7/members/invite', {
      method: 'POST',
      body: JSON.stringify({ userId: 42 }),
    });

    await organizationAPI.approveMember(7, 42);
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/7/members/42/approve', {
      method: 'PATCH',
    });

    await organizationAPI.removeMember(7, 42);
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/7/members/42', {
      method: 'DELETE',
    });

    await organizationAPI.updateMemberRole(7, 42, 'admin');
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/7/members/42/role', {
      method: 'PATCH',
      body: JSON.stringify({ role: 'admin' }),
    });

    await organizationAPI.getPendingMembers(7);
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/7/members/pending');
  });

  it('calls organization polls and suggestions endpoints', async () => {
    await organizationAPI.getPolls(5, { page: 2 });
    expect(buildQueryEndpoint).toHaveBeenCalledWith('/api/organizations/5/polls', { page: 2 });
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/5/polls?page=2');

    await organizationAPI.createPoll(5, { title: 'Internal poll' });
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/5/polls', {
      method: 'POST',
      body: JSON.stringify({ title: 'Internal poll' }),
    });

    await organizationAPI.getSuggestions(5, { sort: 'newest' });
    expect(buildQueryEndpoint).toHaveBeenCalledWith('/api/organizations/5/suggestions', { sort: 'newest' });
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/5/suggestions?sort=newest');

    await organizationAPI.createSuggestion(5, { title: 'Proposal', body: 'Long enough proposal body' });
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/5/suggestions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Proposal', body: 'Long enough proposal body' }),
    });
  });

  it('calls organization official posts and verification endpoints', async () => {
    await organizationAPI.getOfficialPosts(5, { page: 1 });
    expect(buildQueryEndpoint).toHaveBeenCalledWith('/api/organizations/5/official-posts', { page: 1 });
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/5/official-posts?page=1');

    await organizationAPI.createOfficialPost(5, { contentType: 'suggestion', title: 'Official title', body: 'Official body' });
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/5/official-posts', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'suggestion', title: 'Official title', body: 'Official body' }),
    });

    await organizationAPI.getVerificationStatus(5);
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/5/verification');

    await organizationAPI.setVerified(5, true);
    expect(apiRequest).toHaveBeenCalledWith('/api/organizations/5/verify', {
      method: 'PATCH',
      body: JSON.stringify({ isVerified: true }),
    });
  });

  it('builds official posts discovery endpoint with query params', async () => {
    await officialPostsAPI.getAll({ page: 3 });

    expect(buildQueryEndpoint).toHaveBeenCalledWith('/api/official-posts', { page: 3 });
    expect(apiRequest).toHaveBeenCalledWith('/api/official-posts?page=3');
  });

  it('is exported through lib/api index', () => {
    const {
      organizationAPI: exportedOrganizationAPI,
      officialPostsAPI: exportedOfficialPostsAPI,
    } = require('../../lib/api');
    expect(exportedOrganizationAPI).toBeDefined();
    expect(typeof exportedOrganizationAPI.getAll).toBe('function');
    expect(exportedOfficialPostsAPI).toBeDefined();
    expect(typeof exportedOfficialPostsAPI.getAll).toBe('function');
  });
});
