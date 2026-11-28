'use strict';

const { sequelize, Poll, PollVote, User } = require('../models');
const { getGuestVoterId, clearGuestVoterId } = require('../utils/guestVoter');

/**
 * Move anonymous poll votes cast from this browser to the account that just signed in.
 *
 * Only votes on polls open to anyone are moved: those were valid without an account,
 * so attaching them to one cannot bypass a poll's restrictions. When the account has
 * already voted on the same poll, its own vote wins and the guest vote is removed so
 * the person is not counted twice.
 *
 * @param {number} userId
 * @param {string|null} guestVoterId
 * @returns {Promise<{ claimed: number, discarded: number }>}
 */
async function claimGuestVotes(userId, guestVoterId) {
  const result = { claimed: 0, discarded: 0 };
  if (!userId || !guestVoterId) return result;

  await sequelize.transaction(async (transaction) => {
    const voter = await User.findByPk(userId, { attributes: ['id', 'pollVotingBlocked'], transaction });
    if (!voter || voter.pollVotingBlocked) return;

    const guestVotes = await PollVote.findAll({
      where: { sessionId: guestVoterId, userId: null, isAuthenticated: false },
      include: [{ model: Poll, as: 'poll', attributes: ['id', 'voteRestriction', 'purpose', 'organizationId'] }],
      transaction,
    });

    for (const vote of guestVotes) {
      const poll = vote.poll;
      const claimable = poll
        && poll.voteRestriction === 'anyone'
        && poll.purpose !== 'voting_intention'
        && !poll.organizationId;
      if (!claimable) continue;

      const accountVote = await PollVote.findOne({ where: { pollId: vote.pollId, userId }, transaction });
      if (accountVote) {
        await vote.destroy({ transaction });
        result.discarded += 1;
      } else {
        await vote.update({
          userId,
          isAuthenticated: true,
          sessionId: null,
          userAgent: null,
          identityVisibility: 'anonymous',
        }, { transaction });
        result.claimed += 1;
      }
    }
  });

  return result;
}

/**
 * Claim this browser's guest votes for a user who just signed in. Never fails the sign-in.
 */
async function claimGuestVotesForRequest(req, res, userId) {
  const guestVoterId = getGuestVoterId(req);
  if (!guestVoterId || !userId) return { claimed: 0, discarded: 0 };
  try {
    const result = await claimGuestVotes(userId, guestVoterId);
    clearGuestVoterId(res);
    return result;
  } catch (error) {
    console.error('[claimGuestVotes] Could not move guest votes to account:', error?.message || error);
    return { claimed: 0, discarded: 0 };
  }
}

module.exports = {
  claimGuestVotes,
  claimGuestVotesForRequest,
};
