/**
 * Utilities for the redirect-and-return login flow.
 *
 * Usage:
 *   - Call saveReturnTo() (or saveReturnTo(pathname)) before navigating to /login.
 *   - Pass ?next=/safe/path or ?redirect=/safe/path to /login or /register.
 *   - Call resolveAuthDestination(searchParams) after successful auth.
 */

/**
 * Returns true only for safe relative paths (starts with '/', not '//').
 * This prevents open-redirect attacks from protocol-relative or absolute URLs.
 */
export function isSafeRelativePath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

function isAuthPagePath(path) {
  if (!isSafeRelativePath(path)) return false;
  const pathname = path.split(/[?#]/, 1)[0];
  return pathname === '/login' || pathname === '/register';
}

export function getCurrentRelativePath() {
  if (typeof window === 'undefined') return '/';
  const { pathname, search, hash } = window.location;
  return `${pathname || '/'}${search || ''}${hash || ''}`;
}

export function buildAuthPath(authPath, destination) {
  const fallbackDestination = getCurrentRelativePath();
  const safeDestination = isSafeRelativePath(destination) ? destination : fallbackDestination;
  const next = isAuthPagePath(safeDestination) ? '/' : safeDestination;
  const separator = authPath.includes('?') ? '&' : '?';
  return `${authPath}${separator}next=${encodeURIComponent(next)}`;
}

export function getAuthDestinationFromSearchParams(searchParams) {
  const candidate = searchParams?.get?.('next') || searchParams?.get?.('redirect');
  return isSafeRelativePath(candidate) && !isAuthPagePath(candidate) ? candidate : null;
}

/**
 * Save the current page path to localStorage so the user can be returned there
 * after a successful login.
 * Only relative paths are accepted to prevent open-redirect attacks.
 * @param {string} [path] - Explicit path to save. Defaults to window.location.pathname.
 */
export function saveReturnTo(path) {
  if (typeof window !== 'undefined') {
    const candidate = path || getCurrentRelativePath();
    if (isSafeRelativePath(candidate)) {
      try {
        localStorage.setItem('returnTo', candidate);
      } catch (e) {
        // localStorage may be full or blocked (e.g. private browsing restrictions)
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[auth-redirect] saveReturnTo: could not write to localStorage', e);
        }
      }
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(`[auth-redirect] saveReturnTo: ignored unsafe path "${candidate}"`);
    }
  }
}

/**
 * Read the saved return-to path, remove it from localStorage, and return it.
 * Only returns the saved value if it is a safe relative path; otherwise returns '/'.
 * @returns {string} The saved path, or '/' if none was stored or the value is unsafe.
 */
export function getAndClearReturnTo() {
  if (typeof window === 'undefined') return '/';
  let stored = null;
  try {
    stored = localStorage.getItem('returnTo');
    localStorage.removeItem('returnTo');
  } catch (e) {
    // localStorage may be blocked; fall through and return the safe default
  }
  return isSafeRelativePath(stored) && !isAuthPagePath(stored) ? stored : '/';
}

export function peekReturnTo() {
  if (typeof window === 'undefined') return null;
  let stored = null;
  try {
    stored = localStorage.getItem('returnTo');
  } catch (e) {
    return null;
  }
  return isSafeRelativePath(stored) && !isAuthPagePath(stored) ? stored : null;
}

export function getPendingAuthDestination(searchParams) {
  return getAuthDestinationFromSearchParams(searchParams) || peekReturnTo() || null;
}

export function resolveAuthDestination(searchParams, fallback = '/') {
  return getAuthDestinationFromSearchParams(searchParams) || getAndClearReturnTo() || fallback;
}
