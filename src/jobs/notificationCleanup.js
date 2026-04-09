'use strict';

const notificationService = require('../services/notificationService');

// Check for node-cron
let cron;
try {
  cron = require('node-cron');
} catch {
  cron = null;
}

async function runPurge() {
  try {
    await notificationService.purgeOldNotifications();
  } catch (err) {
    console.error('[notificationCleanup] Error purging notifications:', err);
  }
}

function startNotificationCleanupJob() {
  if (cron) {
    // Run daily at 03:00 AM
    cron.schedule('0 3 * * *', runPurge);
    console.log('[notificationCleanup] Scheduled daily cleanup at 03:00 AM');
  } else {
    // Fallback: run once per day using setInterval
    const INTERVAL_MS = 24 * 60 * 60 * 1000;
    setInterval(runPurge, INTERVAL_MS);
    console.log('[notificationCleanup] Scheduled daily cleanup via setInterval');
  }
}

module.exports = { startNotificationCleanupJob };
