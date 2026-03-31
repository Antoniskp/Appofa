/**
 * Normalize Greek text for accent/case-insensitive search.
 * Strips tonos/diacritics and maps visually identical Latin characters
 * to their Greek equivalents so that queries like "Kwstas" find "Κώστας".
 */

// Uppercase Latin characters that are visually identical to Greek letters
const LATIN_TO_GREEK = {
  A: 'Α', B: 'Β', E: 'Ε', Z: 'Ζ', H: 'Η', I: 'Ι',
  K: 'Κ', M: 'Μ', N: 'Ν', O: 'Ο', P: 'Ρ', T: 'Τ',
  X: 'Χ', Y: 'Υ',
};

/**
 * Strip diacritics and Greek tonos from a string using NFD decomposition.
 * @param {string} str
 * @returns {string}
 */
function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Map visually identical Latin characters to their Greek equivalents,
 * preserving the original case of other characters.
 * @param {string} str
 * @returns {string}
 */
function mapLatinToGreek(str) {
  return str.replace(/[A-Za-z]/g, (ch) => {
    const greek = LATIN_TO_GREEK[ch.toUpperCase()];
    if (!greek) return ch;
    return ch === ch.toUpperCase() ? greek : greek.toLowerCase();
  });
}

/**
 * Full normalization: strip accents/tonos then map Latin lookalikes to Greek.
 * @param {string} str
 * @returns {string}
 */
function normalizeGreek(str) {
  if (!str || typeof str !== 'string') return str;
  return mapLatinToGreek(stripAccents(str));
}

/**
 * Escape SQL LIKE wildcard characters in a string.
 * @param {string} str
 * @returns {string}
 */
function sanitizeForLike(str) {
  return str.replace(/[%_\\]/g, '\\$&');
}

module.exports = { normalizeGreek, stripAccents, mapLatinToGreek, sanitizeForLike };
