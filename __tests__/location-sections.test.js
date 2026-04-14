const request = require('supertest');
const app = require('../src/index');
const { sequelize, User, Location, LocationSection } = require('../src/models');
const { validateContent, isValidHttpsUrl } = require('../src/controllers/locationSectionController');

describe('Location Sections', () => {
  let adminToken;
  let moderatorToken;
  let editorToken;
  let testLocation;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test users
    await User.create({ username: 'admin', email: 'admin@test.com', password: 'password123', role: 'admin' });
    await User.create({ username: 'moderator', email: 'mod@test.com', password: 'password123', role: 'moderator' });
    await User.create({ username: 'editor', email: 'editor@test.com', password: 'password123', role: 'editor' });

    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.headers['set-cookie'].find(c => c.startsWith('auth_token=')).split(';')[0].replace('auth_token=', '');

    const modLogin = await request(app).post('/api/auth/login').send({ email: 'mod@test.com', password: 'password123' });
    moderatorToken = modLogin.headers['set-cookie'].find(c => c.startsWith('auth_token=')).split(';')[0].replace('auth_token=', '');

    const editorLogin = await request(app).post('/api/auth/login').send({ email: 'editor@test.com', password: 'password123' });
    editorToken = editorLogin.headers['set-cookie'].find(c => c.startsWith('auth_token=')).split(';')[0].replace('auth_token=', '');

    // Create a test location
    testLocation = await Location.create({
      name: 'Test Country',
      type: 'country',
      slug: 'country-test-country'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ---------------------------------------------------------------------------
  // Unit: validateContent
  // ---------------------------------------------------------------------------
  describe('validateContent()', () => {
    describe('official_links', () => {
      it('accepts valid content', () => {
        expect(validateContent('official_links', { links: [{ label: 'Site', url: 'https://example.com' }] })).toBeNull();
      });
      it('rejects missing links array', () => {
        expect(validateContent('official_links', {})).not.toBeNull();
      });
      it('rejects non-https URL', () => {
        expect(validateContent('official_links', { links: [{ label: 'Site', url: 'http://example.com' }] })).not.toBeNull();
      });
      it('rejects missing label', () => {
        expect(validateContent('official_links', { links: [{ url: 'https://example.com' }] })).not.toBeNull();
      });
    });

    describe('contacts', () => {
      it('accepts valid content with phones and emails', () => {
        expect(validateContent('contacts', {
          phones: [{ label: 'Town hall', value: '+30210000000' }],
          emails: [{ label: 'Info', value: 'info@example.com' }]
        })).toBeNull();
      });
      it('accepts empty phones and emails', () => {
        expect(validateContent('contacts', { phones: [], emails: [] })).toBeNull();
      });
      it('rejects phones that are not arrays', () => {
        expect(validateContent('contacts', { phones: 'not-array', emails: [] })).not.toBeNull();
      });
    });

    describe('webcams', () => {
      it('accepts valid webcam with explicit embedType', () => {
        expect(validateContent('webcams', {
          webcams: [{ label: 'Main cam', url: 'https://cam.example.com', embedType: 'image' }]
        })).toBeNull();
      });
      it('accepts webcam without embedType (auto-detected)', () => {
        expect(validateContent('webcams', {
          webcams: [{ label: 'Main cam', url: 'https://cam.example.com/stream' }]
        })).toBeNull();
      });
      it('auto-detects image embedType for .jpg URL', () => {
        const content = { webcams: [{ label: 'Still', url: 'https://cam.example.com/still.jpg' }] };
        validateContent('webcams', content);
        expect(content.webcams[0].embedType).toBe('image');
      });
      it('auto-detects image embedType for .png URL with query string', () => {
        const content = { webcams: [{ label: 'Still', url: 'https://cam.example.com/still.png?t=1234' }] };
        validateContent('webcams', content);
        expect(content.webcams[0].embedType).toBe('image');
      });
      it('defaults embedType to link for non-image URLs', () => {
        const content = { webcams: [{ label: 'Stream', url: 'https://cam.example.com/stream' }] };
        validateContent('webcams', content);
        expect(content.webcams[0].embedType).toBe('link');
      });
      it('preserves explicit iframe embedType', () => {
        const content = { webcams: [{ label: 'Embed', url: 'https://cam.example.com/stream', embedType: 'iframe' }] };
        validateContent('webcams', content);
        expect(content.webcams[0].embedType).toBe('iframe');
      });
      it('rejects invalid embedType', () => {
        expect(validateContent('webcams', {
          webcams: [{ label: 'Cam', url: 'https://cam.example.com', embedType: 'invalid' }]
        })).not.toBeNull();
      });
      it('rejects http URL', () => {
        expect(validateContent('webcams', {
          webcams: [{ label: 'Cam', url: 'http://cam.example.com' }]
        })).not.toBeNull();
      });
    });

    describe('announcements', () => {
      it('accepts valid announcement', () => {
        expect(validateContent('announcements', {
          items: [{ title: 'Road closure', body: 'Until further notice', startsAt: '2025-01-01', endsAt: '2025-12-31', priority: 3 }]
        })).toBeNull();
      });
      it('rejects missing title', () => {
        expect(validateContent('announcements', { items: [{ body: 'no title' }] })).not.toBeNull();
      });
      it('rejects invalid startsAt date', () => {
        expect(validateContent('announcements', { items: [{ title: 'Test', startsAt: 'not-a-date' }] })).not.toBeNull();
      });
      it('rejects non-https linkUrl', () => {
        expect(validateContent('announcements', { items: [{ title: 'Test', linkUrl: 'http://bad.com' }] })).not.toBeNull();
      });
    });

    describe('news_sources', () => {
      it('accepts valid sources', () => {
        expect(validateContent('news_sources', {
          sources: [{ name: 'Εφημερίδα Θεσσαλίας', url: 'https://e-thessalia.gr' }]
        })).toBeNull();
      });
      it('rejects missing sources array', () => {
        expect(validateContent('news_sources', {})).not.toBeNull();
      });
      it('rejects empty sources array', () => {
        expect(validateContent('news_sources', { sources: [] })).not.toBeNull();
      });
      it('rejects missing name', () => {
        expect(validateContent('news_sources', { sources: [{ url: 'https://example.com' }] })).not.toBeNull();
      });
      it('rejects missing url', () => {
        expect(validateContent('news_sources', { sources: [{ name: 'Test' }] })).not.toBeNull();
      });
      it('rejects non-https URL', () => {
        expect(validateContent('news_sources', { sources: [{ name: 'Test', url: 'http://example.com' }] })).not.toBeNull();
      });
    });

    it('rejects unknown section type', () => {
      expect(validateContent('unknown_type', {})).not.toBeNull();
    });

    it('rejects non-object content', () => {
      expect(validateContent('official_links', 'string')).not.toBeNull();
      expect(validateContent('official_links', null)).not.toBeNull();
      expect(validateContent('official_links', [])).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Unit: isValidHttpsUrl
  // ---------------------------------------------------------------------------
  describe('isValidHttpsUrl()', () => {
    it('returns true for https URL', () => expect(isValidHttpsUrl('https://example.com')).toBe(true));
    it('returns false for http URL', () => expect(isValidHttpsUrl('http://example.com')).toBe(false));
    it('returns false for non-URL string', () => expect(isValidHttpsUrl('not-a-url')).toBe(false));
    it('returns true for empty/null', () => {
      expect(isValidHttpsUrl('')).toBe(true);
      expect(isValidHttpsUrl(null)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // API: Authorization
  // ---------------------------------------------------------------------------
  describe('Authorization', () => {
    it('GET sections - public access (no auth)', async () => {
      const res = await request(app)
        .get(`/api/locations/${testLocation.id}/sections`)
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.sections)).toBe(true);
    });

    it('POST sections - rejected for unauthenticated', async () => {
      await request(app)
        .post(`/api/locations/${testLocation.id}/sections`)
        .send({ type: 'official_links', content: { links: [] } })
        .expect(401);
    });

    it('POST sections - rejected for editor role', async () => {
      await request(app)
        .post(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${editorToken}`)
        .send({ type: 'official_links', content: { links: [] } })
        .expect(403);
    });

    it('POST sections - allowed for admin', async () => {
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ type: 'official_links', content: { links: [{ label: 'Gov', url: 'https://gov.example.com' }] }, isPublished: true })
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.section.type).toBe('official_links');
    });

    it('POST sections - allowed for moderator', async () => {
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${moderatorToken}`)
        .send({ type: 'contacts', content: { phones: [{ label: 'City hall', value: '+30210000' }], emails: [] }, isPublished: false })
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.section.type).toBe('contacts');
    });
  });

  // ---------------------------------------------------------------------------
  // API: CRUD
  // ---------------------------------------------------------------------------
  describe('CRUD operations', () => {
    let sectionId;

    it('creates a webcams section', async () => {
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          type: 'webcams',
          content: { webcams: [{ label: 'Town square', url: 'https://cam.example.com/stream' }] },
          isPublished: true
        })
        .expect(201);
      sectionId = res.body.section.id;
      expect(res.body.section.type).toBe('webcams');
      expect(res.body.section.content.webcams[0].label).toBe('Town square');
    });

    it('creates a news_sources section', async () => {
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          type: 'news_sources',
          content: { sources: [{ name: 'Εφημερίδα Θεσσαλίας', url: 'https://e-thessalia.gr' }] },
          isPublished: true
        })
        .expect(201);
      expect(res.body.success).toBe(true);
      expect(res.body.section.type).toBe('news_sources');
      expect(res.body.section.content.sources[0].name).toBe('Εφημερίδα Θεσσαλίας');
    });

    it('merges into existing news_sources section instead of creating a duplicate', async () => {
      // A news_sources section already exists from the previous test; posting again should merge
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          type: 'news_sources',
          content: { sources: [{ name: 'Ταχυδρόμος', url: 'https://taxydromos.gr' }] },
          isPublished: true
        })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.section.type).toBe('news_sources');
      // Both sources should be present in the merged section
      const names = res.body.section.content.sources.map(s => s.name);
      expect(names).toContain('Εφημερίδα Θεσσαλίας');
      expect(names).toContain('Ταχυδρόμος');
      // Only one news_sources section should exist for this location
      const listRes = await request(app)
        .get(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${adminToken}`)
        .expect(200);
      const newsSections = listRes.body.sections.filter(s => s.type === 'news_sources');
      expect(newsSections.length).toBe(1);
    });

    it('rejects invalid content', async () => {
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          type: 'official_links',
          content: { links: [{ label: 'Site', url: 'http://not-https.com' }] }
        })
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid section type', async () => {
      const res = await request(app)
        .post(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ type: 'invalid_type', content: {} })
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('updates a section', async () => {
      const res = await request(app)
        .put(`/api/locations/${testLocation.id}/sections/${sectionId}`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({ title: 'Key People', isPublished: true })
        .expect(200);
      expect(res.body.section.title).toBe('Key People');
    });

    it('GET sections - public sees only published', async () => {
      const res = await request(app)
        .get(`/api/locations/${testLocation.id}/sections`)
        .expect(200);
      expect(res.body.success).toBe(true);
      // All returned sections should be published (public access)
      res.body.sections.forEach(s => expect(s.isPublished).toBe(true));
    });

    it('GET sections - moderator sees all (including drafts)', async () => {
      // The contacts section was created as draft
      const res = await request(app)
        .get(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${moderatorToken}`)
        .expect(200);
      expect(res.body.success).toBe(true);
      // Should include draft sections
      const hasDraft = res.body.sections.some(s => !s.isPublished);
      expect(hasDraft).toBe(true);
    });

    it('reorders sections', async () => {
      // Get current sections
      const listRes = await request(app)
        .get(`/api/locations/${testLocation.id}/sections`)
        .set('Cookie', `auth_token=${adminToken}`)
        .expect(200);
      const ids = listRes.body.sections.map(s => s.id);

      if (ids.length >= 2) {
        const order = ids.map((id, i) => ({ id, sortOrder: ids.length - 1 - i })); // Reverse
        const res = await request(app)
          .put(`/api/locations/${testLocation.id}/sections/reorder`)
          .set('Cookie', `auth_token=${adminToken}`)
          .send({ order })
          .expect(200);
        expect(res.body.success).toBe(true);
      }
    });

    it('deletes a section', async () => {
      const res = await request(app)
        .delete(`/api/locations/${testLocation.id}/sections/${sectionId}`)
        .set('Cookie', `auth_token=${adminToken}`)
        .expect(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent location', async () => {
      await request(app)
        .get(`/api/locations/99999/sections`)
        .expect(404);
    });

    it('returns 404 when deleting non-existent section', async () => {
      await request(app)
        .delete(`/api/locations/${testLocation.id}/sections/99999`)
        .set('Cookie', `auth_token=${adminToken}`)
        .expect(404);
    });
  });
});
