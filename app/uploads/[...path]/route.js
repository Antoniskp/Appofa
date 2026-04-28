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

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      return new Response(null, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return new Response(null, { status: 504 });
    }
    return new Response(null, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
};

export { handler as GET };
