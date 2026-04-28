const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Proxy /uploads/* requests to the Express backend.
 * This is needed in development (separate ports) and as a fallback in production.
 * In production, nginx routes /uploads/ directly to the Express server for efficiency.
 */
const handler = async (request) => {
  const { pathname, search } = request.nextUrl;
  const targetUrl = `${API_BASE_URL}${pathname}${search}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
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
  } catch {
    return new Response(null, { status: 502 });
  }
};

export { handler as GET };
