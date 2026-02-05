// Basic tests for FilterBar component
// Tests the component by importing and verifying its structure

const FilterBar = require('../components/FilterBar');

describe('FilterBar', () => {
  it('should export FilterBar component', () => {
    expect(FilterBar).toBeDefined();
  });

  it('should be a function or object (React component)', () => {
    const type = typeof FilterBar.default || typeof FilterBar;
    expect(['function', 'object']).toContain(type);
  });
});
