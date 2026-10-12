'use strict';

// Reviewed content snapshot, not an unattended scraper. Dry run is the default.
const fs = require('node:fs');
const path = require('node:path');
const { Op } = require('sequelize');
const { sequelize, CivicQuestion, User, Location } = require('../models');
const snapshot = require('../data/parliament-2026-10-12.json');

const SOURCE_BASE = 'https://www.hellenicparliament.gr/Nomothetiko-Ergo/Anazitisi-Nomothetikou-Ergou?law_id=';

async function importParliamentQuestions({ apply = false, creatorId, backupPath, data = snapshot } = {}) {
  const creator = await User.findByPk(creatorId);
  if (!creator) throw new Error('Supply an existing author with --creator-id=<id>.');
  const locations = await Location.findAll({ where: { type: 'country', [Op.or]: [{ slug: 'greece' }, { code: 'GR' }, { name: 'Greece' }] } });
  if (locations.length !== 1) throw new Error('Expected exactly one Greece country record.');
  if (apply && !backupPath) throw new Error('An explicit --backup=<path> is required for apply.');
  const actions = [];

  await sequelize.transaction(async transaction => {
    // Serialize imports so a repeated/concurrent run cannot create duplicates.
    if (sequelize.getDialect() === 'postgres') {
      await sequelize.query('LOCK TABLE "CivicQuestions" IN SHARE ROW EXCLUSIVE MODE', { transaction });
    }
    const before = await CivicQuestion.findAll({ where: { sourceType: 'parliament' }, transaction });
    if (apply) {
      fs.mkdirSync(path.dirname(path.resolve(backupPath)), { recursive: true });
      fs.writeFileSync(backupPath, JSON.stringify({ savedAt: new Date().toISOString(), snapshot: data.checkedAt, questions: before.map(row => row.toJSON()) }, null, 2), { flag: 'wx', mode: 0o600 });
    }
    for (const item of [...data.items, ...(data.updates || [])]) {
      const originalLink = item.lawId ? SOURCE_BASE + item.lawId : undefined;
      const matches = before.filter(row =>
        (item.lawId && (row.officialIdentifier?.toLowerCase() === item.lawId.toLowerCase() || row.originalLink?.toLowerCase().includes('law_id=' + item.lawId.toLowerCase())))
        || (item.matchTitle && row.title === item.matchTitle)
      );
      if (matches.length > 1) throw new Error(`Ambiguous existing question: ${item.title}`);
      const existing = matches[0];
      if (item.updateOnly && !existing) {
        actions.push({ action: 'skip-missing', title: item.title });
        continue;
      }
      // Never downgrade a fresher source review or rewrite newly edited content.
      if (existing?.sourceCheckedAt && new Date(existing.sourceCheckedAt) >= new Date(data.checkedAt)) {
        actions.push({ action: 'skip-reviewed', id: existing.id, title: existing.title });
        continue;
      }
      const { lawId, matchTitle: _match, updateOnly: _only, ...content } = item;
      const values = {
        ...content,
        ...(lawId ? { originalLink, officialIdentifier: lawId, sourceCheckedAt: data.checkedAt } : {}),
      };
      actions.push({ action: existing ? 'update' : 'create', id: existing?.id, title: item.title });
      if (!apply) continue;
      if (existing) {
        // IDs, creators, vote restrictions, votes, and comments remain intact.
        await existing.update(values, { transaction });
      } else {
        await CivicQuestion.create({
          ...values, sourceType: 'parliament', creatorId: creator.id,
          locationId: locations[0].id, visibility: 'public', voteRestriction: 'locals_only',
          resultsVisibility: 'always', commentsEnabled: true, deadline: null,
        }, { transaction });
      }
    }
  });
  return actions;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const value = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  importParliamentQuestions({ apply: args.includes('--apply'), creatorId: Number(value('creator-id')), backupPath: value('backup') })
    .then(actions => console.log(JSON.stringify({ applied: args.includes('--apply'), actions }, null, 2)))
    .catch(error => { console.error(error.message); process.exitCode = 1; })
    .finally(() => sequelize.close());
}

module.exports = { importParliamentQuestions };
