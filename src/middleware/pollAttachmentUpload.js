'use strict';

const multer = require('multer');
const { MAX_PDF_BYTES } = require('../services/pollAttachmentService');
const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) => cb(allowed.has(file.mimetype) ? null : new Error('Επιτρέπονται φωτογραφίες JPEG, PNG, WebP, HEIC/HEIF και αρχεία PDF.'), allowed.has(file.mimetype)),
}).single('file');

module.exports = (req, res, next) => upload(req, res, error => {
  if (!error) return next();
  return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Το αρχείο πρέπει να είναι έως 20 MB.' : error.message });
});
