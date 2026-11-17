'use strict';

const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const { Op } = require('sequelize');
const { PollAttachment, MediaAsset, User, sequelize } = require('../models');
const { processMediaImage } = require('./imageProcessingService');

const MAX_ATTACHMENTS = 10;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const USER_QUOTA_BYTES = Math.max(MAX_PDF_BYTES, Number(process.env.MEDIA_USER_QUOTA_BYTES) || 200 * 1024 * 1024);
// Dotfiles are denied by the static upload server. Never expose these paths.
const STORAGE_ROOT = path.join(process.env.MEDIA_UPLOAD_ROOT || path.join(__dirname, '..', '..', 'uploads'), '.poll-attachments');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function storagePath(key) {
  if (!/^[0-9a-f-]+(?:-thumb)?\.(?:pdf|webp)$/i.test(key || '')) throw fail('Invalid attachment path.');
  return path.join(STORAGE_ROOT, key);
}

function serializeAttachment(row) {
  const url = `/api/polls/attachments/${row.id}/file`;
  return {
    id: row.id, originalName: row.originalName, mimeType: row.mimeType,
    size: row.size, title: row.title, caption: row.caption || '', order: row.order,
    url, thumbnailUrl: row.thumbnailKey ? `${url}?thumbnail=true` : null,
  };
}

async function removeFiles(rows) {
  for (const row of rows) {
    for (const key of [row.storageKey, row.thumbnailKey].filter(Boolean)) {
      await fs.unlink(storagePath(key)).catch(error => {
        if (error.code !== 'ENOENT') console.error('Attachment cleanup failed:', error.message);
      });
    }
  }
}

async function cleanupExpiredUploads(userId) {
  await sequelize.transaction(async transaction => {
    const rows = await PollAttachment.findAll({
      where: { pollId: null, createdAt: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }, ...(userId ? { uploadedByUserId: userId } : {}) },
      transaction, lock: transaction.LOCK.UPDATE,
    });
    for (const row of rows) await row.destroy({ transaction });
    transaction.afterCommit(() => removeFiles(rows));
  });
}

async function cleanupAttachments() {
  await cleanupExpiredUploads();
  // Also collect files left by cascaded user/organization deletions or a crash.
  // A grace period protects files being written by an upload transaction.
  const rows = await PollAttachment.findAll({ attributes: ['storageKey', 'thumbnailKey'] });
  const referenced = new Set(rows.flatMap(row => [row.storageKey, row.thumbnailKey]).filter(Boolean));
  const keys = await fs.readdir(STORAGE_ROOT).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const key of keys) {
    if (referenced.has(key) || !/^[0-9a-f-]+(?:-thumb)?\.(?:pdf|webp)$/i.test(key)) continue;
    const stat = await fs.stat(storagePath(key)).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (stat?.isFile() && stat.mtimeMs < Date.now() - 24 * 60 * 60 * 1000) await removeFiles([{ storageKey: key }]);
  }
}

async function uploadAttachment(file, user) {
  if (!file?.buffer?.length) throw fail('Επιλέξτε μια φωτογραφία ή ένα PDF.');
  const isPdf = file.mimetype === 'application/pdf';
  if (file.buffer.length > (isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES)) {
    throw fail(isPdf ? 'Το PDF πρέπει να είναι έως 20 MB.' : 'Η φωτογραφία πρέπει να είναι έως 8 MB.', 413);
  }
  let buffer;
  let thumbnail;
  if (isPdf) {
    // Check content, not just the filename or browser-provided MIME type.
    if (!/^%PDF-\d\.\d[\r\n]/.test(file.buffer.subarray(0, 16).toString('latin1')) ||
        !/%%EOF\s*$/.test(file.buffer.subarray(-1024).toString('latin1'))) {
      throw fail('Το αρχείο δεν είναι έγκυρο PDF.');
    }
    buffer = file.buffer;
  } else {
    try {
      const processed = await processMediaImage(file.buffer, { claimedMimeType: file.mimetype });
      buffer = processed.variants.articleCover.buffer;
      thumbnail = processed.variants.thumbnail.buffer;
    } catch {
      throw fail('Η φωτογραφία δεν μπορεί να διαβαστεί. Δοκιμάστε JPEG, PNG ή WebP.');
    }
  }
  await cleanupExpiredUploads(user.id);
  const id = randomUUID();
  const keys = { storageKey: `${id}.${isPdf ? 'pdf' : 'webp'}`, thumbnailKey: thumbnail ? `${id}-thumb.webp` : null };
  try {
    return await sequelize.transaction(async transaction => {
      // Serialize quota checks for concurrent uploads by this user.
      await User.findByPk(user.id, { transaction, lock: transaction.LOCK.UPDATE });
      const staged = await PollAttachment.count({ where: { uploadedByUserId: user.id, pollId: null }, transaction });
      if (staged >= MAX_ATTACHMENTS) throw fail('Μπορείτε να ανεβάσετε έως 10 συνημμένα πριν αποθηκεύσετε τη δημοσκόπηση.');
      const used = Number(await PollAttachment.sum('size', { where: { uploadedByUserId: user.id }, transaction })) || 0;
      const mediaUsed = Number(await MediaAsset.sum('size', { where: { uploadedByUserId: user.id, deletedAt: null }, transaction })) || 0;
      const size = buffer.length + (thumbnail?.length || 0);
      if (used + mediaUsed + size > USER_QUOTA_BYTES) throw fail('Δεν υπάρχει αρκετός διαθέσιμος χώρος για το αρχείο.', 413);
      await fs.mkdir(STORAGE_ROOT, { recursive: true });
      await fs.writeFile(storagePath(keys.storageKey), buffer);
      if (thumbnail) await fs.writeFile(storagePath(keys.thumbnailKey), thumbnail);
      const originalName = [...path.basename(file.originalname || (isPdf ? 'document.pdf' : 'photo'))].filter(char => char.charCodeAt(0) >= 32).join('').slice(0, 255) || 'attachment';
      const row = await PollAttachment.create({
        id, ...keys, uploadedByUserId: user.id, originalName,
        title: originalName, mimeType: isPdf ? 'application/pdf' : 'image/webp', size,
      }, { transaction });
      return serializeAttachment(row);
    });
  } catch (error) {
    await removeFiles([keys]);
    throw error;
  }
}

async function listAttachments(pollId) {
  const rows = await PollAttachment.findAll({ where: { pollId }, order: [['order', 'ASC'], ['createdAt', 'ASC']] });
  return rows.map(serializeAttachment);
}

async function syncAttachments(pollId, input, userId, transaction) {
  if (input === undefined) return;
  if (!Array.isArray(input) || input.length > MAX_ATTACHMENTS) throw fail('Επιτρέπονται έως 10 συνημμένα ανά δημοσκόπηση.');
  const seen = new Set();
  for (const [order, item] of input.entries()) {
    if (!item || typeof item.id !== 'string' || !UUID.test(item.id) || seen.has(item.id)) throw fail('Μη έγκυρο ή διπλό συνημμένο.');
    seen.add(item.id);
    if ((item.title !== undefined && (typeof item.title !== 'string' || item.title.length > 255)) ||
        (item.caption !== undefined && (typeof item.caption !== 'string' || item.caption.length > 500))) throw fail('Ο τίτλος ή η λεζάντα του συνημμένου είναι πολύ μεγάλος.');
    const row = await PollAttachment.findByPk(item.id, { transaction, lock: transaction.LOCK.UPDATE });
    // Existing attachments may be edited by the poll editor; unbound uploads
    // may only be claimed by their uploader, including when editing as admin.
    if (!row || (row.pollId !== null && Number(row.pollId) !== Number(pollId)) ||
        (row.pollId === null && row.uploadedByUserId !== userId)) throw fail('Το συνημμένο δεν είναι διαθέσιμο για αυτή τη δημοσκόπηση.', 403);
    await row.update({ pollId, order, title: item.title?.trim() || row.originalName, caption: item.caption?.trim() || null }, { transaction });
  }
  const removed = await PollAttachment.findAll({ where: { pollId, ...(seen.size ? { id: { [Op.notIn]: [...seen] } } : {}) }, transaction });
  for (const row of removed) await row.destroy({ transaction });
  transaction.afterCommit(() => removeFiles(removed));
}

async function deletePollAttachments(pollId, transaction) {
  const rows = await PollAttachment.findAll({ where: { pollId }, transaction });
  await PollAttachment.destroy({ where: { pollId }, transaction });
  transaction.afterCommit(() => removeFiles(rows));
}

async function deleteStagedAttachment(id, userId) {
  await sequelize.transaction(async transaction => {
    const row = UUID.test(id) ? await PollAttachment.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }) : null;
    if (!row || row.pollId !== null || row.uploadedByUserId !== userId) throw fail('Το συνημμένο δεν βρέθηκε.', 404);
    await row.destroy({ transaction });
    transaction.afterCommit(() => removeFiles([row]));
  });
}

module.exports = { MAX_ATTACHMENTS, MAX_IMAGE_BYTES, MAX_PDF_BYTES, uploadAttachment, listAttachments, syncAttachments, deletePollAttachments, deleteStagedAttachment, cleanupExpiredUploads, cleanupAttachments, storagePath, UUID };
