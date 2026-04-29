/**
 * Client-side image normalization utility.
 *
 * Detects HEIC/HEIF images (by MIME type or file extension) and converts them
 * to JPEG using heic2any before upload, so the backend always receives a
 * format that sharp can decode regardless of server HEIC support.
 *
 * Non-HEIC files are returned unchanged.
 */

const HEIC_HEIF_MIMES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const HEIC_HEIF_EXT_RE = /\.(heic|heif)$/i;

/** JPEG quality used for HEIC→JPEG conversion (0–1). 0.92 balances visual fidelity and file size. */
const JPEG_CONVERSION_QUALITY = 0.92;

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

/**
 * Normalizes an image file for upload.
 *
 * - HEIC/HEIF → converted to JPEG via heic2any
 * - All other formats → returned unchanged
 *
 * @param {File} file - The original file selected by the user.
 * @returns {Promise<File>} The normalized file ready for upload.
 */
export async function normalizeUploadImage(file) {
  if (!isHeicFile(file)) return file;

  // heic2any is a browser-only library; import dynamically to avoid SSR issues.
  const heic2any = (await import('heic2any')).default;

  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_CONVERSION_QUALITY });

  // heic2any may return a single Blob or an array of Blobs (for sequences)
  const outputBlob = Array.isArray(result) ? result[0] : result;

  // Replace .heic/.heif extension with .jpg; fall back to 'photo.jpg'
  const newName = (file.name || 'photo').replace(HEIC_HEIF_EXT_RE, '') + '.jpg';

  return new File([outputBlob], newName, { type: 'image/jpeg' });
}
