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

// Greek letters → Latin equivalents for slug/URL generation (longest matches first)
const GREEK_TO_LATIN_MAP = new Map([
  ['θ', 'th'], ['Θ', 'Th'],
  ['χ', 'ch'], ['Χ', 'Ch'],
  ['ψ', 'ps'], ['Ψ', 'Ps'],
  ['αυ', 'av'], ['Αυ', 'Av'], ['αύ', 'av'], ['Αύ', 'Av'],
  ['ευ', 'ev'], ['Εύ', 'Ev'], ['εύ', 'ev'], ['Ευ', 'Ev'],
  ['α', 'a'], ['ά', 'a'], ['Α', 'A'], ['Ά', 'A'],
  ['β', 'v'], ['Β', 'V'],
  ['γ', 'g'], ['Γ', 'G'],
  ['δ', 'd'], ['Δ', 'D'],
  ['ε', 'e'], ['έ', 'e'], ['Ε', 'E'], ['Έ', 'E'],
  ['ζ', 'z'], ['Ζ', 'Z'],
  ['η', 'i'], ['ή', 'i'], ['Η', 'I'], ['Ή', 'I'],
  ['ι', 'i'], ['ί', 'i'], ['ϊ', 'i'], ['ΐ', 'i'], ['Ι', 'I'], ['Ί', 'I'], ['Ϊ', 'I'],
  ['κ', 'k'], ['Κ', 'K'],
  ['λ', 'l'], ['Λ', 'L'],
  ['μ', 'm'], ['Μ', 'M'],
  ['ν', 'n'], ['Ν', 'N'],
  ['ξ', 'x'], ['Ξ', 'X'],
  ['ο', 'o'], ['ό', 'o'], ['Ο', 'O'], ['Ό', 'O'],
  ['π', 'p'], ['Π', 'P'],
  ['ρ', 'r'], ['Ρ', 'R'],
  ['σ', 's'], ['ς', 's'], ['Σ', 'S'],
  ['τ', 't'], ['Τ', 'T'],
  ['υ', 'y'], ['ύ', 'y'], ['ϋ', 'y'], ['ΰ', 'y'], ['Υ', 'Y'], ['Ύ', 'Y'], ['Ϋ', 'Y'],
  ['φ', 'f'], ['Φ', 'F'],
  ['ω', 'o'], ['ώ', 'o'], ['Ω', 'O'], ['Ώ', 'O'],
]);

// Pre-built regex: longer keys first so digraphs (αυ, ευ) match before single letters
const _sortedGreekKeys = [...GREEK_TO_LATIN_MAP.keys()].sort((a, b) => b.length - a.length);
const _escapedGreekKeys = _sortedGreekKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const GREEK_TO_LATIN_RE = new RegExp(_escapedGreekKeys.join('|'), 'g');

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
 * Transliterate Greek characters to their Latin equivalents for slug generation.
 * Latin characters are passed through unchanged.
 * @param {string} str
 * @returns {string}
 */
function transliterateGreek(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(GREEK_TO_LATIN_RE, (match) => GREEK_TO_LATIN_MAP.get(match) || match);
}

/**
 * Escape SQL LIKE wildcard characters in a string.
 * @param {string} str
 * @returns {string}
 */
function sanitizeForLike(str) {
  return str.replace(/[%_\\]/g, '\\$&');
}

module.exports = { normalizeGreek, stripAccents, mapLatinToGreek, transliterateGreek, sanitizeForLike };
