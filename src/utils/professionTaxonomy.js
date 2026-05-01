'use strict';

/**
 * Profession taxonomy helpers.
 *
 * Provides:
 * - validateProfessionalIdentity — validates a single professional identity against the taxonomy
 * - normalizeLegacyProfession — converts old {categoryId, professionId, subProfessionId} to new canonical shape
 * - normalizeProfessions — normalizes an array, filtering out invalid entries
 * - VALID_EXPERTISE_TAG_IDS — Set of all valid expertise tag IDs
 * - normalizeExpertiseTagId — converts an old string label to the new tag ID
 * - normalizeExpertiseTags — normalizes an array of expertise tags
 * - resolveProfessionLabel — resolves the display label for a canonical profession entry
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

// ─── Legacy compatibility maps ────────────────────────────────────────────────

/**
 * Maps old category IDs (v1 professions.json) to new domain IDs.
 */
const LEGACY_CATEGORY_TO_DOMAIN = {
  technology: 'technology-it',
  healthcare: 'health-medicine',
  education: 'education-academia',
  law: 'law-legal',
  business: 'business-entrepreneurship',
  creative: 'arts-culture',
  engineering: 'engineering-industry',
  public_sector: 'politics-government',
  other: 'other',
};

/**
 * Maps old profession IDs to new profession IDs (within their domain).
 * Format: 'oldCategoryId/oldProfessionId' -> 'newDomainId/newProfessionId'
 */
const LEGACY_PROFESSION_ID_MAP = {
  'technology/software_engineer': 'technology-it/software-engineer',
  'technology/data_scientist': 'technology-it/data-scientist',
  'technology/cybersecurity': 'technology-it/cybersecurity-specialist',
  'technology/ux_designer': 'technology-it/ux-designer',
  'technology/sysadmin': 'technology-it/it-administrator',
  'healthcare/doctor': 'health-medicine/doctor',
  'healthcare/nurse': 'health-medicine/nurse',
  'healthcare/pharmacist': 'health-medicine/pharmacist',
  'healthcare/psychologist': 'health-medicine/psychologist',
  'healthcare/dentist': 'health-medicine/dentist',
  'education/teacher': 'education-academia/teacher',
  'education/researcher': 'education-academia/academic-researcher',
  'education/school_counselor': 'education-academia/education-consultant',
  'law/lawyer': 'law-legal/lawyer',
  'law/judge': 'law-legal/judge',
  'law/notary': 'law-legal/notary',
  'business/accountant': 'finance-economics/accountant',
  'business/financial_analyst': 'finance-economics/financial-analyst',
  'business/entrepreneur': 'business-entrepreneurship/entrepreneur',
  'business/manager': 'business-entrepreneurship/operations-manager',
  'creative/journalist': 'media-journalism/journalist',
  'creative/graphic_designer': 'arts-culture/designer',
  'creative/photographer': 'arts-culture/photographer',
  'creative/writer': 'arts-culture/writer',
  'creative/filmmaker': 'arts-culture/filmmaker',
  'engineering/civil_engineer': 'engineering-industry/civil-engineer',
  'engineering/mechanical_engineer': 'engineering-industry/mechanical-engineer',
  'engineering/electrical_engineer': 'engineering-industry/electrical-engineer',
  'engineering/architect': 'engineering-industry/architect',
  'public_sector/civil_servant': 'politics-government/public-servant',
  'public_sector/politician': 'politics-government/politician',
  'public_sector/military': 'other/other-profession',
  'public_sector/police': 'other/other-profession',
  'other/student': 'other/student',
  'other/retired': 'other/retired',
  'other/other': 'other/other-profession',
};

/**
 * Maps legacy subProfession IDs that should override the *professionId* in v2
 * rather than becoming a specializationId. Used when the old sub-profession
 * corresponds to a separate top-level profession in the v2 taxonomy.
 * Format: 'oldProfessionId/oldSubProfessionId' -> new professionId
 */
const LEGACY_SUBPROF_PROFESSION_OVERRIDES = {
  'software_engineer/devops': 'devops-engineer',
};

/**
 * Maps old subProfession IDs to new specialization IDs (within their domain).
 * Format: 'oldProfessionId/oldSubProfessionId' -> new specializationId (or null to drop)
 */
const LEGACY_SUBPROF_ID_MAP = {
  'software_engineer/frontend': 'frontend-developer',
  'software_engineer/backend': 'backend-developer',
  'software_engineer/fullstack': 'fullstack-developer',
  'software_engineer/mobile': 'mobile-developer',
  'data_scientist/ml_engineer': 'machine-learning',
  'data_scientist/data_analyst': 'data-analyst',
  'data_scientist/data_engineer': 'data-engineer',
  'doctor/gp': 'general-practitioner',
  'doctor/surgeon': 'orthopedic-surgeon',
  'doctor/cardiologist': 'cardiologist',
  'doctor/pediatrician': 'pediatrician',
  'doctor/neurologist': 'neurologist',
  'teacher/primary': 'primary-education',
  'teacher/secondary': 'secondary-education',
  'teacher/university': null,
  'lawyer/civil_law': 'civil-lawyer',
  'lawyer/criminal_law': 'criminal-lawyer',
  'lawyer/corporate_law': 'corporate-lawyer',
  'manager/project_manager': null,
  'manager/hr_manager': null,
  'manager/operations_manager': null,
};

/**
 * Maps old string expertise area labels to new tag IDs.
 */
const LEGACY_EXPERTISE_LABEL_TO_TAG_ID = {
  'IT / Technology': 'web-development',
  Politics: 'public-policy',
  Art: 'visual-arts',
  Science: 'research-methods',
  'Sports / Athletics': 'performance-training',
  Journalism: 'investigative-reporting',
  Education: 'higher-education',
  Business: 'strategy',
  Law: 'corporate-law',
  'Health / Medicine': 'public-health-tag',
  Other: null,
};

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalizes a single professional identity entry from the legacy v1 format
 * ({categoryId, professionId, subProfessionId}) to the canonical v2 format
 * ({domainId, professionId, specializationId?, subspecializationId?}).
 *
 * If the entry is already in v2 format (has domainId), it is returned as-is.
 *
 * @param {Object} entry
 * @returns {Object|null} Canonical entry, or null if the entry is invalid.
 */
function normalizeLegacyProfession(entry) {
  if (!entry || typeof entry !== 'object') return null;

  // Already v2 canonical format
  if (entry.domainId) {
    return {
      domainId: entry.domainId,
      professionId: entry.professionId,
      ...(entry.specializationId ? { specializationId: entry.specializationId } : {}),
      ...(entry.subspecializationId ? { subspecializationId: entry.subspecializationId } : {}),
    };
  }

  // Legacy v1 format: has categoryId
  const legacyKey = `${entry.categoryId}/${entry.professionId}`;
  const mapped = LEGACY_PROFESSION_ID_MAP[legacyKey];

  let domainId, professionId;
  if (mapped) {
    [domainId, professionId] = mapped.split('/');
  } else {
    domainId = LEGACY_CATEGORY_TO_DOMAIN[entry.categoryId] || entry.categoryId;
    professionId = entry.professionId;
  }

  const result = { domainId, professionId };

  if (entry.subProfessionId) {
    const subKey = `${entry.professionId}/${entry.subProfessionId}`;

    // Check if this sub-profession should override the professionId entirely
    const profOverride = LEGACY_SUBPROF_PROFESSION_OVERRIDES[subKey];
    if (profOverride) {
      result.professionId = profOverride;
      return result;
    }

    const newSpecId = LEGACY_SUBPROF_ID_MAP[subKey];
    if (newSpecId !== undefined) {
      // null means "drop the subspecialization silently" (e.g. teacher/university)
      if (newSpecId !== null) result.specializationId = newSpecId;
    }
    // If not in either map, silently drop the sub-profession rather than producing
    // an unvalidated specializationId that would fail downstream validation.
  }

  return result;
}

/**
 * Normalizes an array of profession entries (legacy or canonical).
 * Invalid entries (null) are filtered out.
 *
 * @param {Array} arr
 * @returns {Array}
 */
function normalizeProfessions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeLegacyProfession).filter(Boolean);
}

/**
 * Normalizes a single expertise area value:
 * - If it's already a valid tag ID → return as-is
 * - If it's a legacy string label → map to tag ID
 * - Otherwise → return null (caller should filter out)
 *
 * @param {string} value
 * @returns {string|null}
 */
function normalizeExpertiseTagId(value) {
  if (typeof value !== 'string') return null;
  if (VALID_EXPERTISE_TAG_IDS.has(value)) return value;
  const mapped = LEGACY_EXPERTISE_LABEL_TO_TAG_ID[value];
  if (mapped !== undefined) return mapped; // may be null for "Other"
  return null;
}

/**
 * Normalizes an array of expertise tag values.
 * Null/unrecognized values are filtered out.
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
  LEGACY_CATEGORY_TO_DOMAIN,
  normalizeLegacyProfession,
  normalizeProfessions,
  normalizeExpertiseTagId,
  normalizeExpertiseTags,
  validateProfessionalIdentity,
  validateExpertiseTagIds,
  resolveProfessionLabel,
  scoreSpecialistMatch,
};
