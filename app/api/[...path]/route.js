const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);
const ALLOWED_HEADERS = new Set(['content-type', 'x-csrf-token', 'authorization', 'cookie']);

const buildHeaders = (request) => {
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (ALLOWED_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  return headers;
};

const buildResponseHeaders = (sourceHeaders) => {
  const headers = new Headers();
  sourceHeaders.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      headers.set(key, value);
    }
  });

  const setCookies = typeof sourceHeaders.getSetCookie === 'function'
    ? sourceHeaders.getSetCookie()
    : [];
  const fallbackSetCookie = sourceHeaders.get('set-cookie');
  const allSetCookies = setCookies.length
    ? setCookies
    : (fallbackSetCookie ? [fallbackSetCookie] : []);
  allSetCookies.forEach((cookie) => headers.append('set-cookie', cookie));

  return headers;
};

const proxyRequest = async (request) => {
  const targetUrl = `${API_BASE_URL}/api${request.nextUrl.pathname.replace(/^\/api/, '')}${request.nextUrl.search}`;
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: buildHeaders(request),
    body,
    redirect: 'manual'
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: buildResponseHeaders(response.headers)
  });
};

const handler = async (request) => {
  if (!ALLOWED_METHODS.has(request.method)) {
    return new Response('Method Not Allowed', { status: 405 });
  }

  return proxyRequest(request);
};

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
