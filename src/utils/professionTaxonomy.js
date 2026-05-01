'use strict';

/**
 * Profession taxonomy helpers.
 *
 * Provides:
 * - validateProfessionalIdentity — validates a single professional identity against the taxonomy
 * - normalizeProfessions — filters an array to only canonical entries (those with domainId)
 * - VALID_EXPERTISE_TAG_IDS — Set of all valid expertise tag IDs
 * - normalizeExpertiseTagId — returns a valid tag ID or null for unknowns
 * - normalizeExpertiseTags — filters an array to only valid tag IDs
 * - resolveProfessionLabel — resolves the display label for a canonical profession entry
 * - scoreSpecialistMatch — scores a user profile against a taxonomy query
 */

const professionsData = require('../data/professions.json');
const expertiseTagsData = require('../data/expertiseTags.json');

// ─── Index structures ─────────────────────────────────────────────────────────

const DOMAIN_MAP = new Map(professionsData.domains.map((d) => [d.id, d]));

/**
 * Flatten all professions keyed by (domainId + '/' + professionId) for fast lookup.
 * @type {Map<string, Object>}
 */
const PROFESSION_MAP = new Map();
for (const domain of professionsData.domains) {
  for (const profession of domain.professions) {
    PROFESSION_MAP.set(`${domain.id}/${profession.id}`, profession);
  }
}

/**
 * Flat map of all specializations keyed by (domainId + '/' + professionId + '/' + specializationId).
 * @type {Map<string, Object>}
 */
const SPECIALIZATION_MAP = new Map();
for (const domain of professionsData.domains) {
  for (const profession of domain.professions) {
    for (const spec of (profession.specializations || [])) {
      SPECIALIZATION_MAP.set(`${domain.id}/${profession.id}/${spec.id}`, spec);
    }
  }
}

/**
 * Set of all valid expertise tag IDs.
 */
const VALID_EXPERTISE_TAG_IDS = new Set(expertiseTagsData.expertiseTags.map((t) => t.id));

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalizes an array of profession entries.
 * Entries without a domainId (i.e. non-canonical data) are filtered out.
 *
 * @param {Array} arr
 * @returns {Array}
 */
function normalizeProfessions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((entry) => entry && typeof entry === 'object' && entry.domainId && entry.professionId);
}

/**
 * Returns a valid expertise tag ID, or null if the value is not recognised.
 *
 * @param {string} value
 * @returns {string|null}
 */
function normalizeExpertiseTagId(value) {
  if (typeof value !== 'string') return null;
  if (VALID_EXPERTISE_TAG_IDS.has(value)) return value;
  return null;
}

/**
 * Filters an array of expertise tag values to only valid canonical tag IDs.
 * Unrecognised values are dropped.
 *
 * @param {Array} arr
 * @returns {string[]}
 */
function normalizeExpertiseTags(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeExpertiseTagId).filter(Boolean);
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a single professional identity entry against the canonical taxonomy.
 * Throws if invalid.
 *
 * @param {Object} entry - Canonical format: {domainId, professionId, specializationId?, subspecializationId?}
 * @returns {Object} The validated (and trimmed) entry.
 * @throws {Error} With .status = 400 if validation fails.
 */
function validateProfessionalIdentity(entry) {
  if (!entry || typeof entry !== 'object') {
    const err = new Error('Each profession entry must be an object.');
    err.status = 400;
    throw err;
  }

  const { domainId, professionId, specializationId, subspecializationId } = entry;

  if (!domainId || typeof domainId !== 'string') {
    const err = new Error('Each profession entry must have a domainId.');
    err.status = 400;
    throw err;
  }
  if (!professionId || typeof professionId !== 'string') {
    const err = new Error('Each profession entry must have a professionId.');
    err.status = 400;
    throw err;
  }

  if (!DOMAIN_MAP.has(domainId)) {
    const err = new Error(`Unknown domain: "${domainId}".`);
    err.status = 400;
    throw err;
  }

  const profKey = `${domainId}/${professionId}`;
  if (!PROFESSION_MAP.has(profKey)) {
    const err = new Error(`Unknown profession "${professionId}" in domain "${domainId}".`);
    err.status = 400;
    throw err;
  }

  const result = { domainId, professionId };

  if (specializationId !== undefined && specializationId !== null) {
    if (typeof specializationId !== 'string') {
      const err = new Error('specializationId must be a string.');
      err.status = 400;
      throw err;
    }
    const specKey = `${domainId}/${professionId}/${specializationId}`;
    if (!SPECIALIZATION_MAP.has(specKey)) {
      const err = new Error(`Unknown specialization "${specializationId}" for profession "${professionId}".`);
      err.status = 400;
      throw err;
    }
    result.specializationId = specializationId;

    if (subspecializationId !== undefined && subspecializationId !== null) {
      if (typeof subspecializationId !== 'string') {
        const err = new Error('subspecializationId must be a string.');
        err.status = 400;
        throw err;
      }
      const spec = SPECIALIZATION_MAP.get(specKey);
      const validSubspecIds = new Set((spec.subspecializations || []).map((s) => s.id));
      if (!validSubspecIds.has(subspecializationId)) {
        const err = new Error(`Unknown subspecialization "${subspecializationId}" for specialization "${specializationId}".`);
        err.status = 400;
        throw err;
      }
      result.subspecializationId = subspecializationId;
    }
  }

  return result;
}

/**
 * Validates an array of expertise tag IDs. Throws if any are invalid.
 *
 * @param {string[]} arr
 * @returns {string[]} Validated array.
 * @throws {Error} With .status = 400 if validation fails.
 */
function validateExpertiseTagIds(arr) {
  if (!Array.isArray(arr)) {
    const err = new Error('Expertise tags must be an array.');
    err.status = 400;
    throw err;
  }
  for (const id of arr) {
    if (typeof id !== 'string') {
      const err = new Error('Each expertise tag must be a string.');
      err.status = 400;
      throw err;
    }
    if (!VALID_EXPERTISE_TAG_IDS.has(id)) {
      const err = new Error(`Invalid expertise tag: "${id}".`);
      err.status = 400;
      throw err;
    }
  }
  return arr;
}

// ─── Label resolution ─────────────────────────────────────────────────────────

/**
 * Resolves the display label for a canonical profession entry.
 *
 * @param {Object} entry - Canonical format
 * @returns {string} Human-readable label like "Health / Medicine › Surgeon › Orthopedic Surgeon"
 */
function resolveProfessionLabel(entry) {
  if (!entry) return '';
  const domain = DOMAIN_MAP.get(entry.domainId);
  if (!domain) return entry.domainId || '';
  const profession = (domain.professions || []).find((p) => p.id === entry.professionId);
  if (!profession) return `${domain.label} › ${entry.professionId}`;

  let label = `${domain.label} › ${profession.label}`;
  if (entry.specializationId) {
    const spec = (profession.specializations || []).find((s) => s.id === entry.specializationId);
    if (spec) {
      label += ` › ${spec.label}`;
      if (entry.subspecializationId) {
        const subspc = (spec.subspecializations || []).find((s) => s.id === entry.subspecializationId);
        if (subspc) label += ` › ${subspc.label}`;
      }
    }
  }
  return label;
}

// ─── Specialist matching / scoring ───────────────────────────────────────────

/**
 * Scores a user profile's specialist relevance against a taxonomy query.
 * Higher score = more relevant match.
 *
 * Scoring weights (cumulative along the hierarchy):
 *   domain match:          +2
 *   + profession match:    +3
 *   + specialization:      +4
 *   + subspecialization:   +5
 *   expertise tag match:   +4 per matching tag
 *
 * @param {Object} profile - { professions: Array, expertiseArea: Array }
 * @param {Object} query   - { domainId?, professionId?, specializationId?, subspecializationId?, expertiseTags?: string[] }
 * @returns {number} relevance score (0 if no match)
 */
function scoreSpecialistMatch(profile, query) {
  if (!query || !profile) return 0;

  const professions = Array.isArray(profile.professions) ? profile.professions : [];
  const expertiseTags = Array.isArray(profile.expertiseArea) ? profile.expertiseArea : [];

  let bestProfessionScore = 0;

  for (const entry of professions) {
    if (!entry || typeof entry !== 'object') continue;
    let entryScore = 0;

    if (query.domainId && entry.domainId === query.domainId) {
      entryScore += 2;
      if (query.professionId && entry.professionId === query.professionId) {
        entryScore += 3;
        if (query.specializationId && entry.specializationId === query.specializationId) {
          entryScore += 4;
          if (query.subspecializationId && entry.subspecializationId === query.subspecializationId) {
            entryScore += 5;
          }
        }
      }
    }

    if (entryScore > bestProfessionScore) bestProfessionScore = entryScore;
  }

  let score = bestProfessionScore;

  if (Array.isArray(query.expertiseTags)) {
    for (const tag of query.expertiseTags) {
      if (expertiseTags.includes(tag)) score += 4;
    }
  }

  return score;
}

module.exports = {
  DOMAIN_MAP,
  PROFESSION_MAP,
  SPECIALIZATION_MAP,
  VALID_EXPERTISE_TAG_IDS,
  normalizeProfessions,
  normalizeExpertiseTagId,
  normalizeExpertiseTags,
  validateProfessionalIdentity,
  validateExpertiseTagIds,
  resolveProfessionLabel,
  scoreSpecialistMatch,
};
