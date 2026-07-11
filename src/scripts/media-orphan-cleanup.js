#!/usr/bin/env node
'use strict';

require('dotenv').config();

const { sequelize } = require('../models');
const mediaService = require('../services/mediaService');

async function run() {
  const args = new Set(process.argv.slice(2));
  const dryRun = !args.has('--apply');
  const olderThanArg = process.argv.find((arg) => arg.startsWith('--older-than-days='));
  const parsedOlderThanDays = olderThanArg ? Number(olderThanArg.split('=')[1]) : 14;
  if (!Number.isInteger(parsedOlderThanDays) || parsedOlderThanDays < 1) {
    throw new Error('Invalid --older-than-days value. Use a positive integer.');
  }
  const olderThanDays = parsedOlderThanDays;

  try {
    await sequelize.authenticate();
    const markResult = await mediaService.markOrphanMediaAssets();
    const cleanupResult = await mediaService.cleanupOrphanMediaAssets({ dryRun, olderThanDays });

    console.log(JSON.stringify({
      success: true,
      dryRun,
      marked: markResult,
      cleanup: cleanupResult,
    }, null, 2));
  } catch (error) {
    console.error('Media orphan cleanup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
