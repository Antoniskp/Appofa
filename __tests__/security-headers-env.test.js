/**
 * Tests that securityHeaders.js uses FRONTEND_URL from process.env,
 * which is only correct when dotenv is loaded before the module is required.
 *
 * Regression test for: dotenv loaded after securityHeaders import in src/index.js
 * causing production CORS/CSP to fall back to http://localhost:3001.
 */

describe('securityHeaders env initialization', () => {
  const ORIGINAL_FRONTEND_URL = process.env.FRONTEND_URL;

  afterEach(() => {
    // Restore original value and purge cached module so each test gets a fresh read
    if (ORIGINAL_FRONTEND_URL === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = ORIGINAL_FRONTEND_URL;
    }
    jest.resetModules();
  });

  it('uses FRONTEND_URL from process.env when set before requiring the module', () => {
    process.env.FRONTEND_URL = 'https://example.com';
    const { corsOptions, helmetConfig } = require('../src/config/securityHeaders');

    expect(corsOptions.origin).toBe('https://example.com');
    expect(helmetConfig.contentSecurityPolicy.directives['connect-src']).toContain(
      'https://example.com'
    );
  });

  it('falls back to http://localhost:3001 when FRONTEND_URL is not set', () => {
    delete process.env.FRONTEND_URL;
    const { corsOptions } = require('../src/config/securityHeaders');

    expect(corsOptions.origin).toBe('http://localhost:3001');
  });

  it('src/index.js loads dotenv before importing securityHeaders', () => {
    // Verify the import order in src/index.js: dotenv must appear before
    // the securityHeaders import so that module-level env reads are correct.
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'index.js'),
      'utf8'
    );

    const dotenvPos = source.indexOf("require('dotenv').config()");
    const secHeadersPos = source.indexOf("require('./config/securityHeaders')");

    expect(dotenvPos).toBeGreaterThanOrEqual(0);
    expect(secHeadersPos).toBeGreaterThanOrEqual(0);
    expect(dotenvPos).toBeLessThan(secHeadersPos);
  });
});
