jest.mock('../src/models', () => ({ LinkPreviewCache: {} }));

const https = require('https');
const { EventEmitter } = require('events');
const { buildPreview, parseTikTokPage } = require('../src/controllers/linkPreviewController');

const id = '6718335390845095173';
const canonical = `https://www.tiktok.com/@scout2015/video/${id}`;
const page = `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${JSON.stringify({
  __DEFAULT_SCOPE__: { 'webapp.video-detail': { itemInfo: { itemStruct: {
    id, desc: 'Η περιγραφή του βίντεο 🎥', author: { nickname: 'Scout' }, video: { cover: 'https://example.com/cover.jpg' },
  } } } },
})}</script>`;

afterEach(() => jest.restoreAllMocks());

function mockResponses(responses) {
  return jest.spyOn(https, 'get').mockImplementation((url, _options, callback) => {
    const req = new EventEmitter();
    req.destroy = jest.fn();
    process.nextTick(() => {
      const response = responses(url);
      const res = new EventEmitter();
      res.statusCode = response.status || 200;
      res.headers = response.headers || {};
      res.resume = jest.fn();
      callback(res);
      res.emit('data', Buffer.from(response.body || ''));
      res.emit('end');
    });
    return req;
  });
}

test('fills metadata when the new oEmbed response only contains player information', async () => {
  mockResponses(url => ({ body: url.includes('/oembed?')
    ? JSON.stringify({ embed_product_id: id, html: `<iframe src="https://www.tiktok.com/player/v1/${id}"></iframe>` })
    : page }));
  const result = await buildPreview(new URL(canonical), 'tiktok', canonical);
  expect(result).toMatchObject({ title: 'Η περιγραφή του βίντεο 🎥', authorName: 'Scout', embedUrl: `https://www.tiktok.com/embed/v2/${id}` });
});

test('resolves shared short links and retries oEmbed with the canonical URL', async () => {
  const short = 'https://vm.tiktok.com/Example/';
  mockResponses(url => {
    if (url === short) return { status: 302, headers: { location: canonical } };
    if (url === canonical) return { body: page };
    return { body: JSON.stringify(url.includes(encodeURIComponent(canonical))
      ? { title: 'Canonical caption', author_name: 'Scout', embed_product_id: id }
      : { error: 'Invalid video URL' }) };
  });
  const result = await buildPreview(new URL(short), 'tiktok', short);
  expect(result.title).toBe('Canonical caption');
  expect(result.embedUrl).toContain(id);
});

test('decodes OpenGraph metadata with either attribute order', () => {
  expect(parseTikTokPage('<meta content="Greek &amp; &#x1f3a5;" property="og:description"><meta property="og:image" content="https://example.com/a.jpg">', id))
    .toMatchObject({ title: 'Greek & 🎥', thumbnailUrl: 'https://example.com/a.jpg' });
  expect(parseTikTokPage('<title>Log in | TikTok</title>', id)).toEqual({});
});

test('uses a creator-based title for a video without a caption', () => {
  const captionlessPage = page.replace('Η περιγραφή του βίντεο 🎥', '');
  expect(parseTikTokPage(captionlessPage, id)).toMatchObject({ title: 'TikTok · Scout', authorName: 'Scout', videoId: id });
  expect(parseTikTokPage(captionlessPage, '999')).toEqual({});
});

test('blocks short-link redirects outside the provider allowlist', async () => {
  const short = 'https://vm.tiktok.com/Blocked/';
  const get = mockResponses(url => url.includes('/oembed?')
    ? { body: '{}' }
    : { status: 302, headers: { location: 'http://127.0.0.1/private' } });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const result = await buildPreview(new URL(short), 'tiktok', short);
  expect(result.title).toBeNull();
  expect(get.mock.calls.every(([url]) => new URL(url).hostname.endsWith('tiktok.com'))).toBe(true);
});
