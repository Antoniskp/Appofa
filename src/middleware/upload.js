'use strict';

const multer = require('multer');

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

/** 5 MB in bytes */
const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
/** 10 MB in bytes */
const LOCATION_MAX_SIZE = 10 * 1024 * 1024;

const mimeFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Unsupported file type. Allowed: JPEG, PNG, WebP, HEIC/HEIF.'), { status: 415 }));
  }
};

/**
 * Multer instance for avatar uploads (max 5 MB, memory storage).
 */
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_SIZE },
  fileFilter: mimeFilter,
});

/**
 * Multer instance for location image uploads (max 10 MB, memory storage).
 */
const locationImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LOCATION_MAX_SIZE },
  fileFilter: mimeFilter,
});

module.exports = { avatarUpload, locationImageUpload };
