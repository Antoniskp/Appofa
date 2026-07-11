'use strict';

const { Op, fn, col, where } = require('sequelize');
const { MediaAsset, User, Article } = require('../models');
const { processMediaImage } = require('./imageProcessingService');
const { saveMediaVariant, deleteMediaByStorageKey } = require('./imageStorageService');

const UPLOAD_ROLES = new Set(['admin', 'moderator', 'editor']);
const MANAGE_ALL_ROLES = new Set(['admin', 'moderator']);
const MAX_IMAGE_BYTES = Math.max(1, Number(process.env.MEDIA_MAX_FILE_BYTES || (8 * 1024 * 1024)));
const USER_QUOTA_BYTES = Math.max(MAX_IMAGE_BYTES, Number(process.env.MEDIA_USER_QUOTA_BYTES || (200 * 1024 * 1024)));

const MEDIA_USAGE_TYPES = MediaAsset.MEDIA_USAGE_TYPES || ['shared', 'article_cover', 'article_body', 'avatar'];
const MEDIA_ENTITY_TYPES = MediaAsset.MEDIA_ENTITY_TYPES || ['shared', 'article', 'avatar'];

function canUploadMedia(user) {
  return !!user && UPLOAD_ROLES.has(user.role);
}

function canManageAnyMedia(user) {
  return !!user && MANAGE_ALL_ROLES.has(user.role);
}

function normalizeOptionalText(value, maxLength) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function normalizeTags(tags) {
  if (tags === undefined || tags === null || tags === '') return [];
  const source = Array.isArray(tags) ? tags : String(tags).split(',');
  const dedup = new Set();
  for (const item of source) {
    const normalized = String(item || '').trim().toLowerCase();
    if (normalized) dedup.add(normalized.slice(0, 40));
  }
  return Array.from(dedup);
}

function normalizeUsageType(value, fallback = 'shared') {
  if (!value) return fallback;
  return MEDIA_USAGE_TYPES.includes(value) ? value : fallback;
}

function normalizeEntityType(value, fallback = 'shared') {
  if (!value) return fallback;
  return MEDIA_ENTITY_TYPES.includes(value) ? value : fallback;
}

async function getUserStorageUsage(userId) {
  const total = await MediaAsset.sum('size', {
    where: {
      uploadedByUserId: userId,
      deletedAt: null,
      status: 'active',
    },
  });
  return Number(total) || 0;
}

function serializeMediaAsset(asset) {
  const data = asset?.toJSON ? asset.toJSON() : asset;
  if (!data) return null;

  return {
    id: data.id,
    url: data.url,
    variants: data.variants || {},
    storageProvider: data.storageProvider,
    originalName: data.originalName,
    mimeType: data.mimeType,
    detectedMimeType: data.detectedMimeType,
    size: data.size,
    width: data.width,
    height: data.height,
    usageType: data.usageType,
    entityType: data.entityType,
    status: data.status,
    altText: data.altText,
    caption: data.caption,
    credit: data.credit,
    tags: data.tags || [],
    metadata: data.metadata || null,
    uploadedByUserId: data.uploadedByUserId,
    uploadedBy: data.uploadedBy || null,
    deletedAt: data.deletedAt,
    isOrphaned: Boolean(data.isOrphaned),
    orphanedAt: data.orphanedAt,
    lastReferencedAt: data.lastReferencedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function storeProcessedVariants(processed, userId, entityType) {
  const variantEntries = Object.entries(processed.variants || {});
  const variants = {};
  const storedKeys = [];

  try {
    for (const [variantName, variantData] of variantEntries) {
      const stored = await saveMediaVariant({
        buffer: variantData.buffer,
        userId,
        entityType,
        variantName,
        extension: 'webp',
      });

      storedKeys.push(stored.storageKey);
      variants[variantName] = {
        url: stored.url,
        storageKey: stored.storageKey,
        width: variantData.width,
        height: variantData.height,
        size: variantData.size,
        mimeType: variantData.mimeType,
      };
    }

    return variants;
  } catch (error) {
    for (const key of storedKeys) {
      await deleteMediaByStorageKey(key).catch(() => {});
    }
    throw error;
  }
}

async function uploadMediaAsset(file, user, metadata = {}, options = {}) {
  if (!user) {
    return { success: false, status: 401, message: 'Authentication required.' };
  }

  if (!options.allowAnyAuthenticated && !canUploadMedia(user)) {
    return { success: false, status: 403, message: 'You do not have permission to upload media.' };
  }

  if (!file || !Buffer.isBuffer(file.buffer)) {
    return { success: false, status: 400, message: 'Image file is required.' };
  }

  if (file.size > MAX_IMAGE_BYTES || file.buffer.length > MAX_IMAGE_BYTES) {
    return { success: false, status: 413, message: `Image must be ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))}MB or smaller.` };
  }

  const currentUsage = await getUserStorageUsage(user.id);

  let processed;
  try {
    processed = await processMediaImage(file.buffer, { claimedMimeType: file.mimetype });
  } catch (error) {
    const rawMessage = error.message || 'Image could not be processed.';
    const isHeicClaim = /^image\/hei[cf](-sequence)?$/i.test(file.mimetype || '');
    const isDecodeIssue = /unsupported image format|heif|input buffer/i.test(rawMessage);
    return {
      success: false,
      status: error.status || 422,
      message: (isHeicClaim && isDecodeIssue)
        ? 'HEIC/HEIF images could not be processed on this server. Please convert to JPEG, PNG, or WebP and try again.'
        : rawMessage,
    };
  }

  const usageType = normalizeUsageType(metadata.usageType, 'shared');
  const entityType = normalizeEntityType(metadata.entityType, usageType === 'avatar' ? 'avatar' : (usageType.startsWith('article') ? 'article' : 'shared'));

  const estimatedStoredBytes = Object.values(processed.variants || {}).reduce((sum, variant) => sum + (Number(variant?.size) || 0), 0);
  if ((currentUsage + estimatedStoredBytes) > USER_QUOTA_BYTES) {
    return {
      success: false,
      status: 413,
      message: 'Storage quota exceeded. Please delete unused media before uploading new files.',
      quota: { usedBytes: currentUsage, totalBytes: USER_QUOTA_BYTES },
    };
  }

  const variants = await storeProcessedVariants(processed, user.id, entityType);
  const preferredVariant = variants.articleCover || variants.avatar || variants.thumbnail || Object.values(variants)[0];
  const totalStoredSize = Object.values(variants).reduce((sum, variant) => sum + (Number(variant?.size) || 0), 0);

  const asset = await MediaAsset.create({
    storageProvider: 'local',
    storageKey: preferredVariant?.storageKey || '',
    url: preferredVariant?.url || '',
    variants,
    originalName: normalizeOptionalText(file.originalname, 255),
    mimeType: 'image/webp',
    detectedMimeType: processed.detectedMimeType,
    size: totalStoredSize || preferredVariant?.size || file.size || file.buffer.length,
    width: preferredVariant?.width || processed.originalWidth,
    height: preferredVariant?.height || processed.originalHeight,
    usageType,
    entityType,
    status: 'active',
    altText: normalizeOptionalText(metadata.altText, 255),
    caption: normalizeOptionalText(metadata.caption, 500),
    credit: normalizeOptionalText(metadata.credit, 255),
    tags: normalizeTags(metadata.tags),
    metadata: (metadata.metadata && typeof metadata.metadata === 'object') ? metadata.metadata : null,
    checksumSha256: processed.checksumSha256,
    uploadedByUserId: user.id,
  });

  return {
    success: true,
    media: serializeMediaAsset(asset),
    quota: {
      usedBytes: currentUsage + asset.size,
      totalBytes: USER_QUOTA_BYTES,
    },
  };
}

function buildListWhere(query = {}, user = null) {
  const whereClause = {
    status: 'active',
    deletedAt: null,
  };

  const canUpload = canUploadMedia(user);
  const wantsSharedLibrary = query.shared === 'true';

  if (!canManageAnyMedia(user)) {
    if (!(canUpload && wantsSharedLibrary)) {
      whereClause.uploadedByUserId = user?.id;
    }
  } else if (query.mine === 'true') {
    whereClause.uploadedByUserId = user.id;
  }

  const usageType = normalizeUsageType(query.usageType, null);
  if (usageType) whereClause.usageType = usageType;

  const entityType = normalizeEntityType(query.entityType, null);
  if (entityType) whereClause.entityType = entityType;

  return whereClause;
}

async function listMediaAssets(query = {}, user = null) {
  if (!user) {
    return { success: false, status: 401, message: 'Authentication required.' };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(query.limit, 10) || 24));

  const whereClause = buildListWhere(query, user);
  if (query.tag) {
    whereClause.tags = { [Op.like]: `%${String(query.tag).trim().toLowerCase()}%` };
  }

  if (query.search) {
    const needle = `%${String(query.search).trim().toLowerCase()}%`;
    whereClause[Op.and] = [
      {
        [Op.or]: [
          where(fn('lower', col('MediaAsset.originalName')), { [Op.like]: needle }),
          where(fn('lower', col('MediaAsset.altText')), { [Op.like]: needle }),
          where(fn('lower', col('MediaAsset.caption')), { [Op.like]: needle }),
          where(fn('lower', col('MediaAsset.credit')), { [Op.like]: needle }),
          where(fn('lower', col('MediaAsset.tags')), { [Op.like]: needle }),
        ],
      },
    ];
  }

  const { count, rows } = await MediaAsset.findAndCountAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'uploadedBy',
      attributes: ['id', 'username', 'avatar', 'avatarColor'],
      required: false,
    }],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  const usedBytes = await getUserStorageUsage(user.id);

  return {
    success: true,
    media: rows.map(serializeMediaAsset),
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
    quota: {
      usedBytes,
      totalBytes: USER_QUOTA_BYTES,
    },
  };
}

async function canAccessAsset(asset, user) {
  if (!asset || !user) return false;
  if (canManageAnyMedia(user)) return true;
  return asset.uploadedByUserId === user.id;
}

async function getMediaAssetById(id, user) {
  const asset = await MediaAsset.findByPk(id, {
    include: [{
      model: User,
      as: 'uploadedBy',
      attributes: ['id', 'username', 'avatar', 'avatarColor'],
      required: false,
    }],
  });

  if (!asset || asset.deletedAt) {
    return { success: false, status: 404, message: 'Media not found.' };
  }

  if (!(await canAccessAsset(asset, user))) {
    return { success: false, status: 403, message: 'You do not have permission to access this media.' };
  }

  return { success: true, media: serializeMediaAsset(asset) };
}

async function updateMediaAssetMetadata(id, user, payload = {}) {
  const asset = await MediaAsset.findByPk(id);
  if (!asset || asset.deletedAt) {
    return { success: false, status: 404, message: 'Media not found.' };
  }

  if (!(await canAccessAsset(asset, user))) {
    return { success: false, status: 403, message: 'You do not have permission to update this media.' };
  }

  asset.altText = normalizeOptionalText(payload.altText, 255);
  asset.caption = normalizeOptionalText(payload.caption, 500);
  asset.credit = normalizeOptionalText(payload.credit, 255);
  asset.tags = normalizeTags(payload.tags);
  if (payload.metadata === null || (payload.metadata && typeof payload.metadata === 'object')) {
    asset.metadata = payload.metadata;
  }

  await asset.save();
  return { success: true, media: serializeMediaAsset(asset) };
}

async function getAssetReferenceCount(asset) {
  const articleRefs = await Article.count({ where: { coverImageId: asset.id } });
  const variantUrls = Object.values(asset.variants || {}).map((variant) => variant?.url).filter(Boolean);
  const avatarRefs = variantUrls.length
    ? await User.count({
      where: {
        [Op.or]: [
          { avatarUrl: { [Op.in]: variantUrls } },
          { avatar: { [Op.in]: variantUrls } },
        ],
      },
    })
    : 0;

  return articleRefs + avatarRefs;
}

async function softDeleteMediaAsset(asset) {
  const variantEntries = Object.values(asset.variants || {});
  for (const variant of variantEntries) {
    if (variant?.storageKey) {
      await deleteMediaByStorageKey(variant.storageKey).catch(() => {});
    }
  }

  if (asset.storageKey) {
    await deleteMediaByStorageKey(asset.storageKey).catch(() => {});
  }

  asset.status = 'archived';
  asset.deletedAt = new Date();
  await asset.save();
}

async function deleteMediaAsset(id, user, options = {}) {
  const asset = await MediaAsset.findByPk(id);
  if (!asset || asset.deletedAt) {
    return { success: false, status: 404, message: 'Media not found.' };
  }

  if (!(await canAccessAsset(asset, user))) {
    return { success: false, status: 403, message: 'You do not have permission to delete this media.' };
  }

  const referenceCount = await getAssetReferenceCount(asset);
  if (referenceCount > 0 && !(options.force === true && canManageAnyMedia(user))) {
    return {
      success: false,
      status: 409,
      message: 'Media is currently referenced and cannot be deleted safely.',
      references: referenceCount,
    };
  }

  await softDeleteMediaAsset(asset);
  return { success: true, id: asset.id };
}

async function uploadAvatarImage(file, user, metadata = {}) {
  const result = await uploadMediaAsset(file, user, {
    ...metadata,
    usageType: 'avatar',
    entityType: 'avatar',
  }, { allowAnyAuthenticated: true });

  if (!result.success) return result;

  const avatarVariant = result.media.variants?.avatar || result.media.variants?.articleCover;
  return {
    ...result,
    avatarUrl: avatarVariant?.url || result.media.url,
  };
}

async function markOrphanMediaAssets() {
  const activeAssets = await MediaAsset.findAll({ where: { deletedAt: null, status: 'active' } });
  let orphanedCount = 0;

  for (const asset of activeAssets) {
    const references = await getAssetReferenceCount(asset);
    const isOrphaned = references === 0;
    asset.isOrphaned = isOrphaned;
    asset.orphanedAt = isOrphaned ? (asset.orphanedAt || new Date()) : null;
    asset.lastReferencedAt = !isOrphaned ? new Date() : asset.lastReferencedAt;
    await asset.save();
    if (isOrphaned) orphanedCount += 1;
  }

  return { total: activeAssets.length, orphaned: orphanedCount };
}

async function cleanupOrphanMediaAssets({ dryRun = true, olderThanDays = 14 } = {}) {
  const threshold = new Date(Date.now() - Math.max(1, Number(olderThanDays)) * 24 * 60 * 60 * 1000);
  const candidates = await MediaAsset.findAll({
    where: {
      status: 'active',
      deletedAt: null,
      isOrphaned: true,
      orphanedAt: { [Op.lte]: threshold },
    },
    order: [['orphanedAt', 'ASC']],
  });

  if (dryRun) {
    return {
      dryRun: true,
      candidates: candidates.map((asset) => ({ id: asset.id, url: asset.url, orphanedAt: asset.orphanedAt })),
    };
  }

  for (const asset of candidates) {
    await softDeleteMediaAsset(asset);
  }

  return { dryRun: false, deleted: candidates.length };
}

module.exports = {
  MAX_IMAGE_BYTES,
  USER_QUOTA_BYTES,
  canUploadMedia,
  uploadMediaAsset,
  uploadAvatarImage,
  listMediaAssets,
  getMediaAssetById,
  updateMediaAssetMetadata,
  deleteMediaAsset,
  serializeMediaAsset,
  markOrphanMediaAssets,
  cleanupOrphanMediaAssets,
};
