// Basic tests for usePermissions hook
// Tests the hook by importing and verifying its structure

const { usePermissions } = require('../hooks/usePermissions');

describe('usePermissions', () => {
  it('should export usePermissions function', () => {
    expect(usePermissions).toBeDefined();
    expect(typeof usePermissions).toBe('function');
  });

  it('should be a valid hook (name starts with use)', () => {
    expect(usePermissions.name).toBe('usePermissions');
  });
});
