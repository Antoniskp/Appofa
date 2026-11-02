'use strict';

const { createHash } = require('crypto');
const { Op } = require('sequelize');
const { sequelize, Organization, PolicyCategory, OrganizationPosition, PositionRevision, PositionSource } = require('../models');
const party = require('../../config/partyLogos.json').find(entry => entry.id === 'antarsya');

const proposals = [
  ['economy', 'debt', 'Διαγραφή του δημόσιου χρέους', 'Στην εκλογική προκήρυξη του 2014, η ΑΝΤΑΡΣΥΑ ζητούσε να σταματήσει η Ελλάδα τις πληρωμές προς τους πιστωτές και να διαγράψει το δημόσιο χρέος.'],
  ['economy', 'banks', 'Εθνικοποίηση των τραπεζών', 'Στην ίδια προκήρυξη του 2014, η ΑΝΤΑΡΣΥΑ πρότεινε να περάσουν οι τράπεζες στο Δημόσιο χωρίς αποζημίωση των ιδιοκτητών, με έλεγχο από τους εργαζομένους και την κοινωνία.'],
  ['foreign-policy', 'eu', 'Αποχώρηση από την Ευρωπαϊκή Ένωση', 'Στην εκλογική προκήρυξη του 2014, η ΑΝΤΑΡΣΥΑ υποστήριζε την άμεση αποχώρηση της Ελλάδας από την Ευρωπαϊκή Ένωση.'],
  ['environment', 'energy', 'Αντίθεση στην ιδιωτικοποίηση της ενέργειας', 'Στις βουλευτικές εκλογές του Μαΐου 2023, η ΑΝΤΑΡΣΥΑ τάχθηκε κατά της ιδιωτικοποίησης του ενεργειακού τομέα.'],
];

async function seed() {
  return sequelize.transaction(async transaction => {
    const matches = await Organization.findAll({
      where: { type: 'party', [Op.or]: [{ slug: party.id }, { name: party.names }] },
      transaction, lock: transaction.LOCK.UPDATE,
    });
    if (matches.length !== 1) throw new Error('Expected exactly one ANTARSYA party organization.');
    let added = 0;
    for (const [slug, key, title, body] of proposals) {
      const sourceUrl = key === 'energy' ? 'https://antarsya.gr/node/6390' : 'https://antarsya.gr/node/2154';
      const provider = 'ΑΝΤΑΡΣΥΑ';
      const externalId = 'antarsya-' + key;
      if (await PositionSource.count({ where: { provider, externalId }, transaction })) continue;
      const category = await PolicyCategory.findOne({ where: { slug }, transaction });
      if (!category) throw new Error('Missing policy category ' + slug);
      const position = await OrganizationPosition.create({ organizationId: matches[0].id, categoryId: category.id }, { transaction });
      const revision = await PositionRevision.create({ positionId: position.id, version: 1, title, body, attribution: 'sourced', status: 'draft' }, { transaction });
      await PositionSource.create({ revisionId: revision.id, provider, externalId, sourceUrl, retrievedAt: new Date('2026-11-02'), contentFingerprint: createHash('sha256').update(JSON.stringify([sourceUrl, null, title, body])).digest('hex') }, { transaction });
      added++;
    }
    return added;
  });
}

seed().then(count => console.log('Added ' + count + ' ANTARSYA drafts.'))
  .catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
