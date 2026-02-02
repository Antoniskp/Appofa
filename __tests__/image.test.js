const request = require('supertest');
const { sequelize, User, Image } = require('../src/models');
const path = require('path');
const fs = require('fs').promises;

// Create a test app instance
const express = require('express');
const cors = require('cors');
const authRoutes = require('../src/routes/authRoutes');
const imageRoutes = require('../src/routes/imageRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);

describe('Image Management Integration Tests', () => {
  let userToken;
  let userId;
  let uploadedImageId;
  let externalImageId;
  const testImagePath = path.join(__dirname, 'test-image.jpg');

  beforeAll(async () => {
    // Connect to test database and sync models
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // Reset database for tests

    // Create a test user
    await User.create({
      username: 'testuser',
      email: 'test@test.com',
      password: 'test123',
      role: 'editor',
      firstName: 'Test',
      lastName: 'User'
    });

    const user = await User.findOne({ where: { email: 'test@test.com' } });
    userId = user?.id;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'test123'
      });

    userToken = loginResponse.body.data.token;

    // Create a simple test image (1x1 pixel red JPEG)
    const redPixelJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
      0x37, 0xFF, 0xD9
    ]);
    await fs.writeFile(testImagePath, redPixelJpeg);
  });

  afterAll(async () => {
    // Clean up test image
    try {
      await fs.unlink(testImagePath);
    } catch (error) {
      // File might not exist
    }

    // Close database connection
    await sequelize.close();
  });

  describe('Image Upload', () => {
    test('should upload an image successfully', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Test Image')
        .field('tags', JSON.stringify(['test', 'sample']))
        .attach('image', testImagePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.image).toBeDefined();
      expect(response.body.data.image.title).toBe('Test Image');
      expect(response.body.data.image.tags).toEqual(['test', 'sample']);
      expect(response.body.data.image.ownerId).toBe(userId);
      expect(response.body.data.image.isExternal).toBe(false);
      expect(response.body.data.image.url).toContain('/uploads/images/');
      expect(response.body.data.thumbnailUrl).toBeDefined();

      uploadedImageId = response.body.data.image.id;
    });

    test('should reject upload without authentication', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .attach('image', testImagePath);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Test Image');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No file uploaded');
    });
  });

  describe('External Image', () => {
    test('should add external image successfully', async () => {
      const response = await request(app)
        .post('/api/images/external')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          url: 'https://example.com/image.jpg',
          title: 'External Test Image',
          tags: ['external', 'test']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.image).toBeDefined();
      expect(response.body.data.image.url).toBe('https://example.com/image.jpg');
      expect(response.body.data.image.isExternal).toBe(true);
      expect(response.body.data.image.tags).toEqual(['external', 'test']);

      externalImageId = response.body.data.image.id;
    });

    test('should reject external image with invalid URL', async () => {
      const response = await request(app)
        .post('/api/images/external')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          url: 'not-a-valid-url',
          title: 'Invalid URL'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid URL');
    });

    test('should reject external image without URL', async () => {
      const response = await request(app)
        .post('/api/images/external')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'No URL'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Get Images', () => {
    test('should get user images', async () => {
      const response = await request(app)
        .get('/api/images/my-images')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.images).toBeDefined();
      expect(Array.isArray(response.body.data.images)).toBe(true);
      expect(response.body.data.images.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should filter images by tag', async () => {
      const response = await request(app)
        .get('/api/images/my-images?tag=test')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.images).toBeDefined();
      expect(response.body.data.images.length).toBeGreaterThan(0);
      
      // Verify all returned images have the 'test' tag
      response.body.data.images.forEach(image => {
        expect(image.tags).toContain('test');
      });
    });

    test('should get single image by ID', async () => {
      const response = await request(app)
        .get(`/api/images/${uploadedImageId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.image).toBeDefined();
      expect(response.body.data.image.id).toBe(uploadedImageId);
    });

    test('should return 404 for non-existent image', async () => {
      const response = await request(app)
        .get('/api/images/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Update Image', () => {
    test('should update image title and tags', async () => {
      const response = await request(app)
        .put(`/api/images/${uploadedImageId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
          tags: ['updated', 'new-tag']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.image.title).toBe('Updated Title');
      expect(response.body.data.image.tags).toEqual(['updated', 'new-tag']);
    });

    test('should update only title', async () => {
      const response = await request(app)
        .put(`/api/images/${uploadedImageId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Title Only Update'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.image.title).toBe('Title Only Update');
    });

    test('should update only tags', async () => {
      const response = await request(app)
        .put(`/api/images/${uploadedImageId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          tags: ['tag1', 'tag2', 'tag3']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.image.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('Search Images', () => {
    test('should search images by tag', async () => {
      const response = await request(app)
        .get('/api/images/search?tag=tag1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.images).toBeDefined();
    });

    test('should require tag parameter', async () => {
      const response = await request(app)
        .get('/api/images/search')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tag parameter is required');
    });
  });

  describe('Delete Image', () => {
    test('should delete external image', async () => {
      const response = await request(app)
        .delete(`/api/images/${externalImageId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    test('should delete uploaded image', async () => {
      const response = await request(app)
        .delete(`/api/images/${uploadedImageId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 404 when deleting non-existent image', async () => {
      const response = await request(app)
        .delete('/api/images/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
