'use strict';

const crypto = require('crypto');
const sharp = require('sharp');

const SUPPORTED_INPUT_FORMATS = new Set(['jpeg', 'png', 'webp', 'heif']);
const FORMAT_TO_MIME = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heif: 'image/heif',
};

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

const ARTICLE_COVER_PRESET = {
  maxWidth: 1600,
  maxHeight: 900,
  quality: 82,
};

const THUMBNAIL_PRESET = {
  maxWidth: 480,
  maxHeight: 270,
  quality: 78,
};

async function inspectImage(inputBuffer) {
  if (!Buffer.isBuffer(inputBuffer) || inputBuffer.length === 0) {
    const error = new Error('Uploaded image is empty.');
    error.status = 400;
    throw error;
  }

  const image = sharp(inputBuffer, { limitInputPixels: 24000000, sequentialRead: true });
  const metadata = await image.metadata();

  const format = String(metadata.format || '').toLowerCase();
  if (!SUPPORTED_INPUT_FORMATS.has(format)) {
    const error = new Error('Only JPEG, PNG, WebP, and HEIC/HEIF images are supported.');
    error.status = 400;
    throw error;
  }

  return {
    format,
    mimeType: FORMAT_TO_MIME[format] || null,
    width: metadata.width || null,
    height: metadata.height || null,
  };
}

function assertMimeClaim(claimedMimeType, detectedMimeType) {
  if (!claimedMimeType || !detectedMimeType) return;
  const normalizedClaim = String(claimedMimeType).toLowerCase();
  if (normalizedClaim === 'image/heic' || normalizedClaim === 'image/heif' || normalizedClaim === 'image/heic-sequence' || normalizedClaim === 'image/heif-sequence') {
    return;
  }
  if (normalizedClaim !== detectedMimeType) {
    const error = new Error('Uploaded file content does not match the declared image type.');
    error.status = 400;
    throw error;
  }
}

async function processVariant(inputBuffer, preset) {
  const output = await sharp(inputBuffer, { limitInputPixels: 24000000 })
    .rotate()
    .resize(preset.maxWidth, preset.maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: preset.quality })
    .withMetadata(false)
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    size: output.data.length,
    mimeType: 'image/webp',
    format: 'webp',
  };
}

async function processMediaImage(inputBuffer, options = {}) {
  const inspected = await inspectImage(inputBuffer);
  assertMimeClaim(options.claimedMimeType, inspected.mimeType);

  const articleCover = await processVariant(inputBuffer, ARTICLE_COVER_PRESET);
  const thumbnail = await processVariant(articleCover.buffer, THUMBNAIL_PRESET);
  const avatar = await processVariant(inputBuffer, AVATAR_PRESETS);

  return {
    detectedMimeType: inspected.mimeType,
    sourceFormat: inspected.format,
    originalWidth: inspected.width,
    originalHeight: inspected.height,
    checksumSha256: crypto.createHash('sha256').update(inputBuffer).digest('hex'),
    variants: {
      articleCover,
      thumbnail,
      avatar,
    },
  };
}

async function processImage(inputBuffer, preset) {
  const variant = await processVariant(inputBuffer, preset);
  return variant.buffer;
}

async function processAvatar(inputBuffer) {
  return processImage(inputBuffer, AVATAR_PRESETS);
}

async function processLocationImage(inputBuffer) {
  return processImage(inputBuffer, LOCATION_IMAGE_PRESETS);
}

module.exports = {
  inspectImage,
  processMediaImage,
  processAvatar,
  processLocationImage,
};
