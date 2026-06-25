'use strict';

const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { MediaAsset, User } = require('../models');
const { getStorageAdapter } = require('./storage');

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const UPLOAD_ROLES = new Set(['admin', 'moderator', 'editor']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const OUTPUT_MIME_TYPE = 'image/webp';
const OUTPUT_EXTENSION = 'webp';
const MEDIA_USAGE_TYPES = MediaAsset.MEDIA_USAGE_TYPES || ['shared', 'article_banner', 'article_body'];

function canManageMedia(user) {
  return !!user && UPLOAD_ROLES.has(user.role);
}

function normalizeOptionalText(value, maxLength) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function normalizeUsageType(value, fallback = 'shared') {
  if (!value) return fallback;
  return MEDIA_USAGE_TYPES.includes(value) ? value : fallback;
}

function buildStorageKey(userId) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const id = crypto.randomUUID();
  return path.posix.join('media', year, month, `${userId}-${id}.${OUTPUT_EXTENSION}`);
}

function serializeMediaAsset(asset) {
  const data = asset?.toJSON ? asset.toJSON() : asset;
  if (!data) return null;

  return {
    id: data.id,
    url: data.url,
    storageProvider: data.storageProvider,
    storageKey: data.storageKey,
    originalName: data.originalName,
    mimeType: data.mimeType,
    size: data.size,
    width: data.width,
    height: data.height,
    usageType: data.usageType,
    status: data.status,
    altText: data.altText,
    credit: data.credit,
    uploadedByUserId: data.uploadedByUserId,
    uploadedBy: data.uploadedBy || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function processImage(file) {
  if (!file) {
    return { success: false, status: 400, message: 'Image file is required.' };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    return { success: false, status: 400, message: 'Only JPEG, PNG, and WebP images are supported.' };
  }

  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    return { success: false, status: 400, message: 'Uploaded image is empty.' };
  }

  if (file.size > MAX_IMAGE_BYTES || file.buffer.length > MAX_IMAGE_BYTES) {
    return { success: false, status: 400, message: 'Image must be 8MB or smaller.' };
  }

  try {
    const output = await sharp(file.buffer, { limitInputPixels: 24000000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    return {
      success: true,
      buffer: output.data,
      width: output.info.width,
      height: output.info.height,
      size: output.data.length,
      mimeType: OUTPUT_MIME_TYPE,
    };
  } catch (error) {
    console.error('mediaService.processImage error:', error);
    return { success: false, status: 400, message: 'Image could not be processed.' };
  }
}

async function uploadArticleImage(file, user, metadata = {}) {
  if (!canManageMedia(user)) {
    return { success: false, status: 403, message: 'You do not have permission to upload media.' };
  }

  const processed = await processImage(file);
  if (!processed.success) return processed;

  const usageType = normalizeUsageType(metadata.usageType, 'article_banner');
  const storageKey = buildStorageKey(user.id);
  const storage = getStorageAdapter();
  const stored = await storage.saveFile({ buffer: processed.buffer, storageKey });

  const asset = await MediaAsset.create({
    storageProvider: stored.storageProvider,
    storageKey: stored.storageKey,
    url: stored.url,
    originalName: normalizeOptionalText(file.originalname, 255),
    mimeType: processed.mimeType,
    size: processed.size,
    width: processed.width,
    height: processed.height,
    usageType,
    status: 'active',
    altText: normalizeOptionalText(metadata.altText, 255),
    credit: normalizeOptionalText(metadata.credit, 255),
    uploadedByUserId: user.id,
  });

  return { success: true, media: serializeMediaAsset(asset) };
}

async function listMediaAssets(query = {}, user = null) {
  if (!canManageMedia(user)) {
    return { success: false, status: 403, message: 'You do not have permission to view media.' };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(query.limit, 10) || 24));
  const where = { status: 'active' };

  if (query.usageType && MEDIA_USAGE_TYPES.includes(query.usageType)) {
    where.usageType = query.usageType;
  }

  const { count, rows } = await MediaAsset.findAndCountAll({
    where,
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

  return {
    success: true,
    media: rows.map(serializeMediaAsset),
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

module.exports = {
  canManageMedia,
  uploadArticleImage,
  listMediaAssets,
  serializeMediaAsset,
};
