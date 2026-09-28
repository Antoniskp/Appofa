'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Polls', 'purpose', { type: Sequelize.STRING(40), allowNull: true }, { transaction });
      await queryInterface.addColumn('PollVotes', 'voterKey', { type: Sequelize.STRING(64), allowNull: true }, { transaction });
      await queryInterface.addIndex('PollVotes', ['pollId', 'voterKey'], {
        unique: true, name: 'unique_verified_identity_per_poll', transaction
      });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('PollVotes', 'unique_verified_identity_per_poll', { transaction });
      await queryInterface.removeColumn('PollVotes', 'voterKey', { transaction });
      await queryInterface.removeColumn('Polls', 'purpose', { transaction });
    });
  }
};
