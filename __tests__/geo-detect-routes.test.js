const request = require('supertest');
const express = require('express');

const geoDetectRoutes = require('../src/routes/geoDetectRoutes');

describe('Geo Detect Routes', () => {
  const app = express();
  app.use('/api/geo', geoDetectRoutes);

  it('GET /detect returns header-based country', async () => {
    const res = await request(app)
      .get('/api/geo/detect')
      .set('CF-IPCountry', 'GR');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      countryCode: 'GR',
      countryName: 'Greece',
    });
  });

  it('GET /detect treats unknown cloudflare placeholders as null', async () => {
    const res = await request(app)
      .get('/api/geo/detect')
      .set('CF-IPCountry', 'XX');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.countryCode).toBeNull();
    expect(res.body.data.countryName).toBeNull();
  });
});
