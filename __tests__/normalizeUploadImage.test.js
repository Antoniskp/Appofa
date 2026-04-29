/**
 * Tests for lib/utils/normalizeUploadImage.js
 *
 * heic2any is a browser-only library; we mock the dynamic import so these
 * tests can run in the Jest Node environment.
 */

// --- mock heic2any before importing the module under test ---
jest.mock('heic2any', () =>
  jest.fn(async () => new Blob(['converted-jpeg'], { type: 'image/jpeg' }))
);

const { isHeicFile, normalizeUploadImage } = require('../lib/utils/normalizeUploadImage');

// Helper: create a minimal File-like object
function makeFile(name, type, size = 100) {
  const buf = Buffer.alloc(size);
  const f = new File([buf], name, { type });
  return f;
}

describe('isHeicFile', () => {
  test('returns true for image/heic MIME type', () => {
    expect(isHeicFile(makeFile('photo.jpg', 'image/heic'))).toBe(true);
  });

  test('returns true for image/heif MIME type', () => {
    expect(isHeicFile(makeFile('photo.jpg', 'image/heif'))).toBe(true);
  });

  test('returns true for image/heic-sequence MIME type', () => {
    expect(isHeicFile(makeFile('photo.jpg', 'image/heic-sequence'))).toBe(true);
  });

  test('returns true for image/heif-sequence MIME type', () => {
    expect(isHeicFile(makeFile('photo.jpg', 'image/heif-sequence'))).toBe(true);
  });

  test('returns true for .heic extension with generic MIME', () => {
    expect(isHeicFile(makeFile('photo.heic', 'application/octet-stream'))).toBe(true);
  });

  test('returns true for .heif extension with empty MIME', () => {
    expect(isHeicFile(makeFile('photo.heif', ''))).toBe(true);
  });

  test('returns false for JPEG', () => {
    expect(isHeicFile(makeFile('photo.jpg', 'image/jpeg'))).toBe(false);
  });

  test('returns false for PNG', () => {
    expect(isHeicFile(makeFile('photo.png', 'image/png'))).toBe(false);
  });

  test('returns false for WebP', () => {
    expect(isHeicFile(makeFile('photo.webp', 'image/webp'))).toBe(false);
  });

  test('returns false for null/undefined', () => {
    expect(isHeicFile(null)).toBe(false);
    expect(isHeicFile(undefined)).toBe(false);
  });

  test('returns false for .heic extension with non-generic MIME (e.g. image/jpeg)', () => {
    // If browser correctly sends a non-generic MIME but wrong extension, trust the MIME
    expect(isHeicFile(makeFile('photo.heic', 'image/jpeg'))).toBe(false);
  });
});

describe('normalizeUploadImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns JPEG file unchanged', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg');
    const result = await normalizeUploadImage(file);
    expect(result).toBe(file); // same reference
  });

  test('returns PNG file unchanged', async () => {
    const file = makeFile('photo.png', 'image/png');
    const result = await normalizeUploadImage(file);
    expect(result).toBe(file);
  });

  test('converts HEIC file to JPEG', async () => {
    const file = makeFile('photo.heic', 'image/heic');
    const result = await normalizeUploadImage(file);

    expect(result).not.toBe(file);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
  });

  test('converts HEIF file to JPEG', async () => {
    const file = makeFile('photo.heif', 'image/heif');
    const result = await normalizeUploadImage(file);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
  });

  test('converts HEIC with generic MIME to JPEG', async () => {
    const file = makeFile('IMG_1234.heic', 'application/octet-stream');
    const result = await normalizeUploadImage(file);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('IMG_1234.jpg');
  });

  test('handles heic2any returning an array of Blobs', async () => {
    const heic2any = require('heic2any');
    heic2any.mockResolvedValueOnce([
      new Blob(['frame1'], { type: 'image/jpeg' }),
      new Blob(['frame2'], { type: 'image/jpeg' }),
    ]);

    const file = makeFile('burst.heic', 'image/heic');
    const result = await normalizeUploadImage(file);

    // Should pick first frame
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('burst.jpg');
  });

  test('preserves filename base when extension is HEIC', async () => {
    const file = makeFile('vacation_2024.heic', 'image/heic');
    const result = await normalizeUploadImage(file);
    expect(result.name).toBe('vacation_2024.jpg');
  });
});
