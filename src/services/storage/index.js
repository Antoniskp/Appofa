'use strict';

const localMediaStorageAdapter = require('./localMediaStorageAdapter');

function getStorageAdapter(provider = process.env.MEDIA_STORAGE_PROVIDER || 'local') {
  if (provider === 'local') {
    return localMediaStorageAdapter;
  }

  throw new Error(`Unsupported media storage provider: ${provider}`);
}

module.exports = {
  getStorageAdapter,
};
