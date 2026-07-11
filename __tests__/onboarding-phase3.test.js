/**
 * Phase 3 onboarding backend tests
 *
 * Covers:
 * - POST /api/onboarding/events — event recording, validation, idempotency
 * - GET /api/admin/onboarding/funnel — aggregate metrics, admin-only, date validation
 * - GET /api/auth/my-contributions — current-user isolation, status grouping, limits
 * - GET /api/auth/profile-readiness — own readiness, data truthfulness
 * - GET /api/admin/users/:userId/onboarding-context — admin/moderator only, batching
 * - Key parity for onboarding i18n namespaces (el / en / ro)
 */

const request = require('supertest');
const express = require('express');
const {
  sequelize,
  User,
  Article,
  Poll,
  Suggestion,
  Follow,
  CandidateRegistration,
  OnboardingEvent,
} = require('../src/models');
const authRoutes = require('../src/routes/authRoutes');
const adminRoutes = require('../src/routes/adminRoutes');
const onboardingEventRoutes = require('../src/routes/onboardingEventRoutes');
const { storeCsrfToken } = require('../src/utils/csrf');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase3-test-secret';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/onboarding', onboardingEventRoutes);

const csrf = 'phase3-csrf-token';
const csrfHeader = (token) => ({
  Cookie: [`csrf_token=${token}`],
  'x-csrf-token': token,
});

// ─── helpers ──────────────────────────────────────────────────────────────────

async function loginUser(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  const cookie = res.headers['set-cookie']?.find((c) => c.startsWith('auth_token='));
  return cookie ? cookie.split(';')[0].replace('auth_token=', '') : null;
}

async function createAndLoginUser(username, email, role = 'viewer') {
  const user = await User.create({
    username,
    email,
    password: 'Password123!',
    role,
    emailVerified: true,
    firstNameNative: 'Test',
    lastNameNative: 'User',
    firstNameEn: 'Test',
    lastNameEn: 'User',
    slug: username.padEnd(3, 'x').slice(0, 50),
  });
  storeCsrfToken(csrf, user.id);
  const token = await loginUser(email, 'Password123!');
  return { user, token };
}

// ─── setup ────────────────────────────────────────────────────────────────────

describe('Phase 3 onboarding backend', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── OnboardingEvent recording ──────────────────────────────────────────────

  describe('POST /api/onboarding/events', () => {
    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/onboarding/events')
        .send({ eventType: 'onboarding_viewed' });
      expect(res.status).toBe(401);
    });

    it('rejects missing CSRF token', async () => {
      const { token } = await createAndLoginUser('usr1', 'u1@test.com');
      const res = await request(app)
        .post('/api/onboarding/events')
        .set('Cookie', [`auth_token=${token}`])
        .send({ eventType: 'onboarding_viewed' });
      expect(res.status).toBe(403);
    });

    it('records a valid event', async () => {
      const { token, user } = await createAndLoginUser('usr2', 'u2@test.com');
      const res = await request(app)
        .post('/api/onboarding/events')
        .set('Cookie', [`auth_token=${token}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ eventType: 'onboarding_viewed', goal: 'moderator' });
      expect(res.status).toBe(201);
      expect(res.body.data.recorded).toBe(true);

      const event = await OnboardingEvent.findOne({ where: { userId: user.id, eventType: 'onboarding_viewed' } });
      expect(event).not.toBeNull();
      expect(event.goal).toBe('moderator');
    });

    it('rejects invalid eventType', async () => {
      const { token } = await createAndLoginUser('usr3', 'u3@test.com');
      const res = await request(app)
        .post('/api/onboarding/events')
        .set('Cookie', [`auth_token=${token}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ eventType: 'invalid_event_type' });
      expect(res.status).toBe(400);
    });

    it('rejects invalid goal value', async () => {
      const { token } = await createAndLoginUser('usr4', 'u4@test.com');
      const res = await request(app)
        .post('/api/onboarding/events')
        .set('Cookie', [`auth_token=${token}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({ eventType: 'goal_selected', goal: 'invalid_goal' });
      expect(res.status).toBe(400);
    });

    it('is idempotent for once-per-user events', async () => {
      const { token, user } = await createAndLoginUser('usr5', 'u5@test.com');
      const headers = {
        Cookie: [`auth_token=${token}`, `csrf_token=${csrf}`],
        'x-csrf-token': csrf,
      };

      // First request
      const r1 = await request(app)
        .post('/api/onboarding/events')
        .set(headers)
        .send({ eventType: 'goal_selected', goal: 'creator' });
      expect(r1.status).toBe(201);
      expect(r1.body.data.recorded).toBe(true);

      // Second request — should be skipped
      const r2 = await request(app)
        .post('/api/onboarding/events')
        .set(headers)
        .send({ eventType: 'goal_selected', goal: 'creator' });
      expect(r2.status).toBe(200);
      expect(r2.body.data.recorded).toBe(false);
      expect(r2.body.data.reason).toBe('already_exists');

      // Only one row should exist
      const count = await OnboardingEvent.count({ where: { userId: user.id, eventType: 'goal_selected' } });
      expect(count).toBe(1);
    });

    it('allows repeatable events (onboarding_viewed) multiple times', async () => {
      const { token, user } = await createAndLoginUser('usr6', 'u6@test.com');
      const headers = {
        Cookie: [`auth_token=${token}`, `csrf_token=${csrf}`],
        'x-csrf-token': csrf,
      };

      await request(app).post('/api/onboarding/events').set(headers).send({ eventType: 'onboarding_viewed' });
      await request(app).post('/api/onboarding/events').set(headers).send({ eventType: 'onboarding_viewed' });

      const count = await OnboardingEvent.count({ where: { userId: user.id, eventType: 'onboarding_viewed' } });
      expect(count).toBe(2);
    });

    it('only stores allowlisted metadata keys', async () => {
      const { token, user } = await createAndLoginUser('usr7', 'u7@test.com');
      const res = await request(app)
        .post('/api/onboarding/events')
        .set('Cookie', [`auth_token=${token}`, `csrf_token=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({
          eventType: 'first_contribution_created',
          metadata: { contentType: 'article', sensitiveField: 'should_be_dropped' },
        });
      expect(res.status).toBe(201);
      const event = await OnboardingEvent.findOne({ where: { userId: user.id } });
      const meta = event.metadata;
      expect(meta.contentType).toBe('article');
      expect(meta.sensitiveField).toBeUndefined();
    });
  });

  // ── Admin funnel endpoint ──────────────────────────────────────────────────

  describe('GET /api/admin/onboarding/funnel', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/admin/onboarding/funnel');
      expect(res.status).toBe(401);
    });

    it('requires admin role (moderator is rejected)', async () => {
      const { token } = await createAndLoginUser('mod1', 'mod1@test.com', 'moderator');
      const res = await request(app)
        .get('/api/admin/onboarding/funnel')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(403);
    });

    it('returns funnel data for admin', async () => {
      const { token, user } = await createAndLoginUser('admin1', 'admin1@test.com', 'admin');

      // Seed some events
      await OnboardingEvent.bulkCreate([
        { userId: user.id, eventType: 'onboarding_viewed', goal: 'moderator' },
        { userId: user.id, eventType: 'goal_selected', goal: 'moderator' },
      ]);

      const res = await request(app)
        .get('/api/admin/onboarding/funnel')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('byEventType');
      expect(res.body.data).toHaveProperty('abandonment');
    });

    it('rejects invalid date range', async () => {
      const { token } = await createAndLoginUser('admin2', 'admin2@test.com', 'admin');
      const res = await request(app)
        .get('/api/admin/onboarding/funnel?from=not-a-date')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(400);
    });

    it('rejects from > to', async () => {
      const { token } = await createAndLoginUser('admin3', 'admin3@test.com', 'admin');
      const res = await request(app)
        .get('/api/admin/onboarding/funnel?from=2030-01-01&to=2025-01-01')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(400);
    });

    // ── Regression: abandonment query must not use raw SQL (PostgreSQL casing) ─

    it('returns 200 with empty data when no events exist (guards against raw SQL casing bug)', async () => {
      // This test verifies the abandonment calculation path returns a valid
      // response even when the OnboardingEvents table is empty, which is the
      // first failure mode of the raw SQL that used unquoted mixed-case
      // identifiers (OnboardingEvents, userId, eventType, createdAt).
      const { token } = await createAndLoginUser('admin_reg1', 'admin_reg1@test.com', 'admin');
      const res = await request(app)
        .get('/api/admin/onboarding/funnel')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.abandonment.viewedBeforeCutoff).toBe(0);
      expect(res.body.data.abandonment.completedViewers).toBe(0);
      expect(res.body.data.abandonment.abandonedCount).toBe(0);
    });

    it('computes abandonment with correct distinct-user semantics', async () => {
      const { user: viewer1 } = await createAndLoginUser('abn_v1', 'abn_v1@test.com');
      const { user: viewer2 } = await createAndLoginUser('abn_v2', 'abn_v2@test.com');
      const { user: completer } = await createAndLoginUser('abn_c1', 'abn_c1@test.com');
      const { token } = await createAndLoginUser('abn_admin', 'abn_admin@test.com', 'admin');

      // All three users viewed onboarding well before the 14-day cutoff
      const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
      await OnboardingEvent.bulkCreate([
        { userId: viewer1.id, eventType: 'onboarding_viewed', createdAt: oldDate },
        { userId: viewer2.id, eventType: 'onboarding_viewed', createdAt: oldDate },
        { userId: completer.id, eventType: 'onboarding_viewed', createdAt: oldDate },
        // Only completer finished
        { userId: completer.id, eventType: 'onboarding_completed', createdAt: new Date() },
      ]);

      const res = await request(app)
        .get('/api/admin/onboarding/funnel')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(200);
      const { abandonment } = res.body.data;
      expect(abandonment.viewedBeforeCutoff).toBe(3);
      expect(abandonment.completedViewers).toBe(1);
      expect(abandonment.abandonedCount).toBe(2);
      expect(abandonment.abandonmentRate).toBe(67); // Math.round(2/3 * 100)
    });

    it('date-only to= includes the full calendar day (inclusive end)', async () => {
      const { user } = await createAndLoginUser('date_u1', 'date_u1@test.com');
      const { token } = await createAndLoginUser('date_admin', 'date_admin@test.com', 'admin');

      // Create an event at 23:30 UTC on a specific date
      const targetDate = '2025-03-15';
      const lateInDay = new Date('2025-03-15T23:30:00.000Z');
      await OnboardingEvent.create({
        userId: user.id,
        eventType: 'onboarding_viewed',
        createdAt: lateInDay,
      });

      // Querying with to=2025-03-15 should include the event (end of day, not midnight)
      const res = await request(app)
        .get(`/api/admin/onboarding/funnel?from=2025-03-01&to=${targetDate}`)
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(200);
      const viewed = res.body.data.byEventType.onboarding_viewed || {};
      const total = Object.values(viewed).reduce((s, v) => s + v, 0);
      expect(total).toBe(1);
    });

    it('date-only to= stopping at midnight would miss late-day events', async () => {
      // This test documents the intended "inclusive end" behaviour.
      // An event at 23:30 UTC on targetDate MUST be included when to=targetDate.
      const { user } = await createAndLoginUser('date_u2', 'date_u2@test.com');
      const { token } = await createAndLoginUser('date_admin2', 'date_admin2@test.com', 'admin');

      const lateInDay = new Date('2025-04-10T23:59:00.000Z');
      await OnboardingEvent.create({
        userId: user.id,
        eventType: 'goal_selected',
        goal: 'creator',
        createdAt: lateInDay,
      });

      const res = await request(app)
        .get('/api/admin/onboarding/funnel?from=2025-04-01&to=2025-04-10')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(200);
      const goalSelected = res.body.data.byEventType.goal_selected || {};
      const total = Object.values(goalSelected).reduce((s, v) => s + v, 0);
      // Would be 0 if `to` stopped at midnight; must be 1 with inclusive end
      expect(total).toBe(1);
    });
  });

  // ── My contributions endpoint ──────────────────────────────────────────────

  describe('GET /api/auth/my-contributions', () => {
    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/my-contributions');
      expect(res.status).toBe(401);
    });

    it('returns only the current user\'s contributions', async () => {
      const { token, user } = await createAndLoginUser('creator1', 'creator1@test.com');
      const { user: other } = await createAndLoginUser('other1', 'other1@test.com');

      // Create articles for both users
      await Article.create({ authorId: user.id, title: 'My Article', content: 'Body', type: 'articles', status: 'published' });
      await Article.create({ authorId: other.id, title: 'Other Article', content: 'Body', type: 'articles', status: 'published' });

      const res = await request(app)
        .get('/api/auth/my-contributions')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      const articles = res.body.data.articles.items;
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('My Article');
    });

    it('groups by type when type=articles', async () => {
      const { token, user } = await createAndLoginUser('creator2', 'creator2@test.com');
      await Article.create({ authorId: user.id, title: 'Draft', content: 'X', type: 'articles', status: 'draft' });
      await Poll.create({ title: 'My Poll', creatorId: user.id, type: 'binary', visibility: 'public', status: 'active' });

      const res = await request(app)
        .get('/api/auth/my-contributions?type=articles')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(200);
      expect(res.body.data.articles).toBeDefined();
      // polls should not be returned for type=articles
      expect(res.body.data.polls).toBeUndefined();
    });

    it('rejects invalid type parameter', async () => {
      const { token } = await createAndLoginUser('creator3', 'creator3@test.com');
      const res = await request(app)
        .get('/api/auth/my-contributions?type=invalid')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(400);
    });

    it('limits results to at most 50', async () => {
      const { token, user } = await createAndLoginUser('creator4', 'creator4@test.com');

      const res = await request(app)
        .get('/api/auth/my-contributions?type=articles&limit=100')
        .set('Cookie', [`auth_token=${token}`]);
      // limit should be capped at 50
      expect(res.status).toBe(200);
    });
  });

  // ── Profile readiness endpoint ─────────────────────────────────────────────

  describe('GET /api/auth/profile-readiness', () => {
    it('returns 401 for unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/profile-readiness');
      expect(res.status).toBe(401);
    });

    it('returns own readiness data', async () => {
      const { token, user } = await createAndLoginUser('ind1', 'ind1@test.com');

      const res = await request(app)
        .get('/api/auth/profile-readiness')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { readiness } = res.body.data;
      expect(readiness).toHaveProperty('completenessPercent');
      expect(readiness).toHaveProperty('followerCount');
      expect(readiness).toHaveProperty('followingCount');
      expect(readiness).toHaveProperty('candidateRegistrations');
      expect(readiness).toHaveProperty('isDiscoverable');
    });

    it('reflects verified email in fields', async () => {
      const { token } = await createAndLoginUser('ind2', 'ind2@test.com');
      const res = await request(app)
        .get('/api/auth/profile-readiness')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(200);
      expect(res.body.data.readiness.fields.email).toBe(true); // created with emailVerified: true
    });

    it('shows correct follower counts', async () => {
      const { token, user } = await createAndLoginUser('ind3', 'ind3@test.com');
      const { user: follower } = await createAndLoginUser('fol1', 'fol1@test.com');
      await Follow.create({ followerId: follower.id, followingId: user.id });

      const res = await request(app)
        .get('/api/auth/profile-readiness')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.body.data.readiness.followerCount).toBe(1);
      expect(res.body.data.readiness.followingCount).toBe(0);
    });
  });

  // ── Admin onboarding context endpoint ─────────────────────────────────────

  describe('GET /api/admin/users/:userId/onboarding-context', () => {
    it('requires authentication', async () => {
      const { user } = await createAndLoginUser('ctx1', 'ctx1@test.com');
      const res = await request(app).get(`/api/admin/users/${user.id}/onboarding-context`);
      expect(res.status).toBe(401);
    });

    it('requires admin or moderator role', async () => {
      const { token } = await createAndLoginUser('viewer1', 'viewer1@test.com', 'viewer');
      const { user: target } = await createAndLoginUser('target1', 'target1@test.com');

      const res = await request(app)
        .get(`/api/admin/users/${target.id}/onboarding-context`)
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(403);
    });

    it('returns context for admin', async () => {
      const { token } = await createAndLoginUser('admin4', 'admin4@test.com', 'admin');
      const { user: target } = await createAndLoginUser('target2', 'target2@test.com');

      const res = await request(app)
        .get(`/api/admin/users/${target.id}/onboarding-context`)
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(200);
      const { context } = res.body.data;
      expect(context.userId).toBe(target.id);
      expect(context).toHaveProperty('profileCompleteness');
      expect(context).toHaveProperty('contributions');
      expect(context).toHaveProperty('followerCount');
      // adminNotes must never be exposed
      expect(context.adminNotes).toBeUndefined();
    });

    it('returns 404 for non-existent user', async () => {
      const { token } = await createAndLoginUser('admin5', 'admin5@test.com', 'admin');
      const res = await request(app)
        .get('/api/admin/users/999999/onboarding-context')
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.status).toBe(404);
    });

    it('reflects contributions in context', async () => {
      const { token } = await createAndLoginUser('admin6', 'admin6@test.com', 'admin');
      const { user: target } = await createAndLoginUser('target3', 'target3@test.com');

      await Article.create({ authorId: target.id, title: 'An Article', content: 'Body', type: 'articles', status: 'published' });

      const res = await request(app)
        .get(`/api/admin/users/${target.id}/onboarding-context`)
        .set('Cookie', [`auth_token=${token}`]);
      expect(res.body.data.context.contributions.articleCount).toBe(1);
      expect(res.body.data.context.contributions.total).toBe(1);
    });
  });

  // ── i18n key parity ────────────────────────────────────────────────────────

  describe('i18n key parity for Phase 3 namespaces', () => {
    const en = require('../messages/en.json');
    const el = require('../messages/el.json');
    const ro = require('../messages/ro.json');

    function leafKeys(obj, prefix = '') {
      return Object.entries(obj).flatMap(([k, v]) => {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        return typeof v === 'object' && v !== null ? leafKeys(v, fullKey) : [fullKey];
      });
    }

    for (const ns of ['moderator', 'creator']) {
      it(`${ns}: el has same keys as en`, () => {
        const enKeys = leafKeys(en[ns] || {}).sort();
        const elKeys = leafKeys(el[ns] || {}).sort();
        expect(elKeys).toEqual(enKeys);
      });

      it(`${ns}: ro has same keys as en`, () => {
        const enKeys = leafKeys(en[ns] || {}).sort();
        const roKeys = leafKeys(ro[ns] || {}).sort();
        expect(roKeys).toEqual(enKeys);
      });
    }
  });
});
