const { DataTypes, Op } = require('sequelize');

async function change(qi, upgrading) {
  await qi.sequelize.transaction(async transaction => {
    const options = { transaction };
    const sqlite = qi.sequelize.getDialect() === 'sqlite';
    if (upgrading) {
      await qi.addColumn('PositionRevisions', 'explanation', { type: DataTypes.TEXT }, options);
    } else {
      await qi.bulkDelete('PositionVotes', { value: 2 }, options);
    }
    await qi.removeConstraint('PositionVotes', 'position_vote_value_check', options);
    await qi.addConstraint('PositionVotes', {
      fields: ['value'], type: 'check', name: 'position_vote_value_check',
      where: { value: { [Op.in]: upgrading ? [-1, 1, 2] : [-1, 1] } }, transaction,
    });
    if (sqlite) {
      await qi.sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS position_votes_revision_id_user_id ON "PositionVotes" ("revisionId", "userId")', options);
    }
    if (!upgrading) {
      await qi.sequelize.query('ALTER TABLE "PositionRevisions" DROP COLUMN "explanation"', options);
    }
  });
}

module.exports = { up: qi => change(qi, true), down: qi => change(qi, false) };
