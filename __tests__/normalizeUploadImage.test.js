/**
 * Tests for lib/utils/normalizeUploadImage.js
 *
 * heic2any is a browser-only library; we mock the dynamic import so these
 * tests can run in the Jest Node environment.
 *
 * Browser canvas APIs (createImageBitmap / OffscreenCanvas) are NOT available
 * in Node, so the compression path gracefully falls through to the error path
 * when the file exceeds maxBytes.
 */

// --- mock heic2any before importing the module under test ---
jest.mock('heic2any', () =>
  jest.fn(async () => new Blob(['converted-jpeg'], { type: 'image/jpeg' }))
);

const { isHeicFile, normalizeUploadImage, UPLOAD_PRESETS } = require('../lib/utils/normalizeUploadImage');

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

describe('UPLOAD_PRESETS', () => {
  test('avatar preset has expected structure', () => {
    expect(UPLOAD_PRESETS.avatar).toEqual(
      expect.objectContaining({ maxBytes: expect.any(Number), maxDimension: expect.any(Number) })
    );
    // Avatar target should be under the 5 MB backend limit
    expect(UPLOAD_PRESETS.avatar.maxBytes).toBeLessThan(5 * 1024 * 1024);
    expect(UPLOAD_PRESETS.avatar.maxBytes).toBeGreaterThan(0);
  });

  test('location preset has expected structure', () => {
    expect(UPLOAD_PRESETS.location).toEqual(
      expect.objectContaining({ maxBytes: expect.any(Number), maxDimension: expect.any(Number) })
    );
    // Location target should be under the 10 MB backend limit
    expect(UPLOAD_PRESETS.location.maxBytes).toBeLessThan(10 * 1024 * 1024);
    expect(UPLOAD_PRESETS.location.maxBytes).toBeGreaterThan(UPLOAD_PRESETS.avatar.maxBytes);
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

  // ── Options / compression path ─────────────────────────────────────────────

  test('returns original file when within maxBytes limit (no canvas needed)', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 100);
    // File is 100 bytes — well under 1 MB limit
    const result = await normalizeUploadImage(file, { maxBytes: 1 * 1024 * 1024 });
    expect(result).toBe(file);
  });

  test('throws when file exceeds maxBytes and canvas is unavailable (Node env)', async () => {
    // In Node/Jest, createImageBitmap is not defined, so the compression path
    // falls back to throwing a user-friendly error.
    const file = makeFile('large.jpg', 'image/jpeg', 1000);
    await expect(normalizeUploadImage(file, { maxBytes: 100 })).rejects.toThrow(
      'Image is too large'
    );
  });

  test('error message includes the MB limit when canvas unavailable', async () => {
    const file = makeFile('big.png', 'image/png', 10 * 1024 * 1024);
    await expect(normalizeUploadImage(file, { maxBytes: 5 * 1024 * 1024 })).rejects.toThrow('5 MB');
  });

  test('HEIC file converted to small JPEG does not trigger compression error', async () => {
    // The heic2any mock returns a 13-byte blob — well under any reasonable limit.
    const file = makeFile('photo.heic', 'image/heic');
    const result = await normalizeUploadImage(file, UPLOAD_PRESETS.avatar);
    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('photo.jpg');
  });

  test('HEIC conversion + maxBytes: result is within limit', async () => {
    const heic2any = require('heic2any');
    // Mock returns 20-byte blob — under the 100-byte limit
    heic2any.mockResolvedValueOnce(new Blob(['a'.repeat(20)], { type: 'image/jpeg' }));

    const file = makeFile('img.heic', 'image/heic');
    const result = await normalizeUploadImage(file, { maxBytes: 100 });
    expect(result.type).toBe('image/jpeg');
    expect(result.size).toBeLessThanOrEqual(100);
  });

  test('HEIC conversion + exceeds maxBytes with canvas unavailable throws', async () => {
    const heic2any = require('heic2any');
    // Mock returns 200-byte blob — over the 100-byte limit
    heic2any.mockResolvedValueOnce(new Blob(['a'.repeat(200)], { type: 'image/jpeg' }));

    const file = makeFile('img.heic', 'image/heic');
    await expect(normalizeUploadImage(file, { maxBytes: 100 })).rejects.toThrow('too large');
  });

  test('normalizeUploadImage with UPLOAD_PRESETS.avatar passes for normal JPEG', async () => {
    // A 100-byte JPEG is well under the 4.5 MB avatar limit
    const file = makeFile('photo.jpg', 'image/jpeg', 100);
    const result = await normalizeUploadImage(file, UPLOAD_PRESETS.avatar);
    expect(result).toBe(file);
  });

  test('normalizeUploadImage with UPLOAD_PRESETS.location passes for normal JPEG', async () => {
    const file = makeFile('loc.jpg', 'image/jpeg', 100);
    const result = await normalizeUploadImage(file, UPLOAD_PRESETS.location);
    expect(result).toBe(file);
  });
});
