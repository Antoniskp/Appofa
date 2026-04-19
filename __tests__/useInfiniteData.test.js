const { useInfiniteData } = require('../hooks/useInfiniteData');

describe('useInfiniteData', () => {
  it('should export useInfiniteData function', () => {
    expect(useInfiniteData).toBeDefined();
    expect(typeof useInfiniteData).toBe('function');
  });

  it('should be a valid hook (name starts with use)', () => {
    expect(useInfiniteData.name).toBe('useInfiniteData');
  });
});
