const request = require('supertest');

describe('Security Configuration Tests', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
    app = require('../src/index');
  });

  describe('Input Validation', () => {
    it('should reject invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/articles?page=invalid&limit=50');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid page parameter');
    });

    it('should reject decimal page numbers', async () => {
      const response = await request(app)
        .get('/api/articles?page=1.5&limit=10');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid page parameter');
    });

    it('should reject decimal limit values', async () => {
      const response = await request(app)
        .get('/api/articles?page=1&limit=10.7');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid limit parameter');
    });

    it('should reject zero page numbers', async () => {
      const response = await request(app)
        .get('/api/articles?page=0&limit=10');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid page parameter');
    });

    it('should reject negative page numbers', async () => {
      const response = await request(app)
        .get('/api/articles?page=-1&limit=10');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject limit over maximum', async () => {
      const response = await request(app)
        .get('/api/articles?page=1&limit=200');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid limit parameter');
    });

    it('should reject zero limit', async () => {
      const response = await request(app)
        .get('/api/articles?page=1&limit=0');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid limit parameter');
    });
  });
});




