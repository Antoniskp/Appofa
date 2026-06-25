const { escapeLikePattern } = require('../src/utils/validators');

describe('escapeLikePattern', () => {
  it('escapes SQL LIKE wildcards and the escape character', () => {
    expect(escapeLikePattern('100%_done\\today')).toBe('100\\%\\_done\\\\today');
  });

  it('coerces non-string values before escaping', () => {
    expect(escapeLikePattern(123)).toBe('123');
  });
});
