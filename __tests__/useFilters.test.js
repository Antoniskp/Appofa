// Basic tests for useFilters hook
// Tests the hook by importing and verifying its structure

const { useFilters } = require('../hooks/useFilters');

describe('useFilters', () => {
  it('should export useFilters function', () => {
    expect(useFilters).toBeDefined();
    expect(typeof useFilters).toBe('function');
  });

  it('should be a valid hook (name starts with use)', () => {
    expect(useFilters.name).toBe('useFilters');
  });
});
