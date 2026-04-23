const { apiRequest } = require('../../lib/api/client.js');
const { buildQueryEndpoint } = require('../../lib/utils/queryString.js');
const { geoAdminAPI } = require('../../lib/api/geoAdmin.js');

jest.mock('../../lib/api/client.js', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('../../lib/utils/queryString.js', () => ({
  buildQueryEndpoint: jest.fn((base, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return query ? `${base}?${query}` : base;
  }),
}));

describe('geoAdminAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds visits endpoint with query params', async () => {
    apiRequest.mockResolvedValue({ success: true, data: {} });

    await geoAdminAPI.getVisits({ period: '30d' });

    expect(buildQueryEndpoint).toHaveBeenCalledWith('/api/admin/geo-stats/visits', { period: '30d' });
    expect(apiRequest).toHaveBeenCalledWith('/api/admin/geo-stats/visits?period=30d');
  });

  it('posts track visit payload', async () => {
    apiRequest.mockResolvedValue({ success: true });

    await geoAdminAPI.trackVisit({ path: '/admin/geo', countryCode: 'GR' });

    expect(apiRequest).toHaveBeenCalledWith('/api/admin/geo-stats/track', {
      method: 'POST',
      body: JSON.stringify({ path: '/admin/geo', countryCode: 'GR' }),
    });
  });

  it('calls countries endpoint', async () => {
    apiRequest.mockResolvedValue({ success: true, data: [] });

    await geoAdminAPI.getCountries();

    expect(apiRequest).toHaveBeenCalledWith('/api/admin/geo-stats/countries');
  });

  it('calls funding list endpoint', async () => {
    apiRequest.mockResolvedValue({ success: true, data: [] });

    await geoAdminAPI.listFunding();

    expect(apiRequest).toHaveBeenCalledWith('/api/admin/geo-stats/country-funding');
  });

  it('posts create funding payload', async () => {
    apiRequest.mockResolvedValue({ success: true, data: { id: 1 } });

    await geoAdminAPI.createFunding({ locationId: 12, goalAmount: 500 });

    expect(apiRequest).toHaveBeenCalledWith('/api/admin/geo-stats/country-funding', {
      method: 'POST',
      body: JSON.stringify({ locationId: 12, goalAmount: 500 }),
    });
  });

  it('puts update funding payload', async () => {
    apiRequest.mockResolvedValue({ success: true, data: { id: 1 } });

    await geoAdminAPI.updateFunding(15, { status: 'funding' });

    expect(apiRequest).toHaveBeenCalledWith('/api/admin/geo-stats/country-funding/15', {
      method: 'PUT',
      body: JSON.stringify({ status: 'funding' }),
    });
  });

  it('deletes funding record', async () => {
    apiRequest.mockResolvedValue({ success: true });

    await geoAdminAPI.deleteFunding(88);

    expect(apiRequest).toHaveBeenCalledWith('/api/admin/geo-stats/country-funding/88', {
      method: 'DELETE',
    });
  });

  it('is exported through lib/api index', () => {
    const { geoAdminAPI: exportedGeoAdminAPI } = require('../../lib/api');
    expect(exportedGeoAdminAPI).toBeDefined();
    expect(typeof exportedGeoAdminAPI.getVisits).toBe('function');
  });
});
