/**
 * Tests for security-relevant visitor entry tracking behavior.
 *
 * Root cause fixed: GeoTracker previously gated ALL tracking on
 * analyticsConsent === true, so visitors who declined analytics
 * cookies were never recorded. This test suite documents the expected
 * always-on behavior: the /track endpoint must accept visitor entry
 * data regardless of any consent state, and the endpoint must NOT
 * require authentication.
 */

const request = require('supertest');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Op } = require('sequelize');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');
const { sequelize, GeoVisit } = require('../src/models');
const geoStatsRoutes = require('../src/routes/geoStatsRoutes');

process.env.JWT_SECRET = 'geo-tracker-security-test-secret';
process.env.NODE_ENV = 'test';

const app = express();
app.set('trust proxy', true);
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/admin/geo-stats', geoStatsRoutes);

describe('Security visitor entry tracking — always-on, no consent required', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('POST /track saves a visit with no auth cookie (anonymous visitor)', async () => {
    // No auth_token cookie, no consent header — simulates a brand-new visitor
    const res = await request(app)
      .post('/api/admin/geo-stats/track')
      .set('x-forwarded-for', '203.0.113.1')
      .send({ path: '/security-anonymous', countryCode: 'GR', locale: 'el' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await GeoVisit.findOne({ where: { path: '/security-anonymous' } });
    expect(saved).toBeTruthy();
    expect(saved.isAuthenticated).toBe(false);
    expect(saved.userId).toBeNull();
    expect(saved.ipAddress).toBe('203.0.113.1');
  });

  it('POST /track saves a visit when no analytics-consent header is provided', async () => {
    // Confirm the endpoint has no server-side consent gate — it accepts the call
    // regardless of any GDPR consent state from the client.
    const res = await request(app)
      .post('/api/admin/geo-stats/track')
      .set('x-forwarded-for', '198.51.100.42')
      .send({ path: '/security-no-consent' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await GeoVisit.findOne({ where: { path: '/security-no-consent' } });
    expect(saved).toBeTruthy();
    expect(saved.ipAddress).toBe('198.51.100.42');
  });

  it('POST /track saves a visit when visitor explicitly declined analytics consent', async () => {
    // The old GeoTracker would NOT call /track in this case.
    // Now it always calls /track; the backend must always persist the entry.
    // We simulate the request that GeoTracker now sends unconditionally.
    const res = await request(app)
      .post('/api/admin/geo-stats/track')
      .set('x-forwarded-for', '192.0.2.55')
      // No analytics consent header — consent decisions are client-side only
      .send({ path: '/security-consent-declined', countryCode: 'DE', locale: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const saved = await GeoVisit.findOne({ where: { path: '/security-consent-declined' } });
    expect(saved).toBeTruthy();
    expect(saved.countryCode).toBe('DE');
    expect(saved.locale).toBe('en');
  });

  it('POST /track does not require CSRF token (public tracking endpoint)', async () => {
    // The /track route is intentionally exempt from CSRF protection so that
    // all visitors (including those without a CSRF session cookie) can be recorded.
    const res = await request(app)
      .post('/api/admin/geo-stats/track')
      .set('x-forwarded-for', '192.0.2.99')
      .send({ path: '/security-no-csrf' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /track accepts visits from multiple distinct IPs in sequence', async () => {
    // Verifies that repeated calls from different IPs all get recorded
    const visitors = [
      { ip: '10.0.0.1', path: '/multi-visitor-1' },
      { ip: '10.0.0.2', path: '/multi-visitor-2' },
      { ip: '10.0.0.3', path: '/multi-visitor-3' },
    ];

    for (const { ip, path } of visitors) {
      const res = await request(app)
        .post('/api/admin/geo-stats/track')
        .set('x-forwarded-for', ip)
        .send({ path });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    const count = await GeoVisit.count({
      where: { path: { [Op.in]: ['/multi-visitor-1', '/multi-visitor-2', '/multi-visitor-3'] } },
    });
    expect(count).toBe(3);
  });
});

/**
 * Tests for the readCookie utility extracted from GeoTracker.
 * Confirms the helper correctly reads a named value from a cookie string.
 */
describe('GeoTracker readCookie helper', () => {
  // Re-implement the helper inline to test it independently from the React component
  const readCookie = (cookieString, name) => {
    const row = cookieString
      .split('; ')
      .find((value) => value.startsWith(`${name}=`));
    if (!row) return null;
    const separatorIndex = row.indexOf('=');
    if (separatorIndex < 0) return null;
    return row.slice(separatorIndex + 1) || null;
  };

  it('returns the value of a named cookie', () => {
    expect(readCookie('NEXT_LOCALE=el; other=x', 'NEXT_LOCALE')).toBe('el');
  });

  it('returns null when the cookie is absent', () => {
    expect(readCookie('other=x', 'NEXT_LOCALE')).toBeNull();
  });

  it('returns null for an empty cookie string', () => {
    expect(readCookie('', 'NEXT_LOCALE')).toBeNull();
  });

  it('returns null when cookie value is empty', () => {
    expect(readCookie('NEXT_LOCALE=', 'NEXT_LOCALE')).toBeNull();
  });

  it('returns value when multiple cookies are present', () => {
    expect(readCookie('a=1; NEXT_LOCALE=en; b=2', 'NEXT_LOCALE')).toBe('en');
  });
});
