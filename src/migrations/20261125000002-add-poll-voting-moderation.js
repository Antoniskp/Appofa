'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async transaction => {
      const options = { transaction };
      if (sequelize.getDialect() === 'postgres') {
        await sequelize.query(`ALTER TYPE "enum_Reports_category" ADD VALUE IF NOT EXISTS 'vote_manipulation'`, options);
      }
      const columns = await queryInterface.describeTable('Users', options);
      if (!columns.pollVotingBlocked) {
        await queryInterface.addColumn('Users', 'pollVotingBlocked', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        }, options);
      }
    });
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async transaction => {
      const options = { transaction };
      // Preserve reports when rolling back to code that has no vote manipulation category.
      await queryInterface.bulkUpdate('Reports', { category: 'other' }, { category: 'vote_manipulation' }, options);
      const columns = await queryInterface.describeTable('Users', options);
      if (columns.pollVotingBlocked) await queryInterface.removeColumn('Users', 'pollVotingBlocked', options);
    });
  },
};
