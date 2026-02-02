const { Image, User, sequelize } = require('../models');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { Op } = require('sequelize');

const imageController = {
  // Upload a new image
  uploadImage: async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded.'
        });
      }

      const { title, tags } = req.body;
      const file = req.file;

      // Get image metadata using sharp
      const metadata = await sharp(file.path).metadata();

      // Resize and compress the image (max width/height: 1920px)
      const maxDimension = 1920;
      let processedImagePath = file.path;
      
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        await sharp(file.path)
          .resize(maxDimension, maxDimension, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toFile(file.path + '.temp');

        // Replace original with compressed version
        await fs.unlink(file.path);
        await fs.rename(file.path + '.temp', file.path);
      } else {
        // Just compress without resizing
        await sharp(file.path)
          .jpeg({ quality: 85 })
          .toFile(file.path + '.temp');

        await fs.unlink(file.path);
        await fs.rename(file.path + '.temp', file.path);
      }

      // Get final metadata after processing
      const finalMetadata = await sharp(file.path).metadata();
      const stats = await fs.stat(file.path);

      // Create thumbnail (300x300)
      const thumbnailFilename = 'thumb_' + file.filename;
      const thumbnailPath = path.join(
        path.dirname(file.path),
        'thumbnails',
        thumbnailFilename
      );

      await sharp(file.path)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // Generate URL (relative to public directory)
      const imageUrl = `/uploads/images/${file.filename}`;
      const thumbnailUrl = `/uploads/images/thumbnails/${thumbnailFilename}`;

      // Parse tags
      let imageTags = [];
      if (tags) {
        try {
          imageTags = Array.isArray(tags) ? tags : JSON.parse(tags);
        } catch (e) {
          // If parsing fails, treat as comma-separated string
          imageTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      }

      // Create image record in database
      const image = await Image.create({
        title: title || file.originalname,
        url: imageUrl,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: stats.size,
        width: finalMetadata.width,
        height: finalMetadata.height,
        tags: imageTags,
        ownerId: req.user.id,
        isExternal: false
      });

      // Fetch image with owner info
      const imageWithOwner = await Image.findByPk(image.id, {
        include: [{
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully.',
        data: {
          image: imageWithOwner,
          thumbnailUrl
        }
      });
    } catch (error) {
      console.error('Upload image error:', error);
      
      // Clean up uploaded file if there was an error
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Error uploading image.',
        error: error.message
      });
    }
  },

  // Add image from external URL
  addExternalImage: async (req, res) => {
    try {
      const { url, title, tags } = req.body;

      // Validate URL
      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL is required.'
        });
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL format.'
        });
      }

      // Parse tags
      const imageTags = Array.isArray(tags) ? tags : [];

      // Create image record
      const image = await Image.create({
        title: title || 'External Image',
        url: url,
        tags: imageTags,
        ownerId: req.user.id,
        isExternal: true
      });

      // Fetch image with owner info
      const imageWithOwner = await Image.findByPk(image.id, {
        include: [{
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }]
      });

      res.status(201).json({
        success: true,
        message: 'External image added successfully.',
        data: { image: imageWithOwner }
      });
    } catch (error) {
      console.error('Add external image error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding external image.',
        error: error.message
      });
    }
  },

  // Get all images for the authenticated user
  getMyImages: async (req, res) => {
    try {
      const { page = 1, limit = 20, tag } = req.query;
      
      const where = { ownerId: req.user.id };
      
      // Filter by tag if provided
      if (tag) {
        const trimmedTag = String(tag).trim();
        const dialect = sequelize.getDialect();

        if (trimmedTag && dialect === 'postgres') {
          where.tags = { [Op.contains]: [trimmedTag] };
        } else if (trimmedTag) {
          // For non-Postgres databases, fetch all and filter in memory
          const allImages = await Image.findAll({
            where: { ownerId: req.user.id },
            order: [['createdAt', 'DESC']]
          });

          const filteredImages = allImages.filter(
            (image) => Array.isArray(image.tags) && image.tags.includes(trimmedTag)
          );

          const offset = (page - 1) * limit;
          const paginatedImages = filteredImages.slice(offset, offset + parseInt(limit));

          return res.status(200).json({
            success: true,
            data: {
              images: paginatedImages,
              pagination: {
                total: filteredImages.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(filteredImages.length / limit)
              }
            }
          });
        }
      }

      const offset = (page - 1) * limit;
      const parsedLimit = parseInt(limit);

      const { count, rows: images } = await Image.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parsedLimit,
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          images,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parsedLimit,
            totalPages: Math.ceil(count / parsedLimit)
          }
        }
      });
    } catch (error) {
      console.error('Get images error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching images.',
        error: error.message
      });
    }
  },

  // Get single image by ID
  getImageById: async (req, res) => {
    try {
      const { id } = req.params;

      const image = await Image.findByPk(id, {
        include: [{
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }]
      });

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Image not found.'
        });
      }

      // Check permissions - only owner, admin, editor, or moderator can view
      const canView = req.user && (
        req.user.id === image.ownerId ||
        ['admin', 'editor', 'moderator'].includes(req.user.role)
      );

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'Access denied.'
        });
      }

      res.status(200).json({
        success: true,
        data: { image }
      });
    } catch (error) {
      console.error('Get image error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching image.',
        error: error.message
      });
    }
  },

  // Update image metadata (title, tags)
  updateImage: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, tags } = req.body;

      const image = await Image.findByPk(id);

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Image not found.'
        });
      }

      // Check permissions - only owner can update
      if (image.ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this image.'
        });
      }

      // Update fields
      if (title !== undefined) {
        image.title = title;
      }
      if (tags !== undefined) {
        image.tags = Array.isArray(tags) ? tags : [];
      }

      await image.save();

      // Fetch updated image with owner info
      const updatedImage = await Image.findByPk(id, {
        include: [{
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }]
      });

      res.status(200).json({
        success: true,
        message: 'Image updated successfully.',
        data: { image: updatedImage }
      });
    } catch (error) {
      console.error('Update image error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating image.',
        error: error.message
      });
    }
  },

  // Delete image
  deleteImage: async (req, res) => {
    try {
      const { id } = req.params;

      const image = await Image.findByPk(id);

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'Image not found.'
        });
      }

      // Check permissions - only owner can delete
      if (image.ownerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this image.'
        });
      }

      // Delete physical file if not external
      if (!image.isExternal && image.filename) {
        const imagePath = path.join(__dirname, '../../public/uploads/images', image.filename);
        const thumbnailPath = path.join(
          __dirname,
          '../../public/uploads/images/thumbnails',
          'thumb_' + image.filename
        );

        try {
          await fs.unlink(imagePath);
        } catch (error) {
          console.error('Error deleting image file:', error);
        }

        try {
          await fs.unlink(thumbnailPath);
        } catch (error) {
          console.error('Error deleting thumbnail file:', error);
        }
      }

      // Delete database record
      await image.destroy();

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully.'
      });
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting image.',
        error: error.message
      });
    }
  },

  // Search images by tags (for all users with appropriate permissions)
  searchImages: async (req, res) => {
    try {
      const { tag, page = 1, limit = 20 } = req.query;

      if (!tag) {
        return res.status(400).json({
          success: false,
          message: 'Tag parameter is required.'
        });
      }

      const trimmedTag = String(tag).trim();
      const where = { ownerId: req.user.id };
      const dialect = sequelize.getDialect();

      if (dialect === 'postgres') {
        where.tags = { [Op.contains]: [trimmedTag] };
      } else {
        // For non-Postgres databases, fetch all and filter in memory
        const allImages = await Image.findAll({
          where: { ownerId: req.user.id },
          order: [['createdAt', 'DESC']]
        });

        const filteredImages = allImages.filter(
          (image) => Array.isArray(image.tags) && image.tags.includes(trimmedTag)
        );

        const offset = (page - 1) * limit;
        const paginatedImages = filteredImages.slice(offset, offset + parseInt(limit));

        return res.status(200).json({
          success: true,
          data: {
            images: paginatedImages,
            pagination: {
              total: filteredImages.length,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: Math.ceil(filteredImages.length / limit)
            }
          }
        });
      }

      const offset = (page - 1) * limit;
      const parsedLimit = parseInt(limit);

      const { count, rows: images } = await Image.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parsedLimit,
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          images,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parsedLimit,
            totalPages: Math.ceil(count / parsedLimit)
          }
        }
      });
    } catch (error) {
      console.error('Search images error:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching images.',
        error: error.message
      });
    }
  }
};

module.exports = imageController;
