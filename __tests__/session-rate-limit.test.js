jest.mock('express-rate-limit', () => ({ rateLimit: (options) => options, ipKeyGenerator: (ip) => ip }));
jest.mock('../src/models', () => ({ User: { findByPk: jest.fn() } }));
jest.mock('../src/services/ipAccessService', () => ({ getIpRulesCache: async () => ({ whitelist: new Set() }) }));
const jwt = require('jsonwebtoken');
const { User } = require('../src/models');
const { apiLimiter } = require('../src/middleware/rateLimiter');

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
