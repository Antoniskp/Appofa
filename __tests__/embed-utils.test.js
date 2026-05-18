const {
  buildIframeEmbedCode,
  getEmbedPath,
  parseEmbedEntityId,
} = require('../lib/utils/embed');

describe('embed utils', () => {
  test('builds slugged poll embed paths and numeric paths for other entities', () => {
    expect(getEmbedPath('polls', 42, 'Δοκιμή δημοσκόπησης')).toBe('/embed/polls/42-δοκιμή-δημοσκόπησης');
    expect(getEmbedPath('suggestions', 7)).toBe('/embed/suggestions/7');
    expect(getEmbedPath('civic-questions', 9)).toBe('/embed/civic-questions/9');
  });

  test('parses numeric ids from slugged embed params', () => {
    expect(parseEmbedEntityId('42-δοκιμή')).toBe(42);
    expect(parseEmbedEntityId('9')).toBe(9);
    expect(parseEmbedEntityId('abc')).toBeNull();
  });

  test('escapes iframe attributes when generating embed code', () => {
    const code = buildIframeEmbedCode({
      src: 'https://appofasi.gr/embed/polls/5-test?x=1&y=2',
      height: 620,
      title: 'Title "quoted"',
    });

    expect(code).toContain('src="https://appofasi.gr/embed/polls/5-test?x=1&amp;y=2"');
    expect(code).toContain('title="Title &quot;quoted&quot;"');
    expect(code).toContain('height="620"');
    expect(code).toContain('loading="lazy"');
  });
});
