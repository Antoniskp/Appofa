'use strict';

const { Suggestion, Poll, sequelize } = require('../models');
const STAGES = ['discussion', 'voting', 'response', 'delivery', 'completed', 'rejected'];
const fail = (status, message) => Object.assign(new Error(message), { status });

async function updateProgress(id, user, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw fail(400, 'Invalid progress update.');
  return sequelize.transaction(async (transaction) => {
    const proposal = await Suggestion.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!proposal) throw fail(404, 'Proposal not found.');
    if (proposal.authorId !== user.id && user.role !== 'admin') throw fail(403, 'Only the author or an administrator can publish progress.');
    const previous = proposal.progress || { revision: 0, history: [] };
    if (input.revision !== previous.revision) throw fail(409, 'Progress changed. Reload before saving.');
    if (!STAGES.includes(input.stage)) throw fail(400, 'Invalid progress stage.');
    const next = { stage: input.stage };
    for (const key of ['responsibleBody', 'response', 'cost', 'milestones', 'evidenceUrl', 'note']) {
      if (typeof input[key] !== 'string' || input[key].length > (key === 'responsibleBody' ? 200 : 4000)) throw fail(400, `Invalid ${key}.`);
      next[key] = input[key].trim();
    }
    if (!next.note) throw fail(400, 'Explain this progress update.');
    if (next.evidenceUrl) {
      let url;
      try { url = new URL(next.evidenceUrl); } catch { throw fail(400, 'Invalid evidence URL.'); }
      if (!['https:', 'http:'].includes(url.protocol)) throw fail(400, 'Evidence must be an HTTP or HTTPS link.');
    }
    next.responseDeadline = input.responseDeadline || null;
    if (next.responseDeadline && (typeof next.responseDeadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(next.responseDeadline) || !Number.isFinite(Date.parse(next.responseDeadline)) || new Date(next.responseDeadline).toISOString().slice(0, 10) !== next.responseDeadline)) throw fail(400, 'Invalid response deadline.');
    next.decisionPollId = input.decisionPollId ? Number(input.decisionPollId) : null;
    if (next.decisionPollId !== null && (!Number.isSafeInteger(next.decisionPollId) || next.decisionPollId < 1)) throw fail(400, 'Invalid poll ID.');
    if (next.decisionPollId) {
      const poll = await Poll.findByPk(next.decisionPollId, { transaction });
      if (!poll || poll.visibility !== 'public' || poll.organizationId || poll.locationId !== proposal.locationId) throw fail(400, 'Link a public, non-organization poll for the same location.');
      if (poll.creatorId !== user.id && user.role !== 'admin') throw fail(403, 'Link a poll you manage.');
    }
    if (next.stage === 'voting' && !next.decisionPollId) throw fail(400, 'Link a consultation before opening the voting stage.');
    if (['response', 'delivery', 'completed', 'rejected'].includes(next.stage) && (!next.responsibleBody || !next.response)) throw fail(400, 'Provide the responsible body and its response.');
    if (next.stage === 'delivery' && !next.milestones) throw fail(400, 'Provide delivery milestones.');
    if (next.stage === 'completed' && !next.evidenceUrl) throw fail(400, 'Completion requires an evidence link.');
    const revision = previous.revision + 1;
    const event = { ...next, revision, at: new Date().toISOString(), publisherRole: user.role === 'admin' ? 'administrator' : 'author' };
    const progress = { ...next, revision, history: [...previous.history, event] };
    const status = { discussion: 'open', voting: 'under_review', response: 'under_review', delivery: 'under_review', completed: 'implemented', rejected: 'rejected' }[next.stage];
    await proposal.update({ progress, status }, { transaction });
    return { progress, status };
  });
}

module.exports = { updateProgress };
