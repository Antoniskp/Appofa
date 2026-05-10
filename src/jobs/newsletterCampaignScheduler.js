'use strict';

const newsletterService = require('../services/newsletterService');

let isRunning = false;

async function runDueCampaigns() {
  if (isRunning) return;
  isRunning = true;
  try {
    await newsletterService.processDueScheduledCampaigns();
  } catch (error) {
    console.error('[newsletterCampaignScheduler] Error processing due campaigns:', error);
  } finally {
    isRunning = false;
  }
}

function startNewsletterCampaignScheduler() {
  const intervalMsRaw = Number.parseInt(process.env.NEWSLETTER_SCHEDULER_INTERVAL_MS || '', 10);
  const intervalMs = Number.isInteger(intervalMsRaw) && intervalMsRaw > 0 ? Math.min(intervalMsRaw, 300000) : 60000;

  setInterval(runDueCampaigns, intervalMs);
  runDueCampaigns().catch(() => {});
  console.log(`[newsletterCampaignScheduler] Scheduled due-campaign checks every ${intervalMs}ms`);
}

module.exports = { startNewsletterCampaignScheduler };
