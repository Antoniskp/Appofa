const express = require('express');
const request = require('supertest');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const options = require('../src/config/uploadStaticOptions');

describe('uploaded photo caching', () => {
  let root;
  let app;
  const mediaPath = '/media/2026/11/shared/1-12345678-1234-1234-1234-123456789abc-thumbnail.webp';
  beforeAll(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'appofa-photo-cache-'));
    for (const filename of ['/profiles/1.webp', '/locations/1.webp', mediaPath, '/media/2026/11/shared/legacy.webp']) {
      const target = path.join(root, filename);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, 'test-photo');
    }
    app = express();
    app.use('/uploads', express.static(root, options));
  });
  afterAll(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  test('UUID media can be reused without contacting the server', async () => {
    const response = await request(app).get(`/uploads${mediaPath}`).expect(200);
    expect(response.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(response.headers.etag).toBeTruthy();
  });

  test.each(['/profiles/1.webp', '/locations/1.webp', '/media/2026/11/shared/legacy.webp'])('%s revalidates and returns 304 when unchanged', async filename => {
    const first = await request(app).get(`/uploads${filename}`).expect(200);
    expect(first.headers['cache-control']).toBe('public, max-age=0, must-revalidate');
    await request(app).get(`/uploads${filename}`).set('If-None-Match', first.headers.etag).expect(304);
  });

  test('a replaced avatar returns new bytes instead of a stale 304', async () => {
    const first = await request(app).get('/uploads/profiles/1.webp').expect(200);
    await fs.writeFile(path.join(root, 'profiles/1.webp'), 'updated-photo-content');
    const updated = await request(app).get('/uploads/profiles/1.webp').set('If-None-Match', first.headers.etag).expect(200);
    expect(updated.headers.etag).not.toBe(first.headers.etag);
  });
});
