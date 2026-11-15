// Use only the internal Express backend URL — never NEXT_PUBLIC_API_URL which can be the
// public domain and would create an infinite proxy loop: Next → nginx → Next → …
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds, same as the API proxy

/**
 * Proxy /uploads/* requests to the Express backend.
 * This is needed in development (separate ports) and as a fallback in production.
 * In production, nginx routes /uploads/ directly to the Express server for efficiency.
 *
 * IMPORTANT: API_URL must point to the *internal* Express address (e.g. http://localhost:3000).
 * Never use NEXT_PUBLIC_API_URL here — in production that is the public HTTPS domain, which
 * would route back through nginx and create an infinite loop.
 */
const handler = async (request) => {
  const { pathname, search } = request.nextUrl;
  const targetUrl = `${API_BASE_URL}${pathname}${search}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let streaming = false;

  try {
    const headers = new Headers();
    for (const name of ['if-none-match', 'if-modified-since']) {
      const value = request.headers?.get(name);
      if (value) headers.set(name, value);
    }
    const response = await fetch(targetUrl, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok && response.status !== 304) {
      await response.body?.cancel();
      return new Response(null, { status: response.status, headers: { 'Cache-Control': 'no-store' } });
    }

    const responseHeaders = new Headers();
    for (const name of ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified']) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('Cache-Control', responseHeaders.get('Cache-Control') || 'public, max-age=0, must-revalidate');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');

    if (response.status === 304 || request.method === 'HEAD' || !response.body) {
      await response.body?.cancel();
      return new Response(null, { status: response.status, headers: responseHeaders });
    }

    // Stream with backpressure instead of buffering the whole photo per visitor.
    // Keep the upstream timeout alive until the body completes or is cancelled.
    const reader = response.body.getReader();
    const body = new ReadableStream({
      async pull(streamController) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            clearTimeout(timeoutId);
            streamController.close();
          } else {
            streamController.enqueue(value);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          streamController.error(error);
        }
      },
      async cancel(reason) {
        clearTimeout(timeoutId);
        controller.abort();
        await reader.cancel(reason);
      },
    });
    streaming = true;
    return new Response(body, { status: response.status, headers: responseHeaders });
  } catch (err) {
    if (err.name === 'AbortError') {
      return new Response(null, { status: 504 });
    }
    return new Response(null, { status: 502 });
  } finally {
    if (!streaming) clearTimeout(timeoutId);
  }
};

export { handler as GET, handler as HEAD };
