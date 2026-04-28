'use strict';

const sharp = require('sharp');

const AVATAR_PRESETS = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 75,
};

const LOCATION_IMAGE_PRESETS = {
  maxWidth: 1600,
  maxHeight: 900,
  quality: 80,
};

/**
 * Process an image buffer: resize, convert to WebP, strip metadata.
 * @param {Buffer} inputBuffer - Raw file buffer from multer memory storage.
 * @param {{ maxWidth: number, maxHeight: number, quality: number }} preset
 * @returns {Promise<Buffer>} Optimized WebP buffer.
 */
async function processImage(inputBuffer, preset) {
  const { maxWidth, maxHeight, quality } = preset;
  return sharp(inputBuffer)
    .rotate() // Auto-rotate based on EXIF orientation (corrects image orientation)
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .withMetadata(false) // Strip all metadata including EXIF
    .toBuffer();
}

/**
 * Process a user avatar image.
 * @param {Buffer} inputBuffer
 * @returns {Promise<Buffer>}
 */
async function processAvatar(inputBuffer) {
  return processImage(inputBuffer, AVATAR_PRESETS);
}

/**
 * Process a location image.
 * @param {Buffer} inputBuffer
 * @returns {Promise<Buffer>}
 */
async function processLocationImage(inputBuffer) {
  return processImage(inputBuffer, LOCATION_IMAGE_PRESETS);
}

module.exports = { processAvatar, processLocationImage };
