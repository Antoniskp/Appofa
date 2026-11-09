'use strict';

const { processDueOnboardingFollowups } = require('../services/onboardingFollowupService');

let isRunning = false;

async function runOnboardingFollowups() {
  if (isRunning) return;
  isRunning = true;
  try {
    const summary = await processDueOnboardingFollowups();
    if (summary.sent || summary.failed) console.log('[onboardingFollowupScheduler] Follow-up run:', summary);
  } catch (error) {
    console.error('[onboardingFollowupScheduler] Error processing follow-ups:', error);
  } finally {
    isRunning = false;
  }
}

function startOnboardingFollowupScheduler() {
  const raw = Number.parseInt(process.env.ONBOARDING_FOLLOWUP_SCHEDULER_INTERVAL_MS || '', 10);
  const intervalMs = Number.isInteger(raw) && raw > 0 ? Math.min(raw, 3600000) : 3600000;
  setInterval(runOnboardingFollowups, intervalMs);
  runOnboardingFollowups().catch(() => {});
  console.log(`[onboardingFollowupScheduler] Checking onboarding follow-ups every ${intervalMs}ms`);
}

module.exports = { startOnboardingFollowupScheduler, runOnboardingFollowups };
