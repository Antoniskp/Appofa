const express = require('express');
const multer = require('multer');
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middleware/auth');
const csrfProtection = require('../middleware/csrfProtection');
const { apiLimiter, uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only JPEG, PNG, and WebP images are supported.'));
  },
});

const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Image must be 8MB or smaller.' });
    }
    return res.status(400).json({ success: false, message: error.message || 'Invalid upload.' });
  });
};

router.get('/', authMiddleware, apiLimiter, mediaController.listMedia);
router.post('/articles/images', authMiddleware, uploadLimiter, csrfProtection, handleUpload, mediaController.uploadArticleImage);

module.exports = router;
