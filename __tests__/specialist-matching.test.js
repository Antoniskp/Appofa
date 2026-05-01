'use strict';

/**
 * Phase 3 — Specialist matching tests.
 *
 * Covers:
 *   - scoreSpecialistMatch: scoring logic
 *   - userService.searchUsers: taxonomy filtering & relevance ordering
 */

const { scoreSpecialistMatch } = require('../src/utils/professionTaxonomy');

// ─── scoreSpecialistMatch ─────────────────────────────────────────────────────

describe('scoreSpecialistMatch', () => {
  const makeProfile = (professions = [], expertiseArea = []) => ({
    professions,
    expertiseArea,
  });

  test('returns 0 for empty profile', () => {
    const query = { domainId: 'technology-it' };
    expect(scoreSpecialistMatch(makeProfile(), query)).toBe(0);
  });

  test('returns 0 for null profile', () => {
    expect(scoreSpecialistMatch(null, { domainId: 'technology-it' })).toBe(0);
  });

  test('returns 0 for null query', () => {
    const profile = makeProfile([{ domainId: 'technology-it', professionId: 'software-engineer' }]);
    expect(scoreSpecialistMatch(profile, null)).toBe(0);
  });

  test('scores 2 for domain-only match', () => {
    const profile = makeProfile([
      { domainId: 'technology-it', professionId: 'software-engineer' },
    ]);
    const query = { domainId: 'technology-it' };
    expect(scoreSpecialistMatch(profile, query)).toBe(2);
  });

  test('scores 0 when domain does not match', () => {
    const profile = makeProfile([
      { domainId: 'health-medicine', professionId: 'doctor' },
    ]);
    const query = { domainId: 'technology-it' };
    expect(scoreSpecialistMatch(profile, query)).toBe(0);
  });

  test('scores 5 for domain + profession match', () => {
    const profile = makeProfile([
      { domainId: 'technology-it', professionId: 'software-engineer' },
    ]);
    const query = { domainId: 'technology-it', professionId: 'software-engineer' };
    expect(scoreSpecialistMatch(profile, query)).toBe(5);
  });

  test('scores 2 when domain matches but profession does not', () => {
    const profile = makeProfile([
      { domainId: 'technology-it', professionId: 'data-scientist' },
    ]);
    const query = { domainId: 'technology-it', professionId: 'software-engineer' };
    // domain matches (+2) but profession doesn't (+0)
    expect(scoreSpecialistMatch(profile, query)).toBe(2);
  });

  test('scores 9 for domain + profession + specialization match', () => {
    const profile = makeProfile([
      {
        domainId: 'technology-it',
        professionId: 'software-engineer',
        specializationId: 'frontend-developer',
      },
    ]);
    const query = {
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
    };
    expect(scoreSpecialistMatch(profile, query)).toBe(9);
  });

  test('scores 14 for full hierarchy match', () => {
    const profile = makeProfile([
      {
        domainId: 'health-medicine',
        professionId: 'doctor',
        specializationId: 'orthopedic-surgeon',
        subspecializationId: 'sports-injuries',
      },
    ]);
    const query = {
      domainId: 'health-medicine',
      professionId: 'doctor',
      specializationId: 'orthopedic-surgeon',
      subspecializationId: 'sports-injuries',
    };
    expect(scoreSpecialistMatch(profile, query)).toBe(14);
  });

  test('takes best score across multiple profession entries', () => {
    const profile = makeProfile([
      { domainId: 'technology-it', professionId: 'data-scientist' },
      { domainId: 'technology-it', professionId: 'software-engineer', specializationId: 'frontend-developer' },
    ]);
    const query = {
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
    };
    // First entry: domain(2) + profession mismatch = 2
    // Second entry: domain(2) + profession(3) + spec(4) = 9
    expect(scoreSpecialistMatch(profile, query)).toBe(9);
  });

  test('adds 4 per matching expertise tag', () => {
    const profile = makeProfile(
      [{ domainId: 'technology-it', professionId: 'software-engineer' }],
      ['web-development', 'cloud-computing'],
    );
    const query = {
      domainId: 'technology-it',
      expertiseTags: ['web-development', 'cloud-computing'],
    };
    // domain(2) + 2 tags * 4 = 10
    expect(scoreSpecialistMatch(profile, query)).toBe(10);
  });

  test('ignores expertise tags not on profile', () => {
    const profile = makeProfile(
      [{ domainId: 'technology-it', professionId: 'software-engineer' }],
      ['web-development'],
    );
    const query = {
      domainId: 'technology-it',
      expertiseTags: ['web-development', 'machine-learning'],
    };
    // domain(2) + 1 matching tag * 4 = 6
    expect(scoreSpecialistMatch(profile, query)).toBe(6);
  });

  test('ignores non-array expertiseTags in query', () => {
    const profile = makeProfile(
      [{ domainId: 'technology-it', professionId: 'software-engineer' }],
      ['web-development'],
    );
    const query = {
      domainId: 'technology-it',
      expertiseTags: 'web-development', // invalid — not an array
    };
    // Should not throw; expertise tags ignored
    expect(scoreSpecialistMatch(profile, query)).toBe(2);
  });

  test('handles profile with no expertiseArea', () => {
    const profile = { professions: [{ domainId: 'technology-it', professionId: 'software-engineer' }] };
    const query = { domainId: 'technology-it', expertiseTags: ['web-development'] };
    expect(scoreSpecialistMatch(profile, query)).toBe(2);
  });

  test('higher specificity yields higher score', () => {
    const generic = makeProfile([{ domainId: 'health-medicine', professionId: 'doctor' }]);
    const specialist = makeProfile([
      { domainId: 'health-medicine', professionId: 'doctor', specializationId: 'cardiologist' },
    ]);
    const query = {
      domainId: 'health-medicine',
      professionId: 'doctor',
      specializationId: 'cardiologist',
    };
    expect(scoreSpecialistMatch(specialist, query)).toBeGreaterThan(
      scoreSpecialistMatch(generic, query),
    );
  });
});

// ─── userService.searchUsers taxonomy integration ─────────────────────────────

const { Sequelize } = require('sequelize');
const sequelize = require('../src/config/database');

// Bootstrap models for in-memory SQLite test DB
const User = require('../src/models/User');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

const userService = require('../src/services/userService');

async function createTestUser(overrides = {}) {
  return User.create({
    username: `testuser_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    email: `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    role: 'viewer',
    searchable: true,
    claimStatus: null,
    ...overrides,
  });
}

describe('userService.searchUsers — taxonomy filtering', () => {
  let techUser;
  let healthUser;
  let genericUser;

  beforeAll(async () => {
    techUser = await createTestUser({
      username: 'tech_specialist',
      professions: [
        {
          domainId: 'technology-it',
          professionId: 'software-engineer',
          specializationId: 'frontend-developer',
        },
      ],
      expertiseArea: ['web-development'],
    });

    healthUser = await createTestUser({
      username: 'health_specialist',
      professions: [
        { domainId: 'health-medicine', professionId: 'doctor', specializationId: 'cardiologist' },
      ],
      expertiseArea: ['public-health-tag'],
    });

    genericUser = await createTestUser({
      username: 'generic_user',
      professions: [],
      expertiseArea: [],
    });
  });

  test('returns all searchable users when no filters', async () => {
    const result = await userService.searchUsers('', 1, 100, null, null, null);
    const usernames = result.users.map((u) => u.username);
    expect(usernames).toContain('tech_specialist');
    expect(usernames).toContain('health_specialist');
    expect(usernames).toContain('generic_user');
  });

  test('filters by domain — returns only tech users', async () => {
    const result = await userService.searchUsers('', 1, 100, null, null, {
      domainId: 'technology-it',
    });
    const usernames = result.users.map((u) => u.username);
    expect(usernames).toContain('tech_specialist');
    expect(usernames).not.toContain('health_specialist');
    expect(usernames).not.toContain('generic_user');
  });

  test('filters by domain — returns only health users', async () => {
    const result = await userService.searchUsers('', 1, 100, null, null, {
      domainId: 'health-medicine',
    });
    const usernames = result.users.map((u) => u.username);
    expect(usernames).toContain('health_specialist');
    expect(usernames).not.toContain('tech_specialist');
  });

  test('returns _relevanceScore on users when taxonomy filter is active', async () => {
    const result = await userService.searchUsers('', 1, 100, null, null, {
      domainId: 'technology-it',
    });
    for (const u of result.users) {
      expect(typeof u._relevanceScore).toBe('number');
    }
  });

  test('more specific match scores higher than less specific', async () => {
    // Create two tech users, one with and one without specialization
    const broadUser = await createTestUser({
      username: 'broad_tech',
      professions: [
        { domainId: 'technology-it', professionId: 'software-engineer' },
      ],
    });
    const narrowUser = await createTestUser({
      username: 'narrow_tech',
      professions: [
        {
          domainId: 'technology-it',
          professionId: 'software-engineer',
          specializationId: 'frontend-developer',
        },
      ],
    });

    const result = await userService.searchUsers('', 1, 100, null, null, {
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
    });

    const narrowEntry = result.users.find((u) => u.username === 'narrow_tech');
    const broadEntry = result.users.find((u) => u.username === 'broad_tech');

    expect(narrowEntry).toBeDefined();
    expect(broadEntry).toBeDefined();
    expect(narrowEntry._relevanceScore).toBeGreaterThan(broadEntry._relevanceScore);

    // narrowUser should appear before broadUser (sorted by relevance)
    const narrowIdx = result.users.findIndex((u) => u.username === 'narrow_tech');
    const broadIdx = result.users.findIndex((u) => u.username === 'broad_tech');
    expect(narrowIdx).toBeLessThan(broadIdx);
  });

  test('pagination works with taxonomy filter', async () => {
    const page1 = await userService.searchUsers('', 1, 1, null, null, {
      domainId: 'technology-it',
    });
    expect(page1.users.length).toBe(1);
    expect(page1.pagination.totalPages).toBeGreaterThanOrEqual(1);
    expect(page1.pagination.itemsPerPage).toBe(1);
  });

  test('no taxonomy filter returns users without _relevanceScore', async () => {
    const result = await userService.searchUsers('generic_user', 1, 100, null, null, null);
    // Plain Sequelize model instances don't have _relevanceScore
    for (const u of result.users) {
      expect(u._relevanceScore).toBeUndefined();
    }
  });
});
