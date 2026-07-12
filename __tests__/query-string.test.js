const { buildQueryEndpoint } = require('../lib/utils/queryString.js');

describe('buildQueryEndpoint', () => {
  test('omits undefined and null query params while preserving meaningful blanks', () => {
    expect(buildQueryEndpoint('/api/media', {
      usageType: 'article_cover',
      search: undefined,
      tag: null,
      shared: 'true',
      empty: '',
    })).toBe('/api/media?usageType=article_cover&shared=true&empty=');
  });
});
