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
 * - normalizeLegacyProfession(entry) — converts legacy {categoryId,...} to canonical {domainId,...}
 * - normalizeProfessions(arr) — normalize array
 * - EXPERTISE_TAGS — all expertise tags
 * - VALID_EXPERTISE_TAG_IDS — Set of valid tag IDs
 * - getExpertiseTagLabel(id) — resolve label for a tag ID
 * - normalizeExpertiseTagId(value) — convert legacy label to tag ID
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

// ─── Legacy normalization (same logic as backend) ─────────────────────────────

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

const LEGACY_SUBPROF_PROFESSION_OVERRIDES = {
  'software_engineer/devops': 'devops-engineer',
};

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

/**
 * Normalizes a single profession entry from legacy v1 to canonical v2 format.
 *
 * @param {Object} entry
 * @returns {Object|null}
 */
export function normalizeLegacyProfession(entry) {
  if (!entry || typeof entry !== 'object') return null;

  // Already v2
  if (entry.domainId) {
    return {
      domainId: entry.domainId,
      professionId: entry.professionId,
      ...(entry.specializationId ? { specializationId: entry.specializationId } : {}),
      ...(entry.subspecializationId ? { subspecializationId: entry.subspecializationId } : {}),
    };
  }

  // Legacy v1
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
 *
 * @param {Array} arr
 * @returns {Array}
 */
export function normalizeProfessions(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeLegacyProfession).filter(Boolean);
}

/**
 * Normalizes a single expertise area value from legacy label to tag ID.
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeExpertiseTagId(value) {
  if (typeof value !== 'string') return null;
  if (VALID_EXPERTISE_TAG_IDS.has(value)) return value;
  const mapped = LEGACY_EXPERTISE_LABEL_TO_TAG_ID[value];
  if (mapped !== undefined) return mapped;
  return null;
}

/**
 * Normalizes an array of expertise tag values.
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
