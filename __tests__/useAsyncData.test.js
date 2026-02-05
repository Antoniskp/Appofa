// Basic tests for useAsyncData hook
// Tests the hook by importing and verifying its structure

const { useAsyncData } = require('../hooks/useAsyncData');

describe('useAsyncData', () => {
  it('should export useAsyncData function', () => {
    expect(useAsyncData).toBeDefined();
    expect(typeof useAsyncData).toBe('function');
  });

  it('should be a valid hook (name starts with use)', () => {
    expect(useAsyncData.name).toBe('useAsyncData');
  });
});
