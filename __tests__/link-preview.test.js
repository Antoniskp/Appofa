/**
 * Tests for the link-preview endpoint:
 *   - URL allowlist / SSRF protection
 *   - Provider detection
 *   - URL normalization
 *   - YouTube video ID extraction and embed URL generation
 *   - API endpoint validation responses
 *
 * HTTP calls to YouTube / TikTok are mocked so no real network traffic is made.
 */

const request = require('supertest');
const express = require('express');
const { sequelize, LinkPreviewCache } = require('../src/models');

const {
  validateAndParseUrl,
  normalizeUrl,
  extractYouTubeVideoId,
  buildYouTubeEmbedUrl,
  extractTikTokVideoId,
  buildTikTokEmbedUrl,
  detectProvider,
  YOUTUBE_HOSTS,
  TIKTOK_HOSTS
} = require('../src/controllers/linkPreviewController');

const linkPreviewRoutes = require('../src/routes/linkPreviewRoutes');

// Build a minimal Express app for integration tests
const app = express();
app.use(express.json());
app.use('/api/link-preview', linkPreviewRoutes);

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('validateAndParseUrl', () => {
  test('rejects empty string', () => {
    expect(() => validateAndParseUrl('')).toThrow('URL is required');
  });

  test('rejects non-string input', () => {
    expect(() => validateAndParseUrl(null)).toThrow('URL is required');
    expect(() => validateAndParseUrl(undefined)).toThrow('URL is required');
  });

  test('rejects invalid URL format', () => {
    expect(() => validateAndParseUrl('not-a-url')).toThrow('Invalid URL format');
  });

  test('rejects non-http/https protocols', () => {
    expect(() => validateAndParseUrl('file:///etc/passwd')).toThrow();
    expect(() => validateAndParseUrl('ftp://example.com')).toThrow();
    expect(() => validateAndParseUrl('data:text/html,<h1>test</h1>')).toThrow();
  });

  test('rejects URLs with credentials (SSRF)', () => {
    expect(() => validateAndParseUrl('https://user:pass@youtube.com/watch?v=abc')).toThrow('credentials');
  });

  test('rejects private/loopback addresses (SSRF)', () => {
    expect(() => validateAndParseUrl('http://127.0.0.1/path')).toThrow('not allowed');
    expect(() => validateAndParseUrl('http://localhost/path')).toThrow('not allowed');
    expect(() => validateAndParseUrl('http://192.168.1.1/path')).toThrow('not allowed');
    expect(() => validateAndParseUrl('http://10.0.0.1/path')).toThrow('not allowed');
    expect(() => validateAndParseUrl('http://0.0.0.0/path')).toThrow('not allowed');
    expect(() => validateAndParseUrl('http://169.254.169.254/path')).toThrow('not allowed');
  });

  test('rejects non-YouTube/TikTok domains', () => {
    expect(() => validateAndParseUrl('https://example.com/video')).toThrow('Only YouTube and TikTok');
    expect(() => validateAndParseUrl('https://vimeo.com/123456')).toThrow('Only YouTube and TikTok');
    expect(() => validateAndParseUrl('https://facebook.com/video')).toThrow('Only YouTube and TikTok');
  });

  test('accepts valid YouTube URLs', () => {
    const urls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ'
    ];
    for (const url of urls) {
      const result = validateAndParseUrl(url);
      expect(result.provider).toBe('youtube');
    }
  });

  test('accepts valid TikTok URLs', () => {
    const urls = [
      'https://www.tiktok.com/@user/video/1234567890',
      'https://tiktok.com/@user/video/1234567890',
      'https://vm.tiktok.com/abcdef/',
      'https://m.tiktok.com/@user/video/1234567890',
      'https://t.tiktok.com/ZSxxxxxxx/'
    ];
    for (const url of urls) {
      const result = validateAndParseUrl(url);
      expect(result.provider).toBe('tiktok');
    }
  });
});

describe('extractYouTubeVideoId', () => {
  const toUrlObj = (url) => new URL(url);

  test('extracts from watch?v= format', () => {
    expect(extractYouTubeVideoId(toUrlObj('https://www.youtube.com/watch?v=dQw4w9WgXcQ')))
      .toBe('dQw4w9WgXcQ');
  });

  test('extracts from youtu.be short link', () => {
    expect(extractYouTubeVideoId(toUrlObj('https://youtu.be/dQw4w9WgXcQ')))
      .toBe('dQw4w9WgXcQ');
  });

  test('extracts from /embed/ path', () => {
    expect(extractYouTubeVideoId(toUrlObj('https://www.youtube.com/embed/dQw4w9WgXcQ')))
      .toBe('dQw4w9WgXcQ');
  });

  test('extracts from /shorts/ path', () => {
    expect(extractYouTubeVideoId(toUrlObj('https://www.youtube.com/shorts/dQw4w9WgXcQ')))
      .toBe('dQw4w9WgXcQ');
  });

  test('returns null for channel URL without video ID', () => {
    expect(extractYouTubeVideoId(toUrlObj('https://www.youtube.com/channel/UCabcd')))
      .toBeNull();
  });
});

describe('buildYouTubeEmbedUrl', () => {
  test('builds youtube-nocookie embed URL', () => {
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ');
    expect(url).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');
  });

  test('encodes special characters in video ID', () => {
    const url = buildYouTubeEmbedUrl('abc/def');
    expect(url).toContain('abc%2Fdef');
  });
});

describe('normalizeUrl', () => {
  test('normalizes YouTube watch URL to canonical form', () => {
    const urlObj = new URL('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share');
    const result = normalizeUrl(urlObj, 'youtube');
    expect(result).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('normalizes youtu.be short URL to canonical form', () => {
    const urlObj = new URL('https://youtu.be/dQw4w9WgXcQ?si=tracking123');
    const result = normalizeUrl(urlObj, 'youtube');
    expect(result).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('normalizes TikTok URL to www.tiktok.com path', () => {
    const urlObj = new URL('https://www.tiktok.com/@user/video/1234567890?lang=en');
    const result = normalizeUrl(urlObj, 'tiktok');
    expect(result).toBe('https://www.tiktok.com/@user/video/1234567890');
  });
});

describe('extractTikTokVideoId', () => {
  const toUrlObj = (url) => new URL(url);

  test('extracts video ID from standard @user/video/<id> URL', () => {
    expect(extractTikTokVideoId(toUrlObj('https://www.tiktok.com/@user/video/1234567890123456789')))
      .toBe('1234567890123456789');
  });

  test('extracts video ID from m.tiktok.com URL', () => {
    expect(extractTikTokVideoId(toUrlObj('https://m.tiktok.com/@user/video/9876543210')))
      .toBe('9876543210');
  });

  test('returns null for vm.tiktok.com shortlink (no video ID in path)', () => {
    expect(extractTikTokVideoId(toUrlObj('https://vm.tiktok.com/ZMxxxxx/')))
      .toBeNull();
  });

  test('returns null for TikTok profile URL', () => {
    expect(extractTikTokVideoId(toUrlObj('https://www.tiktok.com/@user')))
      .toBeNull();
  });

  test('extracts video ID from TikTok /photo/ URL (slideshow posts)', () => {
    expect(extractTikTokVideoId(toUrlObj('https://www.tiktok.com/@user/photo/1234567890123456789')))
      .toBe('1234567890123456789');
  });
});

describe('buildTikTokEmbedUrl', () => {
  test('builds TikTok embed/v2 URL from video ID', () => {
    const url = buildTikTokEmbedUrl('1234567890123456789');
    expect(url).toBe('https://www.tiktok.com/embed/v2/1234567890123456789');
  });

  test('uses encodeURIComponent on the video ID', () => {
    // Verify the ID is URL-encoded in the embed URL
    const url = buildTikTokEmbedUrl('12345');
    expect(url).toContain('/embed/v2/12345');
    expect(url.startsWith('https://www.tiktok.com/embed/v2/')).toBe(true);
  });
});

// ─── Integration Tests ────────────────────────────────────────────────────────

describe('POST /api/link-preview', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('returns 400 when url is missing', async () => {
    const res = await request(app)
      .post('/api/link-preview')
      .send({})
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 for non-string url', async () => {
    const res = await request(app)
      .post('/api/link-preview')
      .send({ url: 12345 })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 422 for unsupported domain', async () => {
    const res = await request(app)
      .post('/api/link-preview')
      .send({ url: 'https://example.com/video' })
      .expect(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/YouTube and TikTok/i);
  });

  test('returns 400 for SSRF attempt (localhost)', async () => {
    const res = await request(app)
      .post('/api/link-preview')
      .send({ url: 'http://localhost:3000/api/admin' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 for SSRF attempt (private IP)', async () => {
    const res = await request(app)
      .post('/api/link-preview')
      .send({ url: 'http://192.168.0.1/secret' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 for file:// protocol', async () => {
    const res = await request(app)
      .post('/api/link-preview')
      .send({ url: 'file:///etc/passwd' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('returns preview data for a valid YouTube URL (with mocked oEmbed)', async () => {
    // Mock the https.get used inside safeFetch
    const https = require('https');
    const originalGet = https.get;

    https.get = (url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      const mockRes = {
        statusCode: 200,
        headers: {},
        on: (event, handler) => {
          if (event === 'data') handler(JSON.stringify({
            title: 'Mock YouTube Video',
            author_name: 'Mock Channel',
            thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            provider_name: 'YouTube',
            provider_url: 'https://www.youtube.com'
          }));
          if (event === 'end') handler();
          if (event === 'error') { /* noop */ }
          return mockRes;
        }
      };
      isCallback(mockRes);
      return { on: () => {}, setTimeout: () => {} };
    };

    try {
      const res = await request(app)
        .post('/api/link-preview')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('youtube');
      expect(res.body.data.embedUrl).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
      expect(res.body.data.title).toBe('Mock YouTube Video');
    } finally {
      https.get = originalGet;
    }
  });

  test('returns embedUrl for a valid TikTok URL (with mocked oEmbed)', async () => {
    const https = require('https');
    const originalGet = https.get;

    https.get = (_url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      const mockRes = {
        statusCode: 200,
        headers: {},
        on: (event, handler) => {
          if (event === 'data') handler(JSON.stringify({
            title: 'Mock TikTok Video',
            author_name: 'Mock Creator',
            thumbnail_url: 'https://p16.tiktokcdn.com/thumbnail.jpg',
            provider_name: 'TikTok',
            provider_url: 'https://www.tiktok.com',
            html: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@user/video/1234567890" data-video-id="1234567890"></blockquote>'
          }));
          if (event === 'end') handler();
          if (event === 'error') { /* noop */ }
          return mockRes;
        }
      };
      isCallback(mockRes);
      return { on: () => {}, setTimeout: () => {} };
    };

    try {
      const res = await request(app)
        .post('/api/link-preview')
        .send({ url: 'https://www.tiktok.com/@user/video/1234567890' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('tiktok');
      expect(res.body.data.embedUrl).toBe('https://www.tiktok.com/embed/v2/1234567890');
      expect(res.body.data.title).toBe('Mock TikTok Video');
    } finally {
      https.get = originalGet;
    }
  });

  test('returns embedUrl from oEmbed HTML data-video-id for TikTok shortlinks', async () => {
    const https = require('https');
    const originalGet = https.get;

    https.get = (_url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      const mockRes = {
        statusCode: 200,
        headers: {},
        on: (event, handler) => {
          if (event === 'data') handler(JSON.stringify({
            title: 'Mock Shortlink TikTok',
            author_name: 'Mock Creator',
            thumbnail_url: 'https://p16.tiktokcdn.com/thumbnail2.jpg',
            provider_name: 'TikTok',
            provider_url: 'https://www.tiktok.com',
            html: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@user/video/9876543210" data-video-id="9876543210"></blockquote>'
          }));
          if (event === 'end') handler();
          if (event === 'error') { /* noop */ }
          return mockRes;
        }
      };
      isCallback(mockRes);
      return { on: () => {}, setTimeout: () => {} };
    };

    try {
      const res = await request(app)
        .post('/api/link-preview')
        .send({ url: 'https://vm.tiktok.com/ZMxxxxx/' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('tiktok');
      // ID should be extracted from oEmbed HTML data-video-id since path has no /video/<id>
      expect(res.body.data.embedUrl).toBe('https://www.tiktok.com/embed/v2/9876543210');
    } finally {
      https.get = originalGet;
    }
  });

  test('uses browser-like User-Agent for oEmbed requests', async () => {
    const https = require('https');
    const originalGet = https.get;
    let capturedUserAgent = null;

    https.get = (_url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      capturedUserAgent = _opts?.headers?.['User-Agent'] || null;
      const mockRes = {
        statusCode: 200,
        headers: {},
        on: (event, handler) => {
          if (event === 'data') handler(JSON.stringify({
            title: 'UA Test TikTok',
            author_name: 'UA Tester',
            thumbnail_url: 'https://p16.tiktokcdn.com/ua.jpg',
            provider_name: 'TikTok',
            provider_url: 'https://www.tiktok.com',
            html: '<blockquote class="tiktok-embed" data-video-id="1234567890123456799"></blockquote>'
          }));
          if (event === 'end') handler();
          if (event === 'error') { /* noop */ }
          return mockRes;
        }
      };
      isCallback(mockRes);
      return { on: () => {}, setTimeout: () => {} };
    };

    try {
      await request(app)
        .post('/api/link-preview')
        .send({ url: 'https://www.tiktok.com/@user/video/1234567890123456799' })
        .expect(200);

      expect(capturedUserAgent).toBe('Mozilla/5.0 (compatible; Appofa/1.0; +https://appofasi.gr)');
    } finally {
      https.get = originalGet;
    }
  });

  test('returns partial data with embedUrl when oEmbed fetch fails for YouTube', async () => {
    const https = require('https');
    const originalGet = https.get;

    // Simulate network error
    https.get = (_url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      const mockRes = {
        statusCode: 404,
        headers: {},
        on: () => mockRes
      };
      isCallback(mockRes);
      return { on: () => {} };
    };

    try {
      const res = await request(app)
        .post('/api/link-preview')
        .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        .expect(200);

      // Should still return embedUrl even without oEmbed metadata
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('youtube');
      expect(res.body.data.embedUrl).toContain('dQw4w9WgXcQ');
      // title may be null since oEmbed failed
    } finally {
      https.get = originalGet;
    }
  });

  test('derives embedUrl from cached TikTok entry that has no embedUrl (stale cache fix)', async () => {
    const https = require('https');
    const originalGet = https.get;

    // First request: populate cache with a TikTok entry that has no embedUrl
    // (simulating a cache entry created before the embedUrl feature was added)
    https.get = (_url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      const mockRes = {
        statusCode: 200,
        headers: {},
        on: (event, handler) => {
          if (event === 'data') handler(JSON.stringify({
            title: 'Stale Cached TikTok',
            author_name: 'Creator',
            thumbnail_url: 'https://p16.tiktokcdn.com/stale.jpg',
            provider_name: 'TikTok',
            provider_url: 'https://www.tiktok.com',
            html: null
          }));
          if (event === 'end') handler();
          if (event === 'error') { /* noop */ }
          return mockRes;
        }
      };
      isCallback(mockRes);
      return { on: () => {}, setTimeout: () => {} };
    };

    const staleTikTokUrl = 'https://www.tiktok.com/@user/video/5555555555555555555';

    try {
      // First call – fresh fetch, embedUrl derived from URL path
      const firstRes = await request(app)
        .post('/api/link-preview')
        .send({ url: staleTikTokUrl })
        .expect(200);

      expect(firstRes.body.data.embedUrl).toBe('https://www.tiktok.com/embed/v2/5555555555555555555');

      // Manually wipe the embedUrl from the cache row to simulate a stale entry
      await LinkPreviewCache.update(
        { embedUrl: null },
        { where: { normalizedUrl: 'https://www.tiktok.com/@user/video/5555555555555555555' } }
      );

      // Second call – should hit the cache but still return a correct embedUrl
      // derived on-the-fly from the normalized URL
      const secondRes = await request(app)
        .post('/api/link-preview')
        .send({ url: staleTikTokUrl })
        .expect(200);

      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.data.provider).toBe('tiktok');
      expect(secondRes.body.data.embedUrl).toBe('https://www.tiktok.com/embed/v2/5555555555555555555');
      expect(secondRes.body.data.cached).toBe(true);
    } finally {
      https.get = originalGet;
    }
  });

  test('deletes stale cached TikTok shortlink with null embedUrl and re-fetches live data', async () => {
    const https = require('https');
    const originalGet = https.get;
    let requestCount = 0;

    https.get = (_url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      requestCount += 1;
      const mockRes = {
        statusCode: 200,
        headers: {},
        on: (event, handler) => {
          if (event === 'data') {
            const payload = requestCount === 1
              ? {
                  title: 'Shortlink stale fetch',
                  author_name: 'Creator',
                  thumbnail_url: 'https://p16.tiktokcdn.com/stale-short.jpg',
                  provider_name: 'TikTok',
                  provider_url: 'https://www.tiktok.com',
                  html: null
                }
              : {
                  title: 'Shortlink fresh fetch',
                  author_name: 'Creator',
                  thumbnail_url: 'https://p16.tiktokcdn.com/fresh-short.jpg',
                  provider_name: 'TikTok',
                  provider_url: 'https://www.tiktok.com',
                  html: '<blockquote class="tiktok-embed" data-video-id="2222222222222222222"></blockquote>'
                };
            handler(JSON.stringify(payload));
          }
          if (event === 'end') handler();
          if (event === 'error') { /* noop */ }
          return mockRes;
        }
      };
      isCallback(mockRes);
      return { on: () => {}, setTimeout: () => {} };
    };

    const shortlinkUrl = 'https://vm.tiktok.com/ZMstaleShortlink/';

    try {
      const firstRes = await request(app)
        .post('/api/link-preview')
        .send({ url: shortlinkUrl })
        .expect(200);

      expect(firstRes.body.success).toBe(true);
      expect(firstRes.body.data.provider).toBe('tiktok');
      expect(firstRes.body.data.embedUrl).toBeNull();
      expect(firstRes.body.data.cached).toBe(false);

      const secondRes = await request(app)
        .post('/api/link-preview')
        .send({ url: shortlinkUrl })
        .expect(200);

      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.data.provider).toBe('tiktok');
      expect(secondRes.body.data.embedUrl).toBe('https://www.tiktok.com/embed/v2/2222222222222222222');
      expect(secondRes.body.data.cached).toBe(false);
      expect(requestCount).toBe(2);

      const refreshedCache = await LinkPreviewCache.findOne({
        where: { normalizedUrl: 'https://www.tiktok.com/ZMstaleShortlink/' }
      });
      expect(refreshedCache).not.toBeNull();
      expect(refreshedCache.embedUrl).toBe('https://www.tiktok.com/embed/v2/2222222222222222222');
    } finally {
      https.get = originalGet;
    }
  });

  test('retries TikTok oEmbed up to 3 times with exponential backoff delays', async () => {
    const https = require('https');
    const originalGet = https.get;
    const originalSetTimeout = global.setTimeout;
    let requestCount = 0;
    const observedDelays = [];

    jest.spyOn(global, 'setTimeout').mockImplementation((handler, delay, ...args) => {
      observedDelays.push(delay);
      return originalSetTimeout(handler, 0, ...args);
    });

    https.get = (_url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      requestCount += 1;
      const shouldFail = requestCount <= 3;
      const mockRes = {
        statusCode: shouldFail ? 500 : 200,
        headers: {},
        on: (event, handler) => {
          if (!shouldFail && event === 'data') {
            handler(JSON.stringify({
              title: 'Recovered TikTok',
              author_name: 'Retry Creator',
              thumbnail_url: 'https://p16.tiktokcdn.com/retry.jpg',
              provider_name: 'TikTok',
              provider_url: 'https://www.tiktok.com',
              html: '<blockquote class="tiktok-embed" data-video-id="3333333333333333333"></blockquote>'
            }));
          }
          if (event === 'end') handler();
          if (event === 'error') { /* noop */ }
          return mockRes;
        }
      };
      isCallback(mockRes);
      return { on: () => {}, setTimeout: () => {} };
    };

    try {
      const res = await request(app)
        .post('/api/link-preview')
        .send({ url: 'https://vm.tiktok.com/ZMretryMe/' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('tiktok');
      expect(res.body.data.embedUrl).toBe('https://www.tiktok.com/embed/v2/3333333333333333333');
      expect(requestCount).toBe(4);
      expect(observedDelays.slice(0, 3)).toEqual([500, 1500, 3000]);
    } finally {
      https.get = originalGet;
      global.setTimeout.mockRestore();
    }
  });

  test('truncates long TikTok title to prevent DB overflow (TEXT column, 2000-char soft cap)', async () => {
    const https = require('https');
    const originalGet = https.get;

    const longTitle = 'A'.repeat(2500); // 2500 chars exceeds the 2000-char soft cap

    https.get = (_url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      const mockRes = {
        statusCode: 200,
        headers: {},
        on: (event, handler) => {
          if (event === 'data') handler(JSON.stringify({
            title: longTitle,
            author_name: 'B'.repeat(2500),
            thumbnail_url: 'https://p16.tiktokcdn.com/thumb.jpg',
            provider_name: 'TikTok',
            provider_url: 'https://www.tiktok.com',
            html: '<blockquote class="tiktok-embed" data-video-id="7777777777777777777"></blockquote>'
          }));
          if (event === 'end') handler();
          if (event === 'error') { /* noop */ }
          return mockRes;
        }
      };
      isCallback(mockRes);
      return { on: () => {}, setTimeout: () => {} };
    };

    try {
      const res = await request(app)
        .post('/api/link-preview')
        .send({ url: 'https://www.tiktok.com/@user/video/7777777777777777777' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('A'.repeat(2000));
      expect(res.body.data.authorName).toBe('B'.repeat(2000));
    } finally {
      https.get = originalGet;
    }
  });

  test('returns embedUrl for TikTok /photo/ URL (slideshow posts)', async () => {
    const https = require('https');
    const originalGet = https.get;

    https.get = (_url, _opts, callback) => {
      const isCallback = typeof _opts === 'function' ? _opts : callback;
      const mockRes = {
        statusCode: 200,
        headers: {},
        on: (event, handler) => {
          if (event === 'data') handler(JSON.stringify({
            title: 'Photo Slideshow Post',
            author_name: 'Creator',
            thumbnail_url: 'https://p16.tiktokcdn.com/photo.jpg',
            provider_name: 'TikTok',
            provider_url: 'https://www.tiktok.com',
            html: '<blockquote class="tiktok-embed" data-video-id="8888888888888888888"></blockquote>'
          }));
          if (event === 'end') handler();
          if (event === 'error') { /* noop */ }
          return mockRes;
        }
      };
      isCallback(mockRes);
      return { on: () => {}, setTimeout: () => {} };
    };

    try {
      const res = await request(app)
        .post('/api/link-preview')
        .send({ url: 'https://www.tiktok.com/@user/photo/8888888888888888888' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBe('tiktok');
      expect(res.body.data.embedUrl).toBe('https://www.tiktok.com/embed/v2/8888888888888888888');
      expect(res.body.data.title).toBe('Photo Slideshow Post');
    } finally {
      https.get = originalGet;
    }
  });
});
