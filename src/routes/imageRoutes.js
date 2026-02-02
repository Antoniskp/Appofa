const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const { apiLimiter, createLimiter } = require('../middleware/rateLimiter');

// All image routes require authentication
// Upload new image (file upload)
router.post(
  '/upload',
  createLimiter,
  authMiddleware,
  upload.single('image'),
  imageController.uploadImage
);

// Add external image (URL)
router.post(
  '/external',
  createLimiter,
  authMiddleware,
  imageController.addExternalImage
);

// Get user's images
router.get(
  '/my-images',
  apiLimiter,
  authMiddleware,
  imageController.getMyImages
);

// Search images by tag
router.get(
  '/search',
  apiLimiter,
  authMiddleware,
  imageController.searchImages
);

// Get single image by ID
router.get(
  '/:id',
  apiLimiter,
  authMiddleware,
  imageController.getImageById
);

// Update image metadata
router.put(
  '/:id',
  apiLimiter,
  authMiddleware,
  imageController.updateImage
);

// Delete image
router.delete(
  '/:id',
  apiLimiter,
  authMiddleware,
  imageController.deleteImage
);

module.exports = router;
