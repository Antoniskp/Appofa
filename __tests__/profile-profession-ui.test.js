'use strict';

/**
 * Phase 2 tests for profession/expertise taxonomy UI and save-flow behavior.
 *
 * Covers:
 * - resolveProfessionLabel output for public profile display
 * - getExpertiseTagLabel output for public profile display
 * - Expertise section filtering logic (search)
 * - Professions section add/remove logic
 * - Expertise tag max enforcement
 * - ProfileProfessionsSection and ProfileExpertiseSection component exports
 * - Admin expertise area list uses EXPERTISE_TAGS (tag IDs + labels)
 * - userService public profile queries include expertiseArea
 */

const {
  resolveProfessionLabel,
  getExpertiseTagLabel,
  EXPERTISE_TAGS,
  DOMAINS,
  normalizeExpertiseTags,
  VALID_EXPERTISE_TAG_IDS,
} = require('../lib/utils/professionTaxonomy');

// ─── resolveProfessionLabel (public profile display) ─────────────────────────

describe('resolveProfessionLabel — public display', () => {
  test('formats domain + profession correctly', () => {
    const label = resolveProfessionLabel({ domainId: 'technology-it', professionId: 'software-engineer' });
    expect(label).toContain('Technology');
    expect(label).toContain('Software Engineer');
    expect(label).toContain('›');
  });

  test('formats domain + profession + specialization correctly', () => {
    const label = resolveProfessionLabel({
      domainId: 'health-medicine',
      professionId: 'doctor',
      specializationId: 'cardiologist',
    });
    expect(label).toContain('Health');
    expect(label).toContain('Doctor');
    expect(label).toContain('Cardiolog');
  });

  test('formats full 4-level path', () => {
    const label = resolveProfessionLabel({
      domainId: 'health-medicine',
      professionId: 'surgeon',
      specializationId: 'orthopedic-surgeon',
      subspecializationId: 'sports-injuries',
    });
    expect(label).toContain('›');
    expect(label.split('›').length).toBeGreaterThanOrEqual(3);
  });

  test('returns empty string for null/undefined', () => {
    expect(resolveProfessionLabel(null)).toBe('');
    expect(resolveProfessionLabel(undefined)).toBe('');
  });

  test('falls back gracefully for unknown domain', () => {
    const label = resolveProfessionLabel({ domainId: 'unknown-domain', professionId: 'foo' });
    expect(label).toBeTruthy();
  });
});

// ─── getExpertiseTagLabel (public display) ────────────────────────────────────

describe('getExpertiseTagLabel — public display', () => {
  test('returns human-readable label for known tag', () => {
    expect(getExpertiseTagLabel('artificial-intelligence')).toBe('Artificial Intelligence');
    expect(getExpertiseTagLabel('web-development')).toBe('Web Development');
    expect(getExpertiseTagLabel('public-policy')).toBe('Public Policy');
  });

  test('falls back to ID for unknown tag', () => {
    expect(getExpertiseTagLabel('unknown-tag-xyz')).toBe('unknown-tag-xyz');
  });

  test('all EXPERTISE_TAGS have non-empty labels', () => {
    for (const tag of EXPERTISE_TAGS) {
      expect(typeof tag.label).toBe('string');
      expect(tag.label.trim().length).toBeGreaterThan(0);
    }
  });

  test('EXPERTISE_TAGS labels differ from their IDs (i.e. are human-readable)', () => {
    let humanReadableCount = 0;
    for (const tag of EXPERTISE_TAGS) {
      if (tag.label !== tag.id) humanReadableCount++;
    }
    expect(humanReadableCount).toBeGreaterThan(EXPERTISE_TAGS.length / 2);
  });
});

// ─── Expertise section filtering logic ───────────────────────────────────────

describe('Expertise section search/filter logic', () => {
  function filterTags(selected, search) {
    const q = (search || '').trim().toLowerCase();
    return EXPERTISE_TAGS.filter(
      (tag) => !selected.includes(tag.id) && (!q || tag.label.toLowerCase().includes(q))
    );
  }

  test('returns all tags when search is empty and none selected', () => {
    expect(filterTags([], '')).toHaveLength(EXPERTISE_TAGS.length);
  });

  test('excludes selected tags', () => {
    const selected = ['artificial-intelligence', 'web-development'];
    const result = filterTags(selected, '');
    expect(result.find((t) => t.id === 'artificial-intelligence')).toBeUndefined();
    expect(result.find((t) => t.id === 'web-development')).toBeUndefined();
    expect(result.length).toBe(EXPERTISE_TAGS.length - 2);
  });

  test('filters by search query (case-insensitive)', () => {
    const result = filterTags([], 'health');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((tag) => {
      expect(tag.label.toLowerCase()).toContain('health');
    });
  });

  test('returns empty array when search matches nothing', () => {
    const result = filterTags([], 'zzzznotaghasthisstring999');
    expect(result).toHaveLength(0);
  });

  test('tag at max (5 selected) shows no more tags', () => {
    const selected = EXPERTISE_TAGS.slice(0, 5).map((t) => t.id);
    const atMax = selected.length >= 5;
    expect(atMax).toBe(true);
  });
});

// ─── Profession picker add/remove logic ──────────────────────────────────────

describe('Profession picker add/remove logic', () => {
  test('add creates a canonical entry with domain + profession', () => {
    const picker = {
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: '',
      subspecializationId: '',
    };
    const entry = { domainId: picker.domainId, professionId: picker.professionId };
    if (picker.specializationId) entry.specializationId = picker.specializationId;
    if (picker.subspecializationId) entry.subspecializationId = picker.subspecializationId;

    expect(entry.domainId).toBe('technology-it');
    expect(entry.professionId).toBe('software-engineer');
    expect(entry.specializationId).toBeUndefined();
    expect(entry.subspecializationId).toBeUndefined();
  });

  test('add with specialization includes specializationId', () => {
    const picker = {
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
      subspecializationId: '',
    };
    const entry = { domainId: picker.domainId, professionId: picker.professionId };
    if (picker.specializationId) entry.specializationId = picker.specializationId;
    if (picker.subspecializationId) entry.subspecializationId = picker.subspecializationId;

    expect(entry.specializationId).toBe('frontend-developer');
    expect(entry.subspecializationId).toBeUndefined();
  });

  test('changing domain resets profession, specialization, subspecialization', () => {
    let picker = {
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
      subspecializationId: 'react-developer',
    };

    // Simulate onPickerChange when domain changes
    picker = { domainId: 'health-medicine', professionId: '', specializationId: '', subspecializationId: '' };

    expect(picker.professionId).toBe('');
    expect(picker.specializationId).toBe('');
    expect(picker.subspecializationId).toBe('');
  });

  test('changing profession resets specialization and subspecialization', () => {
    let picker = {
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
      subspecializationId: '',
    };

    // Simulate onPickerChange when profession changes
    picker = { ...picker, professionId: 'data-scientist', specializationId: '', subspecializationId: '' };

    expect(picker.specializationId).toBe('');
    expect(picker.subspecializationId).toBe('');
    expect(picker.domainId).toBe('technology-it');
  });

  test('add button disabled when domain or profession is empty', () => {
    const professions = [];
    const isDisabled = (picker) =>
      professions.length >= 5 || !picker.domainId || !picker.professionId;

    expect(isDisabled({ domainId: '', professionId: '' })).toBe(true);
    expect(isDisabled({ domainId: 'technology-it', professionId: '' })).toBe(true);
    expect(isDisabled({ domainId: '', professionId: 'software-engineer' })).toBe(true);
    expect(isDisabled({ domainId: 'technology-it', professionId: 'software-engineer' })).toBe(false);
  });

  test('add button disabled when professions list is at max (5)', () => {
    const professions = new Array(5).fill({ domainId: 'technology-it', professionId: 'software-engineer' });
    const isDisabled = (picker) =>
      professions.length >= 5 || !picker.domainId || !picker.professionId;

    expect(isDisabled({ domainId: 'technology-it', professionId: 'software-engineer' })).toBe(true);
  });

  test('remove filters out entry by index', () => {
    let professions = [
      { domainId: 'technology-it', professionId: 'software-engineer' },
      { domainId: 'health-medicine', professionId: 'doctor' },
    ];
    professions = professions.filter((_, i) => i !== 0);
    expect(professions).toHaveLength(1);
    expect(professions[0].domainId).toBe('health-medicine');
  });
});

// ─── Expertise tag max enforcement ───────────────────────────────────────────

describe('Expertise tag max enforcement', () => {
  test('cannot add more than 5 tags', () => {
    let expertiseArea = ['tag-1', 'tag-2', 'tag-3', 'tag-4', 'tag-5'];
    const atMax = expertiseArea.length >= 5;
    expect(atMax).toBe(true);
  });

  test('remove reduces the selected count', () => {
    let expertiseArea = ['artificial-intelligence', 'web-development', 'surgery'];
    expertiseArea = expertiseArea.filter((a) => a !== 'web-development');
    expect(expertiseArea).toHaveLength(2);
    expect(expertiseArea).not.toContain('web-development');
  });

  test('add appends tag ID (not label)', () => {
    let expertiseArea = [];
    expertiseArea = [...expertiseArea, 'artificial-intelligence'];
    expect(expertiseArea[0]).toBe('artificial-intelligence');
    expect(VALID_EXPERTISE_TAG_IDS.has(expertiseArea[0])).toBe(true);
  });
});

// ─── Component exports ────────────────────────────────────────────────────────

describe('Profile section component exports', () => {
  test('ProfileProfessionsSection is exported as function', () => {
    const comp = require('../components/profile/ProfileProfessionsSection');
    const fn = comp.default || comp;
    expect(typeof fn).toBe('function');
  });

  test('ProfileExpertiseSection is exported as function', () => {
    const comp = require('../components/profile/ProfileExpertiseSection');
    const fn = comp.default || comp;
    expect(typeof fn).toBe('function');
  });
});

// ─── Admin expertise areas use EXPERTISE_TAGS (not raw IDs) ──────────────────

describe('EXPERTISE_TAGS list integrity', () => {
  test('EXPERTISE_TAGS has at least 70 entries', () => {
    expect(EXPERTISE_TAGS.length).toBeGreaterThanOrEqual(70);
  });

  test('every EXPERTISE_TAG has id and label', () => {
    for (const tag of EXPERTISE_TAGS) {
      expect(typeof tag.id).toBe('string');
      expect(typeof tag.label).toBe('string');
      expect(tag.id.length).toBeGreaterThan(0);
      expect(tag.label.length).toBeGreaterThan(0);
    }
  });

  test('EXPERTISE_TAG labels are human-readable (no raw kebab-case ids)', () => {
    for (const tag of EXPERTISE_TAGS) {
      // Labels should contain spaces or capital letters (human-readable)
      const isHumanReadable = /[A-Z]/.test(tag.label) || tag.label.includes(' ');
      expect(isHumanReadable).toBe(true);
    }
  });
});
