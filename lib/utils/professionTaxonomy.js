/**
 * Frontend profession taxonomy helpers (ESM).
 *
 * Mirrors src/utils/professionTaxonomy.js for client-side use.
 *
 * Provides:
 * - DOMAINS — all domains from the taxonomy
 * - getDomain(domainId) — get a domain by ID
 * - getProfession(domainId, professionId) — get a profession by IDs
 * - getSpecializations(domainId, professionId) — list specializations
 * - getSubspecializations(domainId, professionId, specializationId) — list subspecializations
 * - resolveProfessionLabel(entry) — human-readable label for a canonical entry
 * - normalizeProfessions(arr) — filter array to canonical entries only
 * - EXPERTISE_TAGS — all expertise tags
 * - VALID_EXPERTISE_TAG_IDS — Set of valid tag IDs
 * - getExpertiseTagLabel(id) — resolve label for a tag ID
 * - normalizeExpertiseTagId(value) — return valid tag ID or null
 * - normalizeExpertiseTags(arr) — filter array to valid tag IDs only
 * - scoreSpecialistMatch(profile, query) — score a profile against a taxonomy query
 */

import professionsData from '@/src/data/professions.json';
import expertiseTagsData from '@/src/data/expertiseTags.json';

// ─── Index structures ─────────────────────────────────────────────────────────

export const DOMAINS = professionsData.domains;

const DOMAIN_MAP = new Map(DOMAINS.map((d) => [d.id, d]));

const PROFESSION_MAP = new Map();
for (const domain of DOMAINS) {
  for (const profession of domain.professions) {
    PROFESSION_MAP.set(`${domain.id}/${profession.id}`, profession);
  }
}

const SPECIALIZATION_MAP = new Map();
for (const domain of DOMAINS) {
  for (const profession of domain.professions) {
    for (const spec of (profession.specializations || [])) {
      SPECIALIZATION_MAP.set(`${domain.id}/${profession.id}/${spec.id}`, spec);
    }
  }
}

export const EXPERTISE_TAGS = expertiseTagsData.expertiseTags;
export const VALID_EXPERTISE_TAG_IDS = new Set(EXPERTISE_TAGS.map((t) => t.id));

const EXPERTISE_TAG_LABEL_MAP = new Map(EXPERTISE_TAGS.map((t) => [t.id, t.label]));

/**
 * Expertise tags grouped by their primary domain.
 * Each entry: { domain: Object, tags: Array }
 * Tags are assigned to their first listed domainId; multi-domain tags appear once only.
 */
export const EXPERTISE_TAG_GROUPS = (() => {
  const groupMap = new Map(DOMAINS.map((d) => [d.id, { domain: d, tags: [] }]));
  for (const tag of EXPERTISE_TAGS) {
    const primaryDomainId = tag.domainIds?.[0];
    if (primaryDomainId && groupMap.has(primaryDomainId)) {
      groupMap.get(primaryDomainId).tags.push(tag);
    }
  }
  return DOMAINS.map((d) => groupMap.get(d.id)).filter((group) => group?.tags.length > 0);
})();

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getDomain(domainId) {
  return DOMAIN_MAP.get(domainId) || null;
}

export function getProfession(domainId, professionId) {
  return PROFESSION_MAP.get(`${domainId}/${professionId}`) || null;
}

export function getSpecializations(domainId, professionId) {
  const profession = getProfession(domainId, professionId);
  return profession ? (profession.specializations || []) : [];
}

export function getSubspecializations(domainId, professionId, specializationId) {
  const spec = SPECIALIZATION_MAP.get(`${domainId}/${professionId}/${specializationId}`);
  return spec ? (spec.subspecializations || []) : [];
}

export function getExpertiseTagLabel(id) {
  return EXPERTISE_TAG_LABEL_MAP.get(id) || id;
}

// ─── Label resolution ─────────────────────────────────────────────────────────

/**
 * Resolves a human-readable label for a canonical profession entry.
 *
 * @param {Object} entry - {domainId, professionId, specializationId?, subspecializationId?}
 * @returns {string}
 */
export function resolveProfessionLabel(entry) {
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

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Filters an array of profession entries to only canonical entries (those with domainId).
 * Non-canonical data is silently dropped.
 *
 * @param {Array} arr
 * @returns {Array}
 */
export function normalizeProfessions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((entry) => entry && typeof entry === 'object' && entry.domainId && entry.professionId);
}

/**
 * Returns a valid expertise tag ID, or null if the value is not recognised.
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeExpertiseTagId(value) {
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
export function normalizeExpertiseTags(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeExpertiseTagId).filter(Boolean);
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
export function scoreSpecialistMatch(profile, query) {
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
