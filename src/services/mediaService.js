'use strict';

const { Op, fn, col, where, Sequelize } = require('sequelize');
const { MediaAsset, User, Article, PollOption } = require('../models');
const { processMediaImage } = require('./imageProcessingService');
const { saveMediaVariant, deleteMediaByStorageKey, inspectMediaStorageKey } = require('./imageStorageService');

const UPLOAD_ROLES = new Set(['admin', 'moderator', 'editor']);
const MANAGE_ALL_ROLES = new Set(['admin', 'moderator']);
const MAX_IMAGE_BYTES = Math.max(1, Number(process.env.MEDIA_MAX_FILE_BYTES || (8 * 1024 * 1024)));
const USER_QUOTA_BYTES = Math.max(MAX_IMAGE_BYTES, Number(process.env.MEDIA_USER_QUOTA_BYTES || (200 * 1024 * 1024)));
const MAX_METADATA_TAGS = 20;

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

function parseTagsWithLimit(tags) {
  const normalized = normalizeTags(tags);
  return {
    tags: normalized.slice(0, MAX_METADATA_TAGS),
    exceedsLimit: normalized.length > MAX_METADATA_TAGS,
  };
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

async function getUserQuotaSnapshot(userId) {
  const usedBytes = await getUserStorageUsage(userId);
  return {
    usedBytes,
    totalBytes: USER_QUOTA_BYTES,
    remainingBytes: Math.max(0, USER_QUOTA_BYTES - usedBytes),
  };
}

function getAssetVariantRecords(asset) {
  const variants = asset?.variants || {};
  const variantEntries = Object.entries(variants).map(([name, details]) => ({
    name,
    storageKey: details?.storageKey || null,
    url: details?.url || null,
    size: Number(details?.size) || 0,
  }));

  if (!variantEntries.some((entry) => entry.storageKey === asset.storageKey) && asset.storageKey) {
    variantEntries.push({
      name: 'primary',
      storageKey: asset.storageKey,
      url: asset.url || null,
      size: Number(asset.size) || 0,
    });
  }

  return variantEntries;
}

function getAssetVariantUrls(asset) {
  return Array.from(new Set(
    getAssetVariantRecords(asset)
      .map((entry) => entry.url)
      .filter(Boolean)
      .concat(asset?.url ? [asset.url] : [])
  ));
}

async function getReferenceSummaryForAssets(assets = []) {
  const assetList = assets.filter(Boolean);
  const ids = assetList.map((asset) => Number(asset.id)).filter(Boolean);
  const summaryById = {};
  for (const id of ids) {
    summaryById[id] = {
      total: 0,
      byType: { article_cover: 0, user_avatar: 0, poll_option: 0 },
      items: [],
    };
  }

  if (ids.length === 0) return summaryById;

  const coverArticles = await Article.findAll({
    where: { coverImageId: { [Op.in]: ids } },
    attributes: ['id', 'title', 'coverImageId'],
  });
  for (const article of coverArticles) {
    const entry = summaryById[article.coverImageId];
    if (!entry) continue;
    entry.total += 1;
    entry.byType.article_cover += 1;
    entry.items.push({
      type: 'article_cover',
      id: article.id,
      label: article.title || `Article #${article.id}`,
    });
  }

  const pollOptionRefs = await PollOption.findAll({
    where: { mediaAssetId: { [Op.in]: ids } },
    attributes: ['id', 'pollId', 'text', 'mediaAssetId'],
  });
  for (const option of pollOptionRefs) {
    const entry = summaryById[option.mediaAssetId];
    if (!entry) continue;
    entry.total += 1;
    entry.byType.poll_option += 1;
    entry.items.push({
      type: 'poll_option',
      id: option.id,
      pollId: option.pollId,
      label: option.text || `Option #${option.id}`,
    });
  }

  const urlToAssetIds = new Map();
  for (const asset of assetList) {
    const urls = getAssetVariantUrls(asset);
    for (const url of urls) {
      if (!urlToAssetIds.has(url)) urlToAssetIds.set(url, new Set());
      urlToAssetIds.get(url).add(asset.id);
    }
  }

  const avatarUrls = Array.from(urlToAssetIds.keys());
  if (avatarUrls.length > 0) {
    const avatarUsers = await User.findAll({
      where: {
        [Op.or]: [
          { avatar: { [Op.in]: avatarUrls } },
          { avatarUrl: { [Op.in]: avatarUrls } },
        ],
      },
      attributes: ['id', 'username', 'avatar', 'avatarUrl'],
    });

    for (const user of avatarUsers) {
      const linkedUrls = [user.avatar, user.avatarUrl].filter(Boolean);
      const linkedAssetIds = new Set();
      for (const url of linkedUrls) {
        const candidates = urlToAssetIds.get(url);
        if (!candidates) continue;
        for (const id of candidates) linkedAssetIds.add(id);
      }
      for (const id of linkedAssetIds) {
        const entry = summaryById[id];
        if (!entry) continue;
        entry.total += 1;
        entry.byType.user_avatar += 1;
        entry.items.push({
          type: 'user_avatar',
          id: user.id,
          label: user.username || `User #${user.id}`,
        });
      }
    }
  }

  return summaryById;
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
    referenceCount: Number(data.referenceCount) || 0,
    referenceSummary: data.referenceSummary || null,
    storageStatus: data.storageStatus || null,
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
  const normalizedTags = parseTagsWithLimit(metadata.tags);
  if (normalizedTags.exceedsLimit) {
    return {
      success: false,
      status: 400,
      message: `A maximum of ${MAX_METADATA_TAGS} media tags is allowed.`,
    };
  }

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
    tags: normalizedTags.tags,
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
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 24));
  const isAdminViewer = !!user && user.role === 'admin';

  const whereClause = buildListWhere(query, user);
  if (query.tag) {
    whereClause.tags = { [Op.like]: `%${String(query.tag).trim().toLowerCase()}%` };
  }
  if (query.tags) {
    whereClause.tags = { [Op.like]: `%${String(query.tags).trim().toLowerCase()}%` };
  }

  if (query.referenced === 'true') whereClause.isOrphaned = false;
  if (query.orphaned === 'true') whereClause.isOrphaned = true;

  if (isAdminViewer && query.uploaderId) {
    const uploaderId = Number(query.uploaderId);
    if (Number.isInteger(uploaderId) && uploaderId > 0) {
      whereClause.uploadedByUserId = uploaderId;
    }
  }

  const fromDate = query.dateFrom ? new Date(query.dateFrom) : null;
  const toDate = query.dateTo ? new Date(query.dateTo) : null;
  if (fromDate && !Number.isNaN(fromDate.getTime())) {
    whereClause.createdAt = { ...(whereClause.createdAt || {}), [Op.gte]: fromDate };
  }
  if (toDate && !Number.isNaN(toDate.getTime())) {
    toDate.setUTCHours(23, 59, 59, 999);
    whereClause.createdAt = { ...(whereClause.createdAt || {}), [Op.lte]: toDate };
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

  const sortBy = ['createdAt', 'size', 'updatedAt'].includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortDir = String(query.sortDir || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const { count, rows } = await MediaAsset.findAndCountAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'uploadedBy',
      attributes: ['id', 'username', 'avatar', 'avatarColor'],
      required: false,
    }],
    order: [[sortBy, sortDir], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  const referenceSummaryById = await getReferenceSummaryForAssets(rows);
  const serialized = rows.map((asset) => {
    const summary = referenceSummaryById[asset.id] || { total: 0, byType: {}, items: [] };
    const item = serializeMediaAsset(asset);
    item.referenceCount = summary.total;
    item.referenceSummary = summary.byType;
    return item;
  });
  const quota = await getUserQuotaSnapshot(user.id);

  return {
    success: true,
    media: serialized,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
    quota,
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

  const referenceSummaryById = await getReferenceSummaryForAssets([asset]);
  const summary = referenceSummaryById[asset.id] || { total: 0, byType: {}, items: [] };
  const serialized = serializeMediaAsset(asset);
  serialized.referenceCount = summary.total;
  serialized.referenceSummary = summary.byType;
  if (canManageAnyMedia(user)) {
    serialized.references = summary.items;
  }
  return { success: true, media: serialized };
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
  const normalizedTags = parseTagsWithLimit(payload.tags);
  if (normalizedTags.exceedsLimit) {
    return {
      success: false,
      status: 400,
      message: `A maximum of ${MAX_METADATA_TAGS} media tags is allowed.`,
    };
  }
  asset.tags = normalizedTags.tags;
  if (payload.metadata === null || (payload.metadata && typeof payload.metadata === 'object')) {
    asset.metadata = payload.metadata;
  }

  await asset.save();
  return { success: true, media: serializeMediaAsset(asset) };
}

async function getAssetReferenceCount(asset) {
  const summaryById = await getReferenceSummaryForAssets([asset]);
  return summaryById[asset.id]?.total || 0;
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

  const referenceSummaryById = await getReferenceSummaryForAssets([asset]);
  const summary = referenceSummaryById[asset.id] || { total: 0, byType: {}, items: [] };
  const referenceCount = summary.total;
  if (referenceCount > 0) {
    return {
      success: false,
      status: 409,
      message: 'Referenced media cannot be force-deleted. Detach references first to avoid broken content.',
      references: referenceCount,
      referenceSummary: summary.byType,
      blockers: summary.items,
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
  const referenceSummaryById = await getReferenceSummaryForAssets(activeAssets);
  let orphanedCount = 0;

  for (const asset of activeAssets) {
    const references = referenceSummaryById[asset.id]?.total || 0;
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

  const reportCandidates = [];
  for (const asset of candidates) {
    const variants = getAssetVariantRecords(asset);
    const files = await Promise.all(
      variants
        .filter((variant) => variant.storageKey)
        .map(async (variant) => ({
          variant: variant.name,
          storageKey: variant.storageKey,
          ...(await inspectMediaStorageKey(variant.storageKey)),
        }))
    );
    reportCandidates.push({
      id: asset.id,
      url: asset.url,
      orphanedAt: asset.orphanedAt,
      fileStatus: files,
    });
  }

  if (dryRun) {
    return { dryRun: true, candidates: reportCandidates };
  }

  for (const asset of candidates) {
    await softDeleteMediaAsset(asset);
  }

  return { dryRun: false, deleted: candidates.length, candidates: reportCandidates };
}

async function getAdminMediaStats(user) {
  if (!user) return { success: false, status: 401, message: 'Authentication required.' };
  if (user.role !== 'admin') return { success: false, status: 403, message: 'Admin access required.' };

  const whereActive = { status: 'active', deletedAt: null };
  const [totalCount, totalBytes, orphanCount, orphanBytes] = await Promise.all([
    MediaAsset.count({ where: whereActive }),
    MediaAsset.sum('size', { where: whereActive }),
    MediaAsset.count({ where: { ...whereActive, isOrphaned: true } }),
    MediaAsset.sum('size', { where: { ...whereActive, isOrphaned: true } }),
  ]);

  const topAssets = await MediaAsset.findAll({
    where: whereActive,
    attributes: ['id', 'url', 'size', 'createdAt', 'uploadedByUserId', 'usageType', 'entityType', 'originalName'],
    include: [{ model: User, as: 'uploadedBy', attributes: ['id', 'username'], required: false }],
    order: [['size', 'DESC'], ['id', 'ASC']],
    limit: 5,
  });

  const topUploadersRaw = await MediaAsset.findAll({
    where: whereActive,
    attributes: [
      'uploadedByUserId',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'assetCount'],
      [Sequelize.fn('SUM', Sequelize.col('size')), 'totalBytes'],
    ],
    group: ['uploadedByUserId'],
    order: [[Sequelize.literal('totalBytes'), 'DESC']],
    limit: 10,
    raw: true,
  });

  const uploaderIds = topUploadersRaw.map((row) => row.uploadedByUserId);
  const uploaders = uploaderIds.length
    ? await User.findAll({ where: { id: { [Op.in]: uploaderIds } }, attributes: ['id', 'username'], raw: true })
    : [];
  const userById = new Map(uploaders.map((u) => [u.id, u]));

  return {
    success: true,
    stats: {
      totalAssetCount: totalCount,
      totalStoredBytes: Number(totalBytes) || 0,
      orphanedAssetCount: orphanCount,
      orphanedStoredBytes: Number(orphanBytes) || 0,
      quotaConfig: {
        maxFileBytes: MAX_IMAGE_BYTES,
        userQuotaBytes: USER_QUOTA_BYTES,
      },
      largestAssets: topAssets.map((asset) => serializeMediaAsset(asset)),
      largestUploaders: topUploadersRaw.map((row) => ({
        userId: row.uploadedByUserId,
        username: userById.get(row.uploadedByUserId)?.username || null,
        assetCount: Number(row.assetCount) || 0,
        totalBytes: Number(row.totalBytes) || 0,
      })),
    },
  };
}

async function getAdminCleanupReport(user, query = {}) {
  if (!user) return { success: false, status: 401, message: 'Authentication required.' };
  if (user.role !== 'admin') return { success: false, status: 403, message: 'Admin access required.' };
  const olderThanDays = Math.max(1, parseInt(query.olderThanDays, 10) || 14);
  const markResult = await markOrphanMediaAssets();
  const cleanupResult = await cleanupOrphanMediaAssets({ dryRun: true, olderThanDays });
  return { success: true, report: { marked: markResult, cleanup: cleanupResult } };
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
  getUserQuotaSnapshot,
  getReferenceSummaryForAssets,
  getAdminMediaStats,
  getAdminCleanupReport,
  markOrphanMediaAssets,
  cleanupOrphanMediaAssets,
};
