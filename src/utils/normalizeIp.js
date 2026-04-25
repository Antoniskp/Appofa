const { isIP } = require('node:net');

/**
 * Normalize an IP address string to its canonical form.
 *
 * - Trims whitespace
 * - Strips IPv4-mapped IPv6 prefix (`::ffff:`) so `::ffff:1.2.3.4` → `1.2.3.4`
 * - Validates the result with `isIP`
 * - Returns the canonical string (max 45 chars) or `null` for invalid input
 *
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeIp(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/^::ffff:/i, '');
  if (!stripped || !isIP(stripped)) return null;
  return stripped.slice(0, 45);
}

module.exports = { normalizeIp };
