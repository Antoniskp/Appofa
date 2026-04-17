/**
 * Base HTTP client configuration for API communication
 */

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }

  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

/**
 * Get cookie value for internal use.
 */
function getCookie(name) {
  if (typeof document === 'undefined') return null;

  const nameValue = `${name}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(nameValue) === 0) {
      return cookie.substring(nameValue.length, cookie.length);
    }
  }
  return null;
}

export function getCsrfToken() {
  return getCookie('csrf_token');
}

/**
 * Refresh the CSRF token by calling the dedicated endpoint.
 * Returns true on success, false on failure.
 * Also serves as a session liveness check — if the JWT is expired the
 * server will return 401 and this will return false.
 */
async function refreshCsrfToken() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Make API request
 */
export async function apiRequest(endpoint, options = {}, _isRetry = false) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.method && options.method !== 'GET' && options.method !== 'HEAD' && options.method !== 'OPTIONS') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }
  
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers?.get('content-type') || '';
  const text = await response.text();
  let data;
  if (contentType.includes('application/json') && text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  } else {
    data = text;
  }

  if (!response.ok) {
    const message = (typeof data === 'object' && data !== null && data.message)
      ? data.message
      : `Request failed (${response.status})`;

    // On CSRF failure (403) OR a missing/expired token on a mutation (401),
    // attempt to refresh the CSRF cookie and retry the request once.
    const isCsrfFailure = response.status === 403 && message === 'Invalid CSRF token.';
    const isMutation = options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method);
    const isTokenMissing =
      !_isRetry &&
      isMutation &&
      response.status === 401 &&
      (message === 'No token provided. Authentication required.' ||
        message === 'Invalid or expired token.');

    if (!_isRetry && (isCsrfFailure || isTokenMissing)) {
      const isAuthPage =
        typeof window !== 'undefined' &&
        (window.location.pathname === '/login' || window.location.pathname === '/register');

      if (!isAuthPage) {
        const refreshed = await refreshCsrfToken();
        if (refreshed) {
          // Pick up the freshly set csrf_token cookie for the retry
          const newCsrfToken = getCsrfToken();
          const retryOptions = { ...options };
          if (newCsrfToken && options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method)) {
            retryOptions.headers = { ...headers, 'x-csrf-token': newCsrfToken };
          }
          return apiRequest(endpoint, retryOptions, true);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
      }
    }

    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
}
