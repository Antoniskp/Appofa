/**
 * Utilities for the redirect-and-return login flow.
 *
 * Usage:
 *   - Call saveReturnTo() (or saveReturnTo(pathname)) before navigating to /login.
 *   - Call getAndClearReturnTo() after a successful login to get the destination.
 */

/**
 * Returns true only for safe relative paths (starts with '/', not '//').
 * This prevents open-redirect attacks from protocol-relative or absolute URLs.
 */
function isSafeRelativePath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

/**
 * Save the current page path to localStorage so the user can be returned there
 * after a successful login.
 * Only relative paths are accepted to prevent open-redirect attacks.
 * @param {string} [path] - Explicit path to save. Defaults to window.location.pathname.
 */
export function saveReturnTo(path) {
  if (typeof window !== 'undefined') {
    const candidate = path || window.location.pathname;
    if (isSafeRelativePath(candidate)) {
      localStorage.setItem('returnTo', candidate);
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
  const stored = localStorage.getItem('returnTo');
  localStorage.removeItem('returnTo');
  return isSafeRelativePath(stored) ? stored : '/';
}
