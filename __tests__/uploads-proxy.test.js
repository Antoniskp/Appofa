/**
 * Regression tests for app/uploads/[...path]/route.js
 *
 * These tests guard against:
 * 1. Proxy loop: using NEXT_PUBLIC_API_URL (public domain) as the fetch target
 *    would route back through nginx → Next.js → same handler → infinite loop → 500.
 * 2. Missing timeout: without a timeout the handler hangs when Express is down.
 * 3. Query-string pass-through: cache-busting ?v=<timestamp> must be forwarded.
 */

describe('Uploads proxy route — app/uploads/[...path]/route.js', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  // Reload the module fresh for every test so env changes take effect.
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  // Helper to build a minimal Next.js-style request object.
  const makeRequest = (pathname, search = '') => ({
    nextUrl: { pathname, search },
  });

  // ── 1. API_URL takes priority and is used as the proxy target ───────────────

  test('uses API_URL (not NEXT_PUBLIC_API_URL) as proxy target — prevents loop', async () => {
    process.env.API_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_API_URL = 'https://appofasi.gr'; // public URL — must NOT be used

    const fakeImageBuffer = Buffer.from('fake-webp-data');
    global.fetch = jest.fn(() =>
      Promise.resolve(new Response(fakeImageBuffer, { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=0, must-revalidate' } }))
    );

    const { GET } = require('../app/uploads/[...path]/route.js');
    await (await GET(makeRequest('/uploads/profiles/4.webp'))).arrayBuffer();

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toMatch(/^http:\/\/localhost:3000\//);
    // Must NOT use the public HTTPS domain (would loop)
    expect(calledUrl).not.toMatch(/^https:\/\/appofasi\.gr\//);
  });

  test('falls back to http://localhost:3000 when API_URL is unset', async () => {
    delete process.env.API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    global.fetch = jest.fn(() =>
      Promise.resolve(new Response(new ArrayBuffer(0), { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=0, must-revalidate' } }))
    );

    const { GET } = require('../app/uploads/[...path]/route.js');
    await (await GET(makeRequest('/uploads/profiles/1.webp'))).arrayBuffer();

    expect(global.fetch.mock.calls[0][0]).toBe('http://localhost:3000/uploads/profiles/1.webp');
  });

  // ── 2. Successful serving for profile and location images ───────────────────

  test('returns 200 with correct Content-Type for profile avatar', async () => {
    process.env.API_URL = 'http://localhost:3000';
    const fakeBuffer = new ArrayBuffer(8);

    global.fetch = jest.fn(() =>
      Promise.resolve(new Response(fakeBuffer, { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=0, must-revalidate' } }))
    );

    const { GET } = require('../app/uploads/[...path]/route.js');
    const response = await GET(makeRequest('/uploads/profiles/4.webp'));
    await response.arrayBuffer();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/webp');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
  });

  test('returns 200 for location image', async () => {
    process.env.API_URL = 'http://localhost:3000';
    const fakeBuffer = new ArrayBuffer(8);

    global.fetch = jest.fn(() =>
      Promise.resolve(new Response(fakeBuffer, { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=0, must-revalidate' } }))
    );

    const { GET } = require('../app/uploads/[...path]/route.js');
    const response = await GET(makeRequest('/uploads/locations/7.webp'));
    await response.arrayBuffer();

    expect(response.status).toBe(200);
    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toBe('http://localhost:3000/uploads/locations/7.webp');
  });

  // ── 3. Cache-busting query string is forwarded ───────────────────────────────

  test('passes ?v=<timestamp> query string through to Express', async () => {
    process.env.API_URL = 'http://localhost:3000';

    global.fetch = jest.fn(() =>
      Promise.resolve(new Response(new ArrayBuffer(0), { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=0, must-revalidate' } }))
    );

    const { GET } = require('../app/uploads/[...path]/route.js');
    await (await GET(makeRequest('/uploads/profiles/4.webp', '?v=1777377161246'))).arrayBuffer();

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toBe(
      'http://localhost:3000/uploads/profiles/4.webp?v=1777377161246'
    );
  });

  // ── 4. Error cases ───────────────────────────────────────────────────────────

  test('returns 404 when Express reports file not found', async () => {
    process.env.API_URL = 'http://localhost:3000';

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        headers: new Headers({}),
      })
    );

    const { GET } = require('../app/uploads/[...path]/route.js');
    const response = await GET(makeRequest('/uploads/profiles/999.webp'));

    expect(response.status).toBe(404);
  });

  test('returns 502 when Express is unreachable', async () => {
    process.env.API_URL = 'http://localhost:3000';

    global.fetch = jest.fn(() => {
      const err = new Error('fetch failed');
      err.cause = { code: 'ECONNREFUSED' };
      return Promise.reject(err);
    });

    const { GET } = require('../app/uploads/[...path]/route.js');
    const response = await GET(makeRequest('/uploads/profiles/4.webp'));
    await response.arrayBuffer();

    expect(response.status).toBe(502);
  });

  test('returns 504 when request times out', async () => {
    process.env.API_URL = 'http://localhost:3000';

    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    global.fetch = jest.fn(() => Promise.reject(abortError));

    const { GET } = require('../app/uploads/[...path]/route.js');
    const response = await GET(makeRequest('/uploads/profiles/4.webp'));
    await response.arrayBuffer();

    expect(response.status).toBe(504);
  });

  test('streams the first chunk before the upstream photo finishes', async () => {
    let upstream;
    const stream = new ReadableStream({ start(controller) { upstream = controller; } });
    global.fetch = jest.fn().mockResolvedValue(new Response(stream, {
      headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable' },
    }));
    const { GET } = require('../app/uploads/[...path]/route.js');
    const response = await GET(makeRequest('/uploads/media/photo.webp'));
    const reader = response.body.getReader();
    upstream.enqueue(new Uint8Array([1, 2]));
    expect(await reader.read()).toEqual({ value: new Uint8Array([1, 2]), done: false });
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    upstream.close();
    expect((await reader.read()).done).toBe(true);
  });

  test('forwards validators and returns a bodyless 304', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, {
      status: 304, headers: { etag: '"photo-v1"', 'cache-control': 'public, max-age=0, must-revalidate' },
    }));
    const { GET } = require('../app/uploads/[...path]/route.js');
    const response = await GET({ ...makeRequest('/uploads/profiles/1.webp'), headers: new Headers({ 'if-none-match': '"photo-v1"' }) });
    expect(global.fetch.mock.calls[0][1].headers.get('if-none-match')).toBe('"photo-v1"');
    expect(global.fetch.mock.calls[0][1].cache).toBe('no-store');
    expect(response.status).toBe(304);
    expect(response.body).toBeNull();
    expect(response.headers.get('etag')).toBe('"photo-v1"');
  });

  test('HEAD does not download the photo body', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { headers: { 'content-length': '1234' } }));
    const { HEAD } = require('../app/uploads/[...path]/route.js');
    const response = await HEAD({ ...makeRequest('/uploads/profiles/1.webp'), method: 'HEAD' });
    expect(global.fetch.mock.calls[0][1].method).toBe('HEAD');
    expect(response.body).toBeNull();
    expect(response.headers.get('content-length')).toBe('1234');
  });

  test('cancelling the client stream cancels the upstream fetch', async () => {
    const cancel = jest.fn();
    global.fetch = jest.fn().mockResolvedValue(new Response(new ReadableStream({ cancel })));
    const { GET } = require('../app/uploads/[...path]/route.js');
    const response = await GET(makeRequest('/uploads/profiles/1.webp'));
    await response.body.cancel();
    expect(cancel).toHaveBeenCalled();
    expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(true);
  });
});
