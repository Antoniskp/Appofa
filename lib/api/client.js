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

    // On CSRF failure, refresh the token and retry once
    if (
      !_isRetry &&
      response.status === 403 &&
      message === 'Invalid CSRF token.'
    ) {
      const refreshed = await refreshCsrfToken();
      if (refreshed) {
        return apiRequest(endpoint, options, true);
      }
    }

    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
}
