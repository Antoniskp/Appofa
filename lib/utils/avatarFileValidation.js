export const AVATAR_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
];

const HEIC_HEIF_EXTENSION_RE = /\.(heic|heif)$/i;

export function isAcceptedAvatarFile(file) {
  const mimeType = (file?.type || '').toLowerCase();
  if (AVATAR_ACCEPTED_TYPES.includes(mimeType)) return true;
  const hasHeicLikeExtension = HEIC_HEIF_EXTENSION_RE.test(file?.name || '');
  const isGenericMime = mimeType === '' || mimeType === 'application/octet-stream' || mimeType === 'binary/octet-stream';
  return hasHeicLikeExtension && isGenericMime;
}
