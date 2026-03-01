/**
 * Converts a string into a URL-friendly slug.
 * Preserves Unicode letters (including Greek) for readable, SEO-friendly URLs.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // keep letters (any script), digits, spaces, hyphens
    .replace(/\s+/g, '-')              // spaces → hyphens
    .replace(/-+/g, '-')               // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');          // trim leading/trailing hyphens
}

/**
 * Builds a readable URL segment for an article/poll: `{id}-{slug}`.
 * Parsing back the numeric id is done with parseInt(param, 10).
 * @param {number|string} id
 * @param {string} title
 * @returns {string}
 */
export function idSlug(id, title) {
  const slug = slugify(title);
  return slug ? `${id}-${slug}` : `${id}`;
}
