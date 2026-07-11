#!/usr/bin/env node
'use strict';

require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const { sequelize, Article, User, MediaAsset } = require('../models');

const uploadRoot = process.env.MEDIA_UPLOAD_ROOT || path.join(__dirname, '..', '..', 'uploads');

function isLocalUploadUrl(value) {
  const url = String(value || '').trim();
  return url.startsWith('/uploads/');
}

function urlToStorageKey(url) {
  return String(url || '').replace(/^\/+/, '').replace(/^uploads\//, '');
}

async function readLocalImageMetadata(storageKey) {
  const absolutePath = path.resolve(uploadRoot, storageKey);
  try {
    const stat = await fs.stat(absolutePath);
    const imageMeta = await sharp(absolutePath).metadata().catch(() => null);
    return {
      exists: true,
      absolutePath,
      size: stat.size || 0,
      width: imageMeta?.width || null,
      height: imageMeta?.height || null,
      mimeType: imageMeta?.format ? `image/${imageMeta.format}` : null,
    };
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return { exists: false, absolutePath, size: 0, width: null, height: null, mimeType: null };
    }
    throw error;
  }
}

async function findOrCreateMediaAsset({ dryRun, uploaderId, usageType, entityType, url, metadata }) {
  const existingByUrl = await MediaAsset.findOne({
    where: { url, deletedAt: null, status: 'active' },
    attributes: ['id', 'url'],
  });
  if (existingByUrl) {
    return { status: 'duplicate', mediaAssetId: existingByUrl.id };
  }

  const storageKey = urlToStorageKey(url);
  const existingByStorage = await MediaAsset.findOne({
    where: { storageKey, deletedAt: null, status: 'active' },
    attributes: ['id', 'url'],
  });
  if (existingByStorage) {
    return { status: 'duplicate', mediaAssetId: existingByStorage.id };
  }

  if (dryRun) {
    return { status: 'adoptable', mediaAssetId: null };
  }

  const created = await MediaAsset.create({
    storageProvider: 'local',
    storageKey,
    url,
    variants: {
      original: {
        url,
        storageKey,
        width: metadata.width,
        height: metadata.height,
        size: metadata.size,
        mimeType: metadata.mimeType || 'image/webp',
      },
    },
    originalName: path.basename(storageKey),
    mimeType: metadata.mimeType || 'image/webp',
    detectedMimeType: metadata.mimeType || 'image/webp',
    size: metadata.size || 0,
    width: metadata.width,
    height: metadata.height,
    usageType,
    entityType,
    status: 'active',
    uploadedByUserId: uploaderId,
  });

  return { status: 'created', mediaAssetId: created.id };
}

async function run() {
  const args = new Set(process.argv.slice(2));
  const dryRun = !args.has('--apply');
  const report = {
    success: true,
    dryRun,
    discovered: 0,
    adoptable: 0,
    linked: 0,
    skipped: 0,
    missing: 0,
    duplicate: 0,
    failed: 0,
    articleCandidates: 0,
    avatarCandidates: 0,
  };

  try {
    await sequelize.authenticate();

    const fallbackUploaderId = Number(process.env.MEDIA_ADOPTION_FALLBACK_UPLOADER_ID) || null;
    const fallbackUploader = fallbackUploaderId
      ? await User.findByPk(fallbackUploaderId, { attributes: ['id'] })
      : await User.findOne({ where: { role: 'admin' }, attributes: ['id'], order: [['id', 'ASC']] });
    if (!fallbackUploader) throw new Error('No users found to assign adopted media ownership.');

    const articles = await Article.findAll({
      where: {
        coverImageId: null,
      },
      attributes: ['id', 'authorId', 'bannerImageUrl'],
    });

    for (const article of articles) {
      if (!isLocalUploadUrl(article.bannerImageUrl)) continue;
      report.discovered += 1;
      report.articleCandidates += 1;

      try {
        const url = article.bannerImageUrl;
        const storageKey = urlToStorageKey(url);
        const fileMeta = await readLocalImageMetadata(storageKey);
        if (!fileMeta.exists) {
          report.missing += 1;
          continue;
        }

        const adoption = await findOrCreateMediaAsset({
          dryRun,
          uploaderId: article.authorId || fallbackUploader.id,
          usageType: 'article_cover',
          entityType: 'article',
          url,
          metadata: fileMeta,
        });

        if (adoption.status === 'duplicate') {
          report.duplicate += 1;
        } else if (adoption.status === 'adoptable') {
          report.adoptable += 1;
        } else if (adoption.status === 'created') {
          report.adoptable += 1;
        }

        if (adoption.mediaAssetId) {
          if (!dryRun) {
            await article.update({ coverImageId: adoption.mediaAssetId });
          }
          report.linked += 1;
        } else {
          report.skipped += 1;
        }
      } catch (error) {
        console.warn(`Article adoption failed for article #${article.id}: ${error.message}`);
        report.failed += 1;
      }
    }

    const users = await User.findAll({
      attributes: ['id', 'avatar', 'avatarUrl'],
    });
    for (const user of users) {
      const avatarUrl = isLocalUploadUrl(user.avatar) ? user.avatar : (isLocalUploadUrl(user.avatarUrl) ? user.avatarUrl : null);
      if (!avatarUrl) continue;
      report.discovered += 1;
      report.avatarCandidates += 1;
      try {
        const storageKey = urlToStorageKey(avatarUrl);
        const fileMeta = await readLocalImageMetadata(storageKey);
        if (!fileMeta.exists) {
          report.missing += 1;
          continue;
        }
        const adoption = await findOrCreateMediaAsset({
          dryRun,
          uploaderId: user.id,
          usageType: 'avatar',
          entityType: 'avatar',
          url: avatarUrl,
          metadata: fileMeta,
        });

        if (adoption.status === 'duplicate') report.duplicate += 1;
        else if (adoption.status === 'adoptable' || adoption.status === 'created') report.adoptable += 1;
      } catch (error) {
        console.warn(`Avatar adoption failed for user #${user.id}: ${error.message}`);
        report.failed += 1;
      }
    }

    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Legacy media adoption failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
