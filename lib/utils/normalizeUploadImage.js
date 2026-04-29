/**
 * Client-side image normalization utility.
 *
 * 1. Detects HEIC/HEIF images and converts them to JPEG via heic2any.
 * 2. Resizes and compresses the image to stay within a byte/dimension limit
 *    using the browser's OffscreenCanvas / canvas API.
 *
 * Non-HEIC files below the size limit are returned unchanged.
 */

const HEIC_HEIF_MIMES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const HEIC_HEIF_EXT_RE = /\.(heic|heif)$/i;

/** JPEG quality used for the initial HEIC→JPEG conversion step. */
const HEIC_INITIAL_QUALITY = 0.85;

/**
 * Quality levels tried during iterative compression (high → low).
 * The first level that produces a file within the byte limit is used.
 */
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52, 0.42];

/**
 * Minimum canvas dimension used in the dimension-halving safety-net pass.
 * Prevents pathological shrinking below a usable resolution.
 */
const MIN_DIMENSION = 256;

/**
 * Pre-configured upload presets that match the backend multer limits with a
 * small safety margin to avoid 413 errors.
 *
 * avatar/person-photo: 10 MB backend limit → aggressive 768 px / 4.5 MB target
 * so that iPhone HEIC conversions are kept well under the limit.
 *
 * location: 10 MB backend limit → 1920 px / 9 MB target.
 */
export const UPLOAD_PRESETS = {
  /** Avatar / unclaimed person photo: 10 MB backend limit → target ≤ 4.5 MB, max 768 px. */
  avatar: { maxBytes: Math.floor(4.5 * 1024 * 1024), maxDimension: 768 },
  /** Location image: 10 MB backend limit → target ≤ 9 MB. */
  location: { maxBytes: Math.floor(9 * 1024 * 1024), maxDimension: 1920 },
};

/** Sentinel value used when no maxDimension limit is needed during compression. */
const NO_DIM_LIMIT = 9999;

/**
 * Returns true if the file is HEIC/HEIF (by MIME type or extension).
 * Also handles the case where browsers report an empty/generic MIME for HEIC.
 *
 * @param {File} file
 * @returns {boolean}
 */
export function isHeicFile(file) {
  const mime = (file?.type || '').toLowerCase();
  if (HEIC_HEIF_MIMES.has(mime)) return true;
  const isGenericMime =
    mime === '' ||
    mime === 'application/octet-stream' ||
    mime === 'binary/octet-stream';
  return isGenericMime && HEIC_HEIF_EXT_RE.test(file?.name || '');
}

/** Returns true when browser canvas APIs needed for resize/compress are available. */
function canvasAvailable() {
  return (
    typeof createImageBitmap === 'function' &&
    (typeof OffscreenCanvas === 'function' || typeof document !== 'undefined')
  );
}

/**
 * Draws `blob` onto a canvas of size `w×h` and encodes it as JPEG.
 * Returns a Promise<Blob>.
 *
 * @param {Blob} blob   - Source image blob (any format createImageBitmap accepts).
 * @param {number} w    - Target canvas width in pixels.
 * @param {number} h    - Target canvas height in pixels.
 * @param {number} q    - JPEG quality in the range [0, 1].
 * @returns {Promise<Blob>}
 */
async function drawAndEncode(blob, w, h, q) {
  const bmp = await createImageBitmap(blob);
  let canvas;
  if (typeof OffscreenCanvas === 'function') {
    canvas = new OffscreenCanvas(w, h);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, w, h);
  if (typeof bmp.close === 'function') bmp.close();
  if (typeof OffscreenCanvas === 'function') {
    return canvas.convertToBlob({ type: 'image/jpeg', quality: q });
  }
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));
}

/**
 * Resizes a blob to ≤ maxDimension on its longest edge and compresses it to
 * JPEG until the result is ≤ maxBytes.  Returns the compressed Blob.
 *
 * Two compression passes are tried:
 *   1. Quality sweep at the target dimensions (as constrained by maxDimension).
 *   2. Dimension-halving safety-net: if quality sweep still exceeds maxBytes,
 *      halve the dimensions (down to MIN_DIMENSION) and sweep quality again.
 *
 * Must only be called when canvasAvailable() is true.
 *
 * @param {Blob} blob
 * @param {{ maxDimension: number, maxBytes: number|null }} opts
 * @returns {Promise<Blob>}
 */
async function resizeAndCompress(blob, { maxDimension, maxBytes }) {
  const bitmap = await createImageBitmap(blob);
  let { width, height } = bitmap;
  if (typeof bitmap.close === 'function') bitmap.close();

  if (maxDimension && (width > maxDimension || height > maxDimension)) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Pass 1: quality sweep at target dimensions.
  for (const quality of QUALITY_STEPS) {
    const out = await drawAndEncode(blob, width, height, quality);
    if (!maxBytes || out.size <= maxBytes) return out;
  }

  // Pass 2: dimension-halving safety-net.
  const hw = Math.max(MIN_DIMENSION, Math.round(width / 2));
  const hh = Math.max(MIN_DIMENSION, Math.round(height / 2));
  for (const quality of QUALITY_STEPS) {
    const out = await drawAndEncode(blob, hw, hh, quality);
    if (!maxBytes || out.size <= maxBytes) return out;
  }

  // Return the absolute minimum; caller checks size and throws if still over.
  return drawAndEncode(blob, hw, hh, QUALITY_STEPS[QUALITY_STEPS.length - 1]);
}

/**
 * Normalizes an image file for upload:
 * 1. Converts HEIC/HEIF to JPEG.
 * 2. Resizes + compresses the image so its byte size stays within options.maxBytes.
 *
 * If the image cannot be compressed below options.maxBytes, an error is thrown
 * with a user-friendly message (caller should display it and abort the upload).
 *
 * @param {File} file - The original file selected by the user.
 * @param {{ maxBytes?: number, maxDimension?: number }} [options]
 *   - maxBytes: hard byte limit; file is compressed until it fits.
 *   - maxDimension: maximum width/height in pixels applied during compression.
 * @returns {Promise<File>} The normalized file ready for upload.
 */
export async function normalizeUploadImage(file, options = {}) {
  const { maxBytes, maxDimension } = options;
  let workingBlob = file;
  let fileName = file.name || 'photo';
  let mimeType = file.type || 'image/jpeg';
  let wasModified = false;

  // ── Step 1: Convert HEIC/HEIF → JPEG ──────────────────────────────────────
  if (isHeicFile(file)) {
    // heic2any is browser-only; import dynamically to avoid SSR issues.
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: HEIC_INITIAL_QUALITY,
    });
    // heic2any may return a single Blob or an array (for burst/sequences)
    workingBlob = Array.isArray(result) ? result[0] : result;
    fileName = fileName.replace(HEIC_HEIF_EXT_RE, '') + '.jpg';
    mimeType = 'image/jpeg';
    wasModified = true;
  }

  // ── Step 2: Compress/resize ───────────────────────────────────────────────
  // Run resize/compress when:
  //   a) File was converted from HEIC — always scale the converted JPEG down to
  //      maxDimension (if specified) so full-resolution iPhone photos are never
  //      uploaded as oversized JPEG blobs even when byte size looks OK; OR
  //   b) File exceeds maxBytes.
  const sizeExceedsLimit = maxBytes != null && workingBlob.size > maxBytes;
  const shouldResize = (wasModified && maxDimension != null) || sizeExceedsLimit;

  if (shouldResize) {
    if (!canvasAvailable()) {
      // Canvas APIs unavailable (e.g. older browser). Only fail if over limit.
      if (sizeExceedsLimit) {
        const limitMB = (maxBytes / (1024 * 1024)).toFixed(0);
        throw new Error(`Image is too large. Please choose a photo under ${limitMB} MB.`);
      }
      // File is within byte limit even without resize — proceed as-is.
    } else {
      const compressed = await resizeAndCompress(workingBlob, {
        maxDimension: maxDimension ?? NO_DIM_LIMIT,
        maxBytes,
      });

      if (maxBytes != null && compressed.size > maxBytes) {
        const limitMB = (maxBytes / (1024 * 1024)).toFixed(0);
        throw new Error(
          `Image is too large after compression. Please choose a smaller photo (max ${limitMB} MB).`
        );
      }

      workingBlob = compressed;
      mimeType = 'image/jpeg';
      if (!fileName.match(/\.(jpg|jpeg)$/i)) {
        fileName = fileName.replace(/\.[^.]+$/, '') + '.jpg';
      }
      wasModified = true;
    }
  }

  if (!wasModified) return file;

  return new File([workingBlob], fileName, { type: mimeType });
}
