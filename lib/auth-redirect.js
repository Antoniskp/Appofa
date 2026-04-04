/**
 * Utilities for the redirect-and-return login flow.
 *
 * Usage:
 *   - Call saveReturnTo() (or saveReturnTo(pathname)) before navigating to /login.
 *   - Call getAndClearReturnTo() after a successful login to get the destination.
 */

/**
 * Save the current page path to localStorage so the user can be returned there
 * after a successful login.
 * @param {string} [path] - Explicit path to save. Defaults to window.location.pathname.
 */
export function saveReturnTo(path) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('returnTo', path || window.location.pathname);
  }
}

/**
 * Read the saved return-to path, remove it from localStorage, and return it.
 * @returns {string} The saved path, or '/' if none was stored.
 */
export function getAndClearReturnTo() {
  if (typeof window === 'undefined') return '/';
  const returnTo = localStorage.getItem('returnTo') || '/';
  localStorage.removeItem('returnTo');
  return returnTo;
}
