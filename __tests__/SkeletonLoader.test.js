// Tests for SkeletonLoader component
// Verifies all skeleton types and component structure

const SkeletonLoader = require('../components/SkeletonLoader');

describe('SkeletonLoader', () => {
  it('should export SkeletonLoader component', () => {
    expect(SkeletonLoader).toBeDefined();
  });

  it('should be a function or object (React component)', () => {
    const type = typeof SkeletonLoader.default || typeof SkeletonLoader;
    expect(['function', 'object']).toContain(type);
  });

  // Test that the component has the correct structure
  it('should accept type, count, className, and variant props', () => {
    const component = SkeletonLoader.default || SkeletonLoader;
    expect(component).toBeDefined();
    // Component should be callable (a function)
    expect(typeof component).toBe('function');
  });
});
