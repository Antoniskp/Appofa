// Basic tests for useOAuthConfig hook
// Tests the hook by importing and verifying its structure

const { useOAuthConfig } = require('../hooks/useOAuthConfig');

describe('useOAuthConfig', () => {
  it('should export useOAuthConfig function', () => {
    expect(useOAuthConfig).toBeDefined();
    expect(typeof useOAuthConfig).toBe('function');
  });

  it('should be a valid hook (name starts with use)', () => {
    expect(useOAuthConfig.name).toBe('useOAuthConfig');
  });
});
