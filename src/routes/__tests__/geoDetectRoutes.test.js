const { normalizeCountryCode, parseClientIp } = require('../geoDetectRoutes');

describe('geoDetectRoutes helpers', () => {
  describe('normalizeCountryCode', () => {
    it('normalizes lowercase ISO country codes', () => {
      expect(normalizeCountryCode('us')).toBe('US');
    });

    it('rejects special unknown Cloudflare country codes', () => {
      expect(normalizeCountryCode('XX')).toBeNull();
      expect(normalizeCountryCode('t1')).toBeNull();
    });

    it('rejects invalid country values', () => {
      expect(normalizeCountryCode('USA')).toBeNull();
      expect(normalizeCountryCode('1A')).toBeNull();
      expect(normalizeCountryCode('')).toBeNull();
    });
  });

  describe('parseClientIp', () => {
    it('prefers the first x-forwarded-for IP', () => {
      const req = {
        headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.2' },
        ip: '10.0.0.2',
      };
      expect(parseClientIp(req)).toBe('203.0.113.10');
    });

    it('strips IPv4-mapped IPv6 prefixes', () => {
      const req = { headers: {}, ip: '::ffff:198.51.100.4' };
      expect(parseClientIp(req)).toBe('198.51.100.4');
    });

    it('handles forwarded IPv4 addresses that include a port', () => {
      const req = {
        headers: { 'x-forwarded-for': '203.0.113.10:443, 10.0.0.2' },
        ip: '10.0.0.2',
      };
      expect(parseClientIp(req)).toBe('203.0.113.10');
    });

    it('returns null for loopback IPs', () => {
      expect(parseClientIp({ headers: {}, ip: '127.0.0.1' })).toBeNull();
      expect(parseClientIp({ headers: {}, ip: '::1' })).toBeNull();
    });
  });
});
