const LoadMoreTrigger = require('../components/ui/LoadMoreTrigger');

describe('LoadMoreTrigger', () => {
  it('should export LoadMoreTrigger component', () => {
    expect(LoadMoreTrigger).toBeDefined();
  });

  it('should be a function or object (React component)', () => {
    const type = typeof LoadMoreTrigger.default || typeof LoadMoreTrigger;
    expect(['function', 'object']).toContain(type);
  });
});
