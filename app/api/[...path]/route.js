const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);
const ALLOWED_HEADERS = new Set(['content-type', 'x-csrf-token', 'authorization', 'cookie']);
const REQUEST_TIMEOUT = 30000; // 30 seconds

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

const createJsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

const proxyRequest = async (request) => {
  const targetUrl = `${API_BASE_URL}/api${request.nextUrl.pathname.replace(/^\/api/, '')}${request.nextUrl.search}`;
  
  try {
    const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    let response;
    try {
      response = await fetch(targetUrl, {
        method: request.method,
        headers: buildHeaders(request),
        body,
        redirect: 'manual',
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: buildResponseHeaders(response.headers)
    });
  } catch (error) {
    // Log error for debugging
    console.error(`[Proxy Error] Failed to proxy request to ${targetUrl}:`, error.message);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return createJsonResponse({
        success: false,
        message: 'Backend request timeout. Please try again later.'
      }, 504);
    }
    
    // Handle network errors (connection refused, DNS failures, etc.)
    if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      return createJsonResponse({
        success: false,
        message: 'Backend service is unavailable. Please try again later.'
      }, 502);
    }
    
    // Generic error fallback
    return createJsonResponse({
      success: false,
      message: 'An error occurred while processing your request.'
    }, 502);
  }
};

const handler = async (request) => {
  try {
    if (!ALLOWED_METHODS.has(request.method)) {
      return createJsonResponse({
        success: false,
        message: 'Method Not Allowed'
      }, 405);
    }

    return await proxyRequest(request);
  } catch (error) {
    console.error('[Proxy Handler Error]:', error);
    return createJsonResponse({
      success: false,
      message: 'An unexpected error occurred.'
    }, 500);
  }
};

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
