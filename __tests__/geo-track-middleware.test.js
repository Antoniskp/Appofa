jest.mock('../src/models', () => ({
  GeoVisit: {
    create: jest.fn(),
  },
}));

const { GeoVisit } = require('../src/models');
const { geoTrackMiddleware } = require('../src/middleware/geoTrackMiddleware');

describe('geoTrackMiddleware', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('skips tracking in test environment', () => {
    process.env.NODE_ENV = 'test';
    const next = jest.fn();

    geoTrackMiddleware({ path: '/', headers: {}, ip: '1.1.1.1' }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(GeoVisit.create).not.toHaveBeenCalled();
  });

  it('skips API and internal paths', () => {
    process.env.NODE_ENV = 'development';
    const next = jest.fn();

    geoTrackMiddleware({ path: '/api/admin', headers: {}, ip: '1.1.1.1' }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(GeoVisit.create).not.toHaveBeenCalled();
  });

  it('tracks visit with hashed session and locale', () => {
    process.env.NODE_ENV = 'development';
    GeoVisit.create.mockResolvedValueOnce({});
    const next = jest.fn();

    geoTrackMiddleware({
      path: '/locations/greece',
      headers: {
        'cf-ipcountry': 'GR',
        'user-agent': 'test-agent',
        cookie: 'token=my-token; NEXT_LOCALE=en',
      },
      ip: '2.2.2.2',
    }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(GeoVisit.create).toHaveBeenCalledTimes(1);

    const payload = GeoVisit.create.mock.calls[0][0];
    expect(payload.countryCode).toBe('GR');
    expect(payload.countryName).toBeTruthy();
    expect(payload.isAuthenticated).toBe(true);
    expect(payload.path).toBe('/locations/greece');
    expect(payload.locale).toBe('en');
    expect(payload.sessionHash).toHaveLength(64);
    expect(payload.sessionHash).not.toContain('2.2.2.2');
  });
});
