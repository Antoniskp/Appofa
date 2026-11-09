'use strict';
const { processWeeklyDigests } = require('../services/proposalDigestService');

let isRunning = false;
async function runProposalDigests() {
  if (isRunning) return;
  isRunning = true;
  try {
    const summary = await processWeeklyDigests();
    if (summary.sent || summary.failed) console.log('[proposalDigestScheduler] Weekly digest run:', summary);
  } catch (error) {
    console.error('[proposalDigestScheduler] Error processing weekly digests:', error);
  } finally {
    isRunning = false;
  }
}

function startProposalDigestScheduler() {
  const raw = Number.parseInt(process.env.PROPOSAL_DIGEST_SCHEDULER_INTERVAL_MS || '', 10);
  const intervalMs = Number.isInteger(raw) && raw > 0 ? Math.min(raw, 3600000) : 3600000;
  setInterval(runProposalDigests, intervalMs);
  runProposalDigests().catch(() => {});
  console.log(`[proposalDigestScheduler] Checking weekly proposal digests every ${intervalMs}ms`);
}

module.exports = { startProposalDigestScheduler, runProposalDigests };
