'use strict';

require('dotenv').config();
const { sequelize } = require('../models');
const { cleanupAttachments } = require('../services/pollAttachmentService');

async function main() {
  try {
    await cleanupAttachments();
    console.log('Poll attachment cleanup complete.');
  } finally {
    await sequelize.close();
  }
}
main().catch(error => {
  console.error('Poll attachment cleanup failed:', error.message);
  process.exitCode = 1;
});
