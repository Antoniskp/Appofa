// Basic tests for useFetchArticle hook
// Tests the hook by importing and verifying its structure

const { useFetchArticle } = require('../hooks/useFetchArticle');

describe('useFetchArticle', () => {
  it('should export useFetchArticle function', () => {
    expect(useFetchArticle).toBeDefined();
    expect(typeof useFetchArticle).toBe('function');
  });

  it('should be a valid hook (name starts with use)', () => {
    expect(useFetchArticle.name).toBe('useFetchArticle');
  });
});
