'use strict';

const { Op } = require('sequelize');
const { Poll, PollOption, Organization, HomepageSettings, sequelize } = require('../models');

const PURPOSE = 'voting_intention';
const DESCRIPTION = 'Μία ψήφος ανά λογαριασμό Google. Μπορείτε να αλλάξετε την επιλογή σας. Η επιλογή σας δεν εμφανίζεται δημόσια με το όνομά σας. Η σύνδεση Google δεν πιστοποιεί μοναδικό φυσικό πρόσωπο. Πρόκειται για ανοικτή διαδικτυακή ψηφοφορία συμμετοχής, όχι αντιπροσωπευτική δημοσκόπηση του εκλογικού σώματος.';

async function create(user, input = {}) {
  if (user.role !== 'admin') return { success: false, status: 403, message: 'Admin access required.' };
  const ids = input.partyIds;
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 40 || ids.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(ids).size !== ids.length) {
    return { success: false, status: 400, message: 'Select between 2 and 40 distinct parties.' };
  }
  const deadline = input.deadline ? new Date(input.deadline) : null;
  if (deadline && (!Number.isFinite(deadline.getTime()) || deadline <= new Date())) {
    return { success: false, status: 400, message: 'Choose a future deadline.' };
  }
  return sequelize.transaction(async transaction => {
    const parties = await Organization.findAll({ where: { id: { [Op.in]: ids }, type: 'party', isPublic: true }, transaction });
    if (parties.length !== ids.length) return { success: false, status: 400, message: 'Some selected parties are unavailable.' };
    const poll = await Poll.create({
      title: 'Αν είχαμε σήμερα βουλευτικές εκλογές, ποιο κόμμα θα ψηφίζατε;',
      description: DESCRIPTION, purpose: PURPOSE, category: 'Πρόθεση ψήφου',
      type: 'simple', creatorId: user.id, visibility: 'public', voteRestriction: 'authenticated',
      resultsVisibility: 'always', allowUserContributions: false, commentsEnabled: false, deadline
    }, { transaction });
    // Snapshot existing party names: subsequent organization edits must not change a ballot.
    const options = ids.map(id => ({ text: parties.find(party => party.id === id).name }));
    options.push(...['Άλλο κόμμα', 'Δεν έχω αποφασίσει', 'Λευκό / Άκυρο', 'Αποχή'].map(text => ({ text })));
    await PollOption.bulkCreate(options.map((option, order) => ({ ...option, pollId: poll.id, order })), { transaction });
    const settings = await HomepageSettings.findOne({ transaction, lock: transaction.LOCK.UPDATE })
      || await HomepageSettings.create({ id: 1 }, { transaction });
    await settings.update({ featuredPoll: { enabled: true, audience: 'all', pollId: poll.id } }, { transaction });
    return { success: true, data: { id: poll.id } };
  });
}

async function getCurrent(user, ip, userAgent) {
  const settings = await HomepageSettings.findOne();
  const featured = settings?.featuredPoll;
  if (!featured?.enabled || !featured.pollId) return { success: true, data: null };
  const poll = await Poll.findByPk(featured.pollId);
  if (!poll || poll.purpose !== PURPOSE || poll.visibility !== 'public' || poll.status !== 'active' || (poll.deadline && new Date(poll.deadline) <= new Date())) {
    return { success: true, data: null };
  }
  return require('./pollService').getPollById(poll.id, user, ip, userAgent);
}

module.exports = { create, getCurrent, PURPOSE, DESCRIPTION };
