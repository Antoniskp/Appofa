'use strict';

const fs = require('fs/promises');
const path = require('path');

const uploadRoot = process.env.MEDIA_UPLOAD_ROOT || path.join(__dirname, '..', '..', '..', 'uploads');

function resolveStoragePath(storageKey) {
  const normalizedKey = String(storageKey || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const absolutePath = path.resolve(uploadRoot, normalizedKey);
  const absoluteRoot = path.resolve(uploadRoot);

  if (absolutePath !== absoluteRoot && !absolutePath.startsWith(`${absoluteRoot}${path.sep}`)) {
    throw new Error('Invalid media storage key.');
  }

  return { normalizedKey, absolutePath };
}

async function saveFile({ buffer, storageKey }) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Storage adapter requires a Buffer.');
  }

  const { normalizedKey, absolutePath } = resolveStoragePath(storageKey);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return {
    storageProvider: 'local',
    storageKey: normalizedKey,
    url: `/uploads/${normalizedKey}`,
  };
}

async function deleteFile(storageKey) {
  const { absolutePath } = resolveStoragePath(storageKey);
  await fs.unlink(absolutePath).catch((error) => {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  });
}

async function inspectFile(storageKey) {
  const { absolutePath } = resolveStoragePath(storageKey);
  try {
    const stat = await fs.stat(absolutePath);
    return {
      exists: true,
      size: stat.size,
      mtime: stat.mtime,
    };
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return { exists: false, size: 0, mtime: null };
    }
    throw error;
  }
}

module.exports = {
  saveFile,
  deleteFile,
  inspectFile,
};
