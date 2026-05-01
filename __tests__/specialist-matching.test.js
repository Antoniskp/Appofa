'use strict';

/**
 * Phase 3 tests for specialist matching and taxonomy-based filtering.
 *
 * Covers:
 * - scoreSpecialistMatch: scoring logic for profession hierarchy
 * - scoreSpecialistMatch: expertise tag scoring
 * - scoreSpecialistMatch: edge cases (null, empty, missing fields)
 * - searchUsers: taxonomy filter parameter forwarding (unit-level)
 * - Integration: searchUsers with domainId filter (in-memory SQLite)
 */

const { scoreSpecialistMatch } = require('../src/utils/professionTaxonomy');

// ─── scoreSpecialistMatch ─────────────────────────────────────────────────────

describe('scoreSpecialistMatch', () => {
  // ── zero / empty ──────────────────────────────────────────────────────────

  test('returns 0 for empty professions and no query', () => {
    expect(scoreSpecialistMatch({ professions: [], expertiseTags: [] }, {})).toBe(0);
  });

  test('returns 0 when query has no matching fields', () => {
    const professions = [{ domainId: 'technology-it', professionId: 'software-engineer' }];
    expect(scoreSpecialistMatch({ professions, expertiseTags: [] }, { domainId: 'health-medicine' })).toBe(0);
  });

  test('returns 0 when professions is null/undefined (defensive)', () => {
    expect(scoreSpecialistMatch({ professions: null, expertiseTags: [] }, { domainId: 'technology-it' })).toBe(0);
    expect(scoreSpecialistMatch({}, { domainId: 'technology-it' })).toBe(0);
  });

  // ── domain-only match ─────────────────────────────────────────────────────

  test('awards 2 for domain-only match', () => {
    const professions = [{ domainId: 'technology-it', professionId: 'software-engineer' }];
    const score = scoreSpecialistMatch({ professions, expertiseTags: [] }, { domainId: 'technology-it' });
    expect(score).toBe(2);
  });

  test('awards 0 when domain does not match', () => {
    const professions = [{ domainId: 'technology-it', professionId: 'software-engineer' }];
    const score = scoreSpecialistMatch({ professions, expertiseTags: [] }, { domainId: 'health-medicine' });
    expect(score).toBe(0);
  });

  // ── profession match ──────────────────────────────────────────────────────

  test('awards 2 + 3 = 5 for domain + profession match', () => {
    const professions = [{ domainId: 'technology-it', professionId: 'software-engineer' }];
    const score = scoreSpecialistMatch(
      { professions, expertiseTags: [] },
      { domainId: 'technology-it', professionId: 'software-engineer' }
    );
    expect(score).toBe(5);
  });

  test('no profession credit when profession does not match (even if domain matches)', () => {
    const professions = [{ domainId: 'technology-it', professionId: 'data-scientist' }];
    const score = scoreSpecialistMatch(
      { professions, expertiseTags: [] },
      { domainId: 'technology-it', professionId: 'software-engineer' }
    );
    expect(score).toBe(2); // domain only
  });

  test('awards profession score without domainId in query (edge case)', () => {
    const professions = [{ domainId: 'technology-it', professionId: 'software-engineer' }];
    const score = scoreSpecialistMatch(
      { professions, expertiseTags: [] },
      { professionId: 'software-engineer' }
    );
    expect(score).toBe(3);
  });

  // ── specialization match ──────────────────────────────────────────────────

  test('awards 2 + 3 + 4 = 9 for domain + profession + specialization', () => {
    const professions = [{
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
    }];
    const score = scoreSpecialistMatch(
      { professions, expertiseTags: [] },
      { domainId: 'technology-it', professionId: 'software-engineer', specializationId: 'frontend-developer' }
    );
    expect(score).toBe(9);
  });

  test('no specialization credit when specializationId does not match', () => {
    const professions = [{
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'backend-developer',
    }];
    const score = scoreSpecialistMatch(
      { professions, expertiseTags: [] },
      { domainId: 'technology-it', professionId: 'software-engineer', specializationId: 'frontend-developer' }
    );
    expect(score).toBe(5); // domain + profession only
  });

  // ── subspecialization match ───────────────────────────────────────────────

  test('awards 2 + 3 + 4 + 5 = 14 for full 4-level match', () => {
    const professions = [{
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
      subspecializationId: 'react',
    }];
    const score = scoreSpecialistMatch(
      { professions, expertiseTags: [] },
      {
        domainId: 'technology-it',
        professionId: 'software-engineer',
        specializationId: 'frontend-developer',
        subspecializationId: 'react',
      }
    );
    expect(score).toBe(14);
  });

  test('subspecialization credit not awarded when it does not match', () => {
    const professions = [{
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
      subspecializationId: 'vue',
    }];
    const score = scoreSpecialistMatch(
      { professions, expertiseTags: [] },
      {
        domainId: 'technology-it',
        professionId: 'software-engineer',
        specializationId: 'frontend-developer',
        subspecializationId: 'react',
      }
    );
    expect(score).toBe(9); // domain + profession + specialization
  });

  // ── expertise tag matching ────────────────────────────────────────────────

  test('awards 4 per matching expertise tag', () => {
    const score = scoreSpecialistMatch(
      { professions: [], expertiseTags: ['web-development', 'public-policy'] },
      { expertiseTagIds: ['web-development'] }
    );
    expect(score).toBe(4);
  });

  test('awards 8 for two matching expertise tags', () => {
    const score = scoreSpecialistMatch(
      { professions: [], expertiseTags: ['web-development', 'public-policy'] },
      { expertiseTagIds: ['web-development', 'public-policy'] }
    );
    expect(score).toBe(8);
  });

  test('no expertise tag credit when no tags match', () => {
    const score = scoreSpecialistMatch(
      { professions: [], expertiseTags: ['web-development'] },
      { expertiseTagIds: ['visual-arts'] }
    );
    expect(score).toBe(0);
  });

  test('expertise tags score is additive with profession score', () => {
    const professions = [{ domainId: 'technology-it', professionId: 'software-engineer' }];
    const score = scoreSpecialistMatch(
      { professions, expertiseTags: ['web-development'] },
      { domainId: 'technology-it', expertiseTagIds: ['web-development'] }
    );
    expect(score).toBe(2 + 4); // domain + tag
  });

  // ── multiple professions: best match wins ─────────────────────────────────

  test('uses the best-scoring profession entry from multiple entries', () => {
    const professions = [
      { domainId: 'health-medicine', professionId: 'doctor' },
      { domainId: 'technology-it', professionId: 'software-engineer' },
    ];
    const score = scoreSpecialistMatch(
      { professions, expertiseTags: [] },
      { domainId: 'technology-it', professionId: 'software-engineer' }
    );
    expect(score).toBe(5); // only the tech match counts
  });

  // ── ranking ordering ──────────────────────────────────────────────────────

  test('subspecialization match scores higher than specialization match', () => {
    const profWithSubspec = [{
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
      subspecializationId: 'react',
    }];
    const profWithSpec = [{
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
    }];
    const query = {
      domainId: 'technology-it',
      professionId: 'software-engineer',
      specializationId: 'frontend-developer',
      subspecializationId: 'react',
    };
    const scoreSubspec = scoreSpecialistMatch({ professions: profWithSubspec, expertiseTags: [] }, query);
    const scoreSpec = scoreSpecialistMatch({ professions: profWithSpec, expertiseTags: [] }, query);
    expect(scoreSubspec).toBeGreaterThan(scoreSpec);
  });

  test('profession match scores higher than domain-only match', () => {
    const profMatch = [{ domainId: 'technology-it', professionId: 'software-engineer' }];
    const domainMatch = [{ domainId: 'technology-it', professionId: 'data-scientist' }];
    const query = { domainId: 'technology-it', professionId: 'software-engineer' };
    const scoreProfMatch = scoreSpecialistMatch({ professions: profMatch, expertiseTags: [] }, query);
    const scoreDomainOnly = scoreSpecialistMatch({ professions: domainMatch, expertiseTags: [] }, query);
    expect(scoreProfMatch).toBeGreaterThan(scoreDomainOnly);
  });
});

// ─── Integration: searchUsers taxonomy filter ─────────────────────────────────

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('../src/config/securityHeaders');
const authRoutes = require('../src/routes/authRoutes');
const { sequelize, User } = require('../src/models');

const app = express();
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('searchUsers — taxonomy filtering (integration)', () => {
  let adminToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key';
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Create admin user for auth
    const admin = await User.create({
      username: 'admin_tax',
      email: 'admin_tax@test.com',
      password: 'password123',
      role: 'admin',
      searchable: true,
    });

    // Create users with structured profession data
    await User.create({
      username: 'devuser',
      email: 'dev@test.com',
      password: 'pass',
      role: 'viewer',
      searchable: true,
      professions: [{ domainId: 'technology-it', professionId: 'software-engineer' }],
      expertiseArea: ['web-development'],
    });

    await User.create({
      username: 'docuser',
      email: 'doc@test.com',
      password: 'pass',
      role: 'viewer',
      searchable: true,
      professions: [{ domainId: 'health-medicine', professionId: 'doctor' }],
      expertiseArea: ['public-health-tag'],
    });

    await User.create({
      username: 'noprof',
      email: 'noprof@test.com',
      password: 'pass',
      role: 'viewer',
      searchable: true,
    });

    // Log in as admin to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin_tax@test.com', password: 'password123' });
    adminToken = loginRes.headers['set-cookie'];
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('returns all searchable real-users when no taxonomy filter', async () => {
    const res = await request(app)
      .get('/api/auth/users/search')
      .set('Cookie', adminToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const usernames = res.body.data.users.map((u) => u.username);
    expect(usernames).toContain('devuser');
    expect(usernames).toContain('docuser');
    expect(usernames).toContain('noprof');
  });

  test('filters by domainId returning only matching users', async () => {
    const res = await request(app)
      .get('/api/auth/users/search?domainId=technology-it')
      .set('Cookie', adminToken);
    expect(res.status).toBe(200);
    const usernames = res.body.data.users.map((u) => u.username);
    expect(usernames).toContain('devuser');
    expect(usernames).not.toContain('docuser');
    expect(usernames).not.toContain('noprof');
  });

  test('filters by professionId returning only matching users', async () => {
    const res = await request(app)
      .get('/api/auth/users/search?domainId=health-medicine&professionId=doctor')
      .set('Cookie', adminToken);
    expect(res.status).toBe(200);
    const usernames = res.body.data.users.map((u) => u.username);
    expect(usernames).toContain('docuser');
    expect(usernames).not.toContain('devuser');
  });

  test('response includes professions field when taxonomy filter active', async () => {
    const res = await request(app)
      .get('/api/auth/users/search?domainId=technology-it')
      .set('Cookie', adminToken);
    expect(res.status).toBe(200);
    const devUser = res.body.data.users.find((u) => u.username === 'devuser');
    expect(devUser).toBeDefined();
    expect(Array.isArray(devUser.professions)).toBe(true);
    expect(devUser.professions[0].domainId).toBe('technology-it');
  });

  test('response includes _relevanceScore when taxonomy filter active', async () => {
    const res = await request(app)
      .get('/api/auth/users/search?domainId=technology-it')
      .set('Cookie', adminToken);
    expect(res.status).toBe(200);
    const devUser = res.body.data.users.find((u) => u.username === 'devuser');
    expect(devUser._relevanceScore).toBeGreaterThan(0);
  });

  test('no taxonomy filter: professions field still returned in results', async () => {
    const res = await request(app)
      .get('/api/auth/users/search')
      .set('Cookie', adminToken);
    expect(res.status).toBe(200);
    const devUser = res.body.data.users.find((u) => u.username === 'devuser');
    expect(devUser).toBeDefined();
    expect(Array.isArray(devUser.professions)).toBe(true);
  });

  test('pagination works for taxonomy-filtered results', async () => {
    const res = await request(app)
      .get('/api/auth/users/search?domainId=technology-it&page=1&limit=10')
      .set('Cookie', adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toMatchObject({
      currentPage: 1,
      itemsPerPage: 10,
    });
    expect(res.body.data.pagination.totalItems).toBeGreaterThanOrEqual(1);
  });
});
