const { escapeLikePattern, normalizePublicHttpUrl } = require('../src/utils/validators');

describe('escapeLikePattern', () => {
  it('escapes SQL LIKE wildcards and the escape character', () => {
    expect(escapeLikePattern('100%_done\\today')).toBe('100\\%\\_done\\\\today');
  });

  it('coerces non-string values before escaping', () => {
    expect(escapeLikePattern(123)).toBe('123');
  });
});

describe('normalizePublicHttpUrl', () => {
  it('allows public http and https URLs', () => {
    expect(normalizePublicHttpUrl('https://example.com/image.png', 'Image URL', false)).toEqual({
      value: 'https://example.com/image.png'
    });
  });

  it('allows relative URLs only when requested', () => {
    expect(normalizePublicHttpUrl('/uploads/profiles/1.webp', 'Image URL', true)).toEqual({
      value: '/uploads/profiles/1.webp'
    });
    expect(normalizePublicHttpUrl('/uploads/profiles/1.webp', 'Image URL', false).error).toBe('Image URL is malformed.');
  });

  it('rejects private, loopback, and credentialed URLs', () => {
    expect(normalizePublicHttpUrl('http://localhost/image.png', 'Image URL', false).error).toBe('Image URL must use a public hostname.');
    expect(normalizePublicHttpUrl('http://127.0.0.1/image.png', 'Image URL', false).error).toBe('Image URL must use a public hostname.');
    expect(normalizePublicHttpUrl('http://[::1]/image.png', 'Image URL', false).error).toBe('Image URL must use a public hostname.');
    expect(normalizePublicHttpUrl('http://192.168.1.10/image.png', 'Image URL', false).error).toBe('Image URL must use a public hostname.');
    expect(normalizePublicHttpUrl('https://user:pass@example.com/image.png', 'Image URL', false).error).toBe('Image URL must not include credentials.');
  });
});
