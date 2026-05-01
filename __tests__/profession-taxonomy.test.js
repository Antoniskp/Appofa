'use strict';

/**
 * Tests for the profession taxonomy helpers:
 * - normalizeProfessions
 * - normalizeExpertiseTagId
 * - normalizeExpertiseTags
 * - validateProfessionalIdentity
 * - validateExpertiseTagIds
 * - resolveProfessionLabel
 */

const {
  normalizeProfessions,
  normalizeExpertiseTagId,
  normalizeExpertiseTags,
  validateProfessionalIdentity,
  validateExpertiseTagIds,
  resolveProfessionLabel,
  VALID_EXPERTISE_TAG_IDS,
} = require('../src/utils/professionTaxonomy');

// ─── normalizeProfessions ─────────────────────────────────────────────────────

describe('normalizeProfessions', () => {
  test('returns [] for non-array input', () => {
    expect(normalizeProfessions(null)).toEqual([]);
    expect(normalizeProfessions('string')).toEqual([]);
  });

  test('passes through canonical entries unchanged', () => {
    const arr = [
      { domainId: 'technology-it', professionId: 'software-engineer' },
      { domainId: 'sports-athletics', professionId: 'athlete' },
    ];
    const result = normalizeProfessions(arr);
    expect(result[0].domainId).toBe('technology-it');
    expect(result[1].domainId).toBe('sports-athletics');
  });

  test('passes through canonical entries with optional fields', () => {
    const entry = {
      domainId: 'health-medicine',
      professionId: 'surgeon',
      specializationId: 'orthopedic-surgeon',
      subspecializationId: 'sports-injuries',
    };
    expect(normalizeProfessions([entry])).toEqual([entry]);
  });

  test('filters out null entries', () => {
    const arr = [null, { domainId: 'other', professionId: 'student' }];
    const result = normalizeProfessions(arr);
    expect(result).toHaveLength(1);
    expect(result[0].professionId).toBe('student');
  });

  test('filters out entries missing domainId', () => {
    const arr = [
      { professionId: 'software-engineer' },
      { domainId: 'technology-it', professionId: 'data-scientist' },
    ];
    expect(normalizeProfessions(arr)).toHaveLength(1);
    expect(normalizeProfessions(arr)[0].domainId).toBe('technology-it');
  });
});

// ─── normalizeExpertiseTagId ──────────────────────────────────────────────────

describe('normalizeExpertiseTagId', () => {
  test('returns valid tag ID as-is', () => {
    expect(normalizeExpertiseTagId('public-policy')).toBe('public-policy');
    expect(normalizeExpertiseTagId('artificial-intelligence')).toBe('artificial-intelligence');
    expect(normalizeExpertiseTagId('surgery')).toBe('surgery');
  });

  test('returns null for unrecognized string', () => {
    expect(normalizeExpertiseTagId('totally-unknown-area')).toBeNull();
  });

  test('returns null for non-string input', () => {
    expect(normalizeExpertiseTagId(42)).toBeNull();
    expect(normalizeExpertiseTagId(null)).toBeNull();
  });
});

// ─── normalizeExpertiseTags ───────────────────────────────────────────────────

describe('normalizeExpertiseTags', () => {
  test('returns [] for non-array', () => {
    expect(normalizeExpertiseTags(null)).toEqual([]);
  });

  test('passes through valid canonical tag IDs, drops unknowns', () => {
    const input = ['public-policy', 'artificial-intelligence', 'not-a-tag'];
    const result = normalizeExpertiseTags(input);
    expect(result).toContain('public-policy');
    expect(result).toContain('artificial-intelligence');
    expect(result).not.toContain('not-a-tag');
    expect(result).not.toContain(null);
  });
});

// ─── validateProfessionalIdentity ────────────────────────────────────────────

describe('validateProfessionalIdentity', () => {
  test('validates a minimal valid entry (domain + profession only)', () => {
    const entry = { domainId: 'technology-it', professionId: 'software-engineer' };
    const result = validateProfessionalIdentity(entry);
    expect(result.domainId).toBe('technology-it');
    expect(result.professionId).toBe('software-engineer');
    expect(result.specializationId).toBeUndefined();
  });

  test('validates an entry with specialization', () => {
    const entry = { domainId: 'technology-it', professionId: 'software-engineer', specializationId: 'frontend-developer' };
    const result = validateProfessionalIdentity(entry);
    expect(result.specializationId).toBe('frontend-developer');
  });

  test('validates an entry with specialization and subspecialization', () => {
    const entry = {
      domainId: 'health-medicine',
      professionId: 'surgeon',
      specializationId: 'orthopedic-surgeon',
      subspecializationId: 'sports-injuries',
    };
    const result = validateProfessionalIdentity(entry);
    expect(result.subspecializationId).toBe('sports-injuries');
  });

  test('throws 400 for missing domainId', () => {
    expect(() => validateProfessionalIdentity({ professionId: 'software-engineer' })).toThrow();
    try {
      validateProfessionalIdentity({ professionId: 'software-engineer' });
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  test('throws 400 for missing professionId', () => {
    expect(() => validateProfessionalIdentity({ domainId: 'technology-it' })).toThrow();
  });

  test('throws 400 for unknown domainId', () => {
    expect(() => validateProfessionalIdentity({ domainId: 'fake-domain', professionId: 'software-engineer' })).toThrow();
    try {
      validateProfessionalIdentity({ domainId: 'fake-domain', professionId: 'software-engineer' });
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  test('throws 400 for unknown professionId in valid domain', () => {
    expect(() =>
      validateProfessionalIdentity({ domainId: 'technology-it', professionId: 'not-a-profession' })
    ).toThrow();
  });

  test('throws 400 for unknown specializationId', () => {
    expect(() =>
      validateProfessionalIdentity({
        domainId: 'technology-it',
        professionId: 'software-engineer',
        specializationId: 'not-a-spec',
      })
    ).toThrow();
  });

  test('throws 400 for unknown subspecializationId', () => {
    expect(() =>
      validateProfessionalIdentity({
        domainId: 'health-medicine',
        professionId: 'surgeon',
        specializationId: 'orthopedic-surgeon',
        subspecializationId: 'not-a-subspecializ',
      })
    ).toThrow();
  });

  test('throws 400 for null input', () => {
    expect(() => validateProfessionalIdentity(null)).toThrow();
  });

  test('validates all domains have at least one profession that passes', () => {
    const professionsData = require('../src/data/professions.json');
    for (const domain of professionsData.domains) {
      const first = domain.professions[0];
      if (!first) continue;
      const entry = { domainId: domain.id, professionId: first.id };
      expect(() => validateProfessionalIdentity(entry)).not.toThrow();
    }
  });
});

// ─── validateExpertiseTagIds ──────────────────────────────────────────────────

describe('validateExpertiseTagIds', () => {
  test('validates an array of valid tag IDs', () => {
    const arr = ['public-policy', 'surgery', 'artificial-intelligence'];
    expect(validateExpertiseTagIds(arr)).toEqual(arr);
  });

  test('throws for non-array input', () => {
    expect(() => validateExpertiseTagIds('not-array')).toThrow();
    try {
      validateExpertiseTagIds('not-array');
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  test('throws for unknown tag ID', () => {
    expect(() => validateExpertiseTagIds(['totally-fake-tag'])).toThrow();
    try {
      validateExpertiseTagIds(['totally-fake-tag']);
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  test('throws for non-string element', () => {
    expect(() => validateExpertiseTagIds([123])).toThrow();
  });

  test('VALID_EXPERTISE_TAG_IDS contains expected tags', () => {
    expect(VALID_EXPERTISE_TAG_IDS.has('public-policy')).toBe(true);
    expect(VALID_EXPERTISE_TAG_IDS.has('surgery')).toBe(true);
    expect(VALID_EXPERTISE_TAG_IDS.has('artificial-intelligence')).toBe(true);
    expect(VALID_EXPERTISE_TAG_IDS.has('IT / Technology')).toBe(false);
    expect(VALID_EXPERTISE_TAG_IDS.has('Politics')).toBe(false);
  });
});

// ─── resolveProfessionLabel ───────────────────────────────────────────────────

describe('resolveProfessionLabel', () => {
  test('returns empty string for null/undefined', () => {
    expect(resolveProfessionLabel(null)).toBe('');
    expect(resolveProfessionLabel(undefined)).toBe('');
  });

  test('resolves domain + profession', () => {
    const entry = { domainId: 'technology-it', professionId: 'software-engineer' };
    expect(resolveProfessionLabel(entry)).toBe('Technology / IT › Software Engineer');
  });

  test('resolves domain + profession + specialization', () => {
    const entry = {
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
    };
    expect(resolveProfessionLabel(entry)).toBe('Technology / IT › Software Engineer › Frontend Developer');
  });

  test('resolves full 4-level path', () => {
    const entry = {
      domainId: 'health-medicine',
      professionId: 'surgeon',
      specializationId: 'orthopedic-surgeon',
      subspecializationId: 'sports-injuries',
    };
    expect(resolveProfessionLabel(entry)).toBe('Health / Medicine › Surgeon › Orthopedic Surgeon › Sports Injuries');
  });

  test('falls back gracefully for unknown domain', () => {
    const entry = { domainId: 'unknown-domain', professionId: 'something' };
    expect(resolveProfessionLabel(entry)).toBe('unknown-domain');
  });

  test('falls back gracefully for unknown profession within valid domain', () => {
    const entry = { domainId: 'technology-it', professionId: 'unknown-prof' };
    expect(resolveProfessionLabel(entry)).toBe('Technology / IT › unknown-prof');
  });
});

// ─── Taxonomy integrity checks ────────────────────────────────────────────────

describe('Taxonomy data integrity', () => {
  const professionsData = require('../src/data/professions.json');
  const expertiseTagsData = require('../src/data/expertiseTags.json');

  test('taxonomy has version 2', () => {
    expect(professionsData.version).toBe(2);
  });

  test('taxonomy has at least 14 domains', () => {
    expect(professionsData.domains.length).toBeGreaterThanOrEqual(14);
  });

  test('all domain IDs are unique', () => {
    const ids = professionsData.domains.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('all domain IDs are kebab-case strings', () => {
    for (const domain of professionsData.domains) {
      expect(typeof domain.id).toBe('string');
      expect(domain.id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  test('all professions within domains have unique IDs', () => {
    for (const domain of professionsData.domains) {
      const ids = domain.professions.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test('all professions have a specializations array', () => {
    for (const domain of professionsData.domains) {
      for (const profession of domain.professions) {
        expect(Array.isArray(profession.specializations)).toBe(true);
      }
    }
  });

  test('all specializations have a subspecializations array', () => {
    for (const domain of professionsData.domains) {
      for (const profession of domain.professions) {
        for (const spec of profession.specializations) {
          expect(Array.isArray(spec.subspecializations)).toBe(true);
        }
      }
    }
  });

  test('expertise tags have version 1', () => {
    expect(expertiseTagsData.version).toBe(1);
  });

  test('expertise tags array is non-empty', () => {
    expect(expertiseTagsData.expertiseTags.length).toBeGreaterThan(0);
  });

  test('all expertise tag IDs are unique', () => {
    const ids = expertiseTagsData.expertiseTags.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('all expertise tag IDs are kebab-case strings', () => {
    for (const tag of expertiseTagsData.expertiseTags) {
      expect(typeof tag.id).toBe('string');
      expect(tag.id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  test('expertise tags reference valid domain IDs', () => {
    const domainIds = new Set(professionsData.domains.map((d) => d.id));
    for (const tag of expertiseTagsData.expertiseTags) {
      for (const dId of (tag.domainIds || [])) {
        expect(domainIds.has(dId)).toBe(true);
      }
    }
  });
});
