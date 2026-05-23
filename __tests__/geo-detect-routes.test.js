describe('Geo Detect Routes', () => {
  const request = require('supertest');
  const express = require('express');

  const buildApp = () => {
    const app = express();
    // Load fresh module to allow per-test geoip-lite mocking.
    // eslint-disable-next-line global-require
    const geoDetectRoutes = require('../src/routes/geoDetectRoutes');
    app.use('/api/geo', geoDetectRoutes);
    return app;
  };

  it('GET /detect returns header-based country', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/api/geo/detect')
      .set('CF-IPCountry', 'GR');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      countryCode: 'GR',
      countryName: 'Greece',
      detectionSource: 'cf-ipcountry',
      trustedForCountryRedirect: true,
    });
  });

  it('GET /detect treats unknown cloudflare placeholders as null', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/api/geo/detect')
      .set('CF-IPCountry', 'XX');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.countryCode).toBeNull();
    expect(res.body.data.countryName).toBeNull();
    expect(res.body.data.detectionSource).toBe('none');
    expect(res.body.data.trustedForCountryRedirect).toBe(false);
  });

  it('GET /detect marks fallback non-GR detection as informational only', async () => {
    try {
      jest.doMock('geoip-lite', () => ({
        lookup: () => ({ country: 'US' }),
      }));
      const app = buildApp();
      const res = await request(app)
        .get('/api/geo/detect')
        .set('x-forwarded-for', '8.8.8.8');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.countryCode).toBe('US');
      expect(res.body.data.detectionSource).toBe('geoip-fallback');
      expect(res.body.data.trustedForCountryRedirect).toBe(false);
    } finally {
      jest.unmock('geoip-lite');
      jest.resetModules();
    }
  });

  it('GET /detect allows fallback GR detection as trusted for redirect', async () => {
    try {
      jest.doMock('geoip-lite', () => ({
        lookup: () => ({ country: 'GR' }),
      }));
      const app = buildApp();
      const res = await request(app)
        .get('/api/geo/detect')
        .set('x-forwarded-for', '8.8.8.8');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.countryCode).toBe('GR');
      expect(res.body.data.detectionSource).toBe('geoip-fallback');
      expect(res.body.data.trustedForCountryRedirect).toBe(true);
    } finally {
      jest.unmock('geoip-lite');
      jest.resetModules();
    }
  });
});
