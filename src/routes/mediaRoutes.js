const express = require('express');
const multer = require('multer');
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { MAX_IMAGE_BYTES } = require('../services/mediaService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/heic-sequence',
      'image/heif-sequence',
    ]);

    if (allowed.has(mime)) {
      return cb(null, true);
    }
    return cb(new Error('Only JPEG, PNG, WebP, and HEIC/HEIF images are supported.'));
  },
});

const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'Image exceeds the per-file upload limit.' });
    }
    return res.status(400).json({ success: false, message: error.message || 'Invalid upload.' });
  });
};

router.get('/admin/stats', apiLimiter, authMiddleware, checkRole('admin'), mediaController.getAdminStats);
router.get('/admin/cleanup-report', apiLimiter, authMiddleware, checkRole('admin'), mediaController.getAdminCleanupReport);
router.get('/', apiLimiter, authMiddleware, mediaController.listMedia);
router.get('/:id', apiLimiter, authMiddleware, mediaController.getMediaById);
router.post('/upload', uploadLimiter, authMiddleware, csrfProtection, handleUpload, mediaController.uploadMedia);
// Backward compatibility for existing article image upload clients.
router.post('/articles/images', uploadLimiter, authMiddleware, csrfProtection, handleUpload, mediaController.uploadMedia);
router.patch('/:id', apiLimiter, authMiddleware, csrfProtection, mediaController.updateMedia);
router.delete('/:id', apiLimiter, authMiddleware, csrfProtection, mediaController.deleteMedia);

module.exports = router;
