'use strict';

// Media variants use new UUID filenames on every write. Avatars and location
// photos overwrite stable filenames, so they must revalidate before reuse.
const IMMUTABLE_MEDIA_PATH = /[/\\]media[/\\]\d{4}[/\\]\d{2}[/\\][a-z0-9_-]+[/\\][a-z0-9_-]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-z0-9_-]+\.webp$/i;

module.exports = {
  // Poll attachments live in .poll-attachments and are served only by the
  // authenticated attachment endpoint, including thumbnails.
  dotfiles: 'deny',
  setHeaders(res, filePath) {
    res.setHeader('Cache-Control', IMMUTABLE_MEDIA_PATH.test(filePath)
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate');
  },
};
