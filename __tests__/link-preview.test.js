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
      'https://m.tiktok.com/@user/video/1234567890'
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
});
