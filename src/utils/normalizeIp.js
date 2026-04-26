const { isIP } = require('node:net');

/**
 * Normalize an IP address string to its canonical form.
 *
 * - Trims whitespace
 * - Unwraps bracketed IPv6 with optional port: `[::1]:443` → `::1`
 * - Strips IPv4-mapped IPv6 prefix (`::ffff:`) so `::ffff:1.2.3.4` → `1.2.3.4`
 * - Strips IPv4 port suffix: `1.2.3.4:443` → `1.2.3.4`
 * - Validates the result with `isIP`
 * - Returns the canonical string (max 45 chars) or `null` for invalid input
 *
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeIp(value) {
  if (!value) return null;
  let candidate = String(value).trim();
  if (!candidate) return null;

  // Unwrap bracketed IPv6 with optional port: [::1]:443 → ::1
  if (candidate.startsWith('[')) {
    const closeBracket = candidate.indexOf(']');
    if (closeBracket > 0) {
      candidate = candidate.slice(1, closeBracket);
    }
  }

  // Strip IPv4-mapped IPv6 prefix: ::ffff:1.2.3.4 → 1.2.3.4
  candidate = candidate.replace(/^::ffff:/i, '');

  // Strip IPv4 port suffix: 1.2.3.4:443 → 1.2.3.4
  const ipv4WithPort = candidate.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/);
  if (ipv4WithPort) {
    candidate = ipv4WithPort[1];
  }

  if (!candidate || !isIP(candidate)) return null;
  return candidate.slice(0, 45);
}

module.exports = { normalizeIp };
