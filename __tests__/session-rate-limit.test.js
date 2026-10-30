jest.mock('express-rate-limit', () => ({ rateLimit: (options) => options, ipKeyGenerator: (ip) => ip }));
jest.mock('../src/models', () => ({ User: { findByPk: jest.fn() } }));
jest.mock('../src/services/ipAccessService', () => ({ getIpRulesCache: async () => ({ whitelist: new Set() }) }));
const jwt = require('jsonwebtoken');
const { User } = require('../src/models');
const { apiLimiter } = require('../src/middleware/rateLimiter');

test('browsing has larger independent quotas and leaves session recovery available', async () => {
  const guest = { method: 'GET', originalUrl: '/api/news', headers: {}, ip: '203.0.113.2' };
  const write = { ...guest, method: 'POST' };
  const session = { ...guest, originalUrl: '/api/auth/oauth/config' };
  expect(await apiLimiter.limit(guest)).toBe(1200);
  expect(await apiLimiter.limit(write)).toBe(200);
  expect(await apiLimiter.keyGenerator(guest)).not.toBe(await apiLimiter.keyGenerator(write));
  expect(await apiLimiter.keyGenerator(guest)).not.toBe(await apiLimiter.keyGenerator(session));
  const token = jwt.sign({ id: 2, role: 'viewer', sessionVersion: '0' }, process.env.JWT_SECRET);
  User.findByPk.mockResolvedValue({ id: 2, role: 'viewer', sessionVersion: '0' });
  expect(await apiLimiter.limit({ method: 'GET', originalUrl: '/api/news', ip: guest.ip, headers: { authorization: `Bearer ${token}` } })).toBe(3600);
});

test('browsing responses include an identifiable code and recovery time', () => {
  const json = jest.fn();
  apiLimiter.handler({ method: 'GET', originalUrl: '/api/news', rateLimit: { resetTime: new Date(Date.now() + 60000) } }, { status: () => ({ json }) });
  expect(json.mock.calls[0][0]).toMatchObject({ code: 'BROWSING_RATE_LIMITED', retryAfter: 60 });
});

test('revoked or deleted admin sessions cannot bypass rate limits or get authenticated quotas', async () => {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const token = jwt.sign({ id: 1, role: 'admin', sessionVersion: '0' }, process.env.JWT_SECRET);
    for (const account of [null, { id: 1, role: 'admin', sessionVersion: 'revoked' }, { id: 1, role: 'viewer', sessionVersion: '0' }]) {
      User.findByPk.mockResolvedValue(account);
      const req = { headers: { authorization: `Bearer ${token}` }, ip: '203.0.113.1' };
      expect(await apiLimiter.skip(req)).toBe(false);
      expect(await apiLimiter.limit(req)).toBe(account?.role === 'viewer' ? 1000 : 200);
    }
  } finally { process.env.NODE_ENV = previousEnv; }
});
