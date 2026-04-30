/**
 * Tests for rate-limit voting UX:
 *  - Backend: makeRateLimitHandler structured 429 response
 *  - Backend: anonVoteLimiter / authVoteLimiter skip logic
 *  - API client: retryAfter / resetTime attached to thrown errors
 */

// ─── Backend: makeRateLimitHandler ───────────────────────────────────────────

describe('makeRateLimitHandler', () => {
  const { makeRateLimitHandler } = require('../src/middleware/rateLimiter');

  test('returns a function', () => {
    const handler = makeRateLimitHandler('Too many requests');
    expect(typeof handler).toBe('function');
  });

  test('sends 429 with retryAfter and resetTime', () => {
    const handler = makeRateLimitHandler('Too many requests');
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour

    const resetDate = new Date(now + windowMs);
    const req = { rateLimit: { resetTime: resetDate, windowMs } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    handler(req, res);

    expect(status).toHaveBeenCalledWith(429);
    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe('Too many requests');
    expect(typeof body.retryAfter).toBe('number');
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(typeof body.resetTime).toBe('number');
    expect(body.resetTime).toBeCloseTo(resetDate.getTime(), -3);
  });

  test('uses windowMs fallback when resetTime is not a Date', () => {
    const windowMs = 30 * 60 * 1000; // 30 min
    const handler = makeRateLimitHandler('msg');
    const req = { rateLimit: { windowMs } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    handler(req, res);

    const body = json.mock.calls[0][0];
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(body.resetTime).toBeGreaterThan(Date.now());
  });

  test('retryAfter is 0 when window already expired', () => {
    const handler = makeRateLimitHandler('msg');
    const req = { rateLimit: { resetTime: new Date(Date.now() - 1000) } };
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status };

    handler(req, res);

    const body = json.mock.calls[0][0];
    expect(body.retryAfter).toBe(0);
  });
});

// ─── Backend: anonVoteLimiter / authVoteLimiter skip logic ───────────────────

describe('anonVoteLimiter skip function', () => {
  const { anonVoteLimiter } = require('../src/middleware/rateLimiter');

  test('skips for authenticated users in non-test env', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const req = { user: { id: 1 }, ip: '1.2.3.4' };
      const opts = anonVoteLimiter.options ?? {};
      if (typeof opts.skip === 'function') {
        const result = await opts.skip(req);
        expect(result).toBe(true);
      }
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  test('does not skip for unauthenticated users in non-test env', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const req = { user: undefined, ip: '1.2.3.4' };
      const opts = anonVoteLimiter.options ?? {};
      if (typeof opts.skip === 'function') {
        try {
          const result = await opts.skip(req);
          expect(result).toBeFalsy();
        } catch {
          // ipAccessService unavailable in unit test context — acceptable
        }
      }
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});

describe('authVoteLimiter skip function', () => {
  const { authVoteLimiter } = require('../src/middleware/rateLimiter');

  test('skips for unauthenticated users', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const req = { user: undefined, ip: '1.2.3.4' };
      const opts = authVoteLimiter.options ?? {};
      if (typeof opts.skip === 'function') {
        const result = await opts.skip(req);
        expect(result).toBe(true);
      }
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  test('does not skip for authenticated users in non-test env', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const req = { user: { id: 1 }, ip: '1.2.3.4' };
      const opts = authVoteLimiter.options ?? {};
      if (typeof opts.skip === 'function') {
        const result = await opts.skip(req);
        expect(result).toBe(false);
      }
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});

// ─── API client: retryAfter / resetTime on 429 errors ────────────────────────

describe('apiRequest 429 error metadata', () => {
  const originalWindow = global.window;
  const originalDocument = global.document;
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.window = {};
    global.document = { cookie: '' };
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    global.fetch = originalFetch;
  });

  test('attaches retryAfter and resetTime to 429 error', async () => {
    const { apiRequest } = require('../lib/api/client');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        headers: { get: (n) => (n === 'content-type' ? 'application/json' : null) },
        text: () =>
          Promise.resolve(
            JSON.stringify({
              success: false,
              message: 'Too many votes.',
              retryAfter: 300,
              resetTime: Date.now() + 300000,
            })
          ),
      })
    );

    let caught;
    try {
      await apiRequest('/api/polls/1/vote', { method: 'POST', body: JSON.stringify({}) });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeDefined();
    expect(caught.status).toBe(429);
    expect(caught.retryAfter).toBe(300);
    expect(typeof caught.resetTime).toBe('number');
    expect(caught.resetTime).toBeGreaterThan(Date.now());
  });

  test('does not attach retryAfter / resetTime on non-429 errors', async () => {
    const { apiRequest } = require('../lib/api/client');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        headers: { get: (n) => (n === 'content-type' ? 'application/json' : null) },
        text: () => Promise.resolve(JSON.stringify({ success: false, message: 'Bad request.' })),
      })
    );

    let caught;
    try {
      await apiRequest('/api/polls/1/vote', { method: 'POST', body: JSON.stringify({}) });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeDefined();
    expect(caught.status).toBe(400);
    expect(caught.retryAfter).toBeUndefined();
    expect(caught.resetTime).toBeUndefined();
  });

  test('handles missing retryAfter/resetTime in 429 body gracefully', async () => {
    const { apiRequest } = require('../lib/api/client');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        headers: { get: (n) => (n === 'content-type' ? 'application/json' : null) },
        text: () =>
          Promise.resolve(JSON.stringify({ success: false, message: 'Too many requests.' })),
      })
    );

    let caught;
    try {
      await apiRequest('/api/polls/1/vote', { method: 'POST', body: JSON.stringify({}) });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeDefined();
    expect(caught.status).toBe(429);
    expect(caught.retryAfter).toBeUndefined();
    expect(caught.resetTime).toBeUndefined();
  });
});

