const { MediaAsset } = require('../models');

async function resolvePhotos(input, user, previous = []) {
  if (!Array.isArray(input) || input.length > 6) throw Object.assign(new Error('Attach up to six photos.'), { status: 400 });
  const photos = [];
  for (const item of input) {
    if (!item || !Number.isSafeInteger(item.id) || !['report', 'repair'].includes(item.kind) || typeof item.caption !== 'string' || item.caption.length > 300 || photos.some(photo => photo.id === item.id)) {
      throw Object.assign(new Error('Invalid photo or caption.'), { status: 400 });
    }
    const asset = await MediaAsset.findByPk(item.id);
    if (!asset || asset.status !== 'active' || asset.deletedAt || (!previous.some(photo => photo.id === item.id) && asset.uploadedByUserId !== user.id && !['admin', 'moderator'].includes(user.role))) {
      throw Object.assign(new Error('Photo unavailable or not owned by you.'), { status: 400 });
    }
    photos.push({ id: asset.id, url: asset.variants?.articleCover?.url || asset.url, kind: item.kind, caption: item.caption.trim() });
  }
  return photos;
}
module.exports = { resolvePhotos };
