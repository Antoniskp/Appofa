'use strict';

const path = require('path');
const fs = require('fs');

// Use __dirname so the path is always relative to this file's location on disk,
// regardless of which directory the process was started from.
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

/**
 * Ensure a directory exists, creating it recursively if needed.
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Save a buffer to a deterministic path, overwriting any existing file.
 * @param {Buffer} buffer
 * @param {string} subDir - e.g. 'profiles' or 'locations'
 * @param {string} filename - e.g. '42.webp'
 * @returns {string} Public URL path, e.g. '/uploads/profiles/42.webp'
 */
function saveImage(buffer, subDir, filename) {
  const dir = path.join(UPLOADS_ROOT, subDir);
  ensureDir(dir);
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  // Return the public URL (path only, no host)
  return `/uploads/${subDir}/${filename}`;
}

/**
 * Save a user avatar WebP buffer.
 * @param {Buffer} buffer
 * @param {number|string} userId
 * @returns {string} Public URL, e.g. '/uploads/profiles/42.webp'
 */
function saveAvatar(buffer, userId) {
  return saveImage(buffer, 'profiles', `${userId}.webp`);
}

/**
 * Save a location image WebP buffer.
 * @param {Buffer} buffer
 * @param {number|string} locationId
 * @returns {string} Public URL, e.g. '/uploads/locations/7.webp'
 */
function saveLocationImage(buffer, locationId) {
  return saveImage(buffer, 'locations', `${locationId}.webp`);
}

module.exports = { saveAvatar, saveLocationImage };
