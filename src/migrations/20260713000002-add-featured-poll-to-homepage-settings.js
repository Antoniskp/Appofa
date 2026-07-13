'use strict';

const DEFAULT_FEATURED_POLL = { enabled: false, audience: 'all', pollId: null };

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('HomepageSettings').catch(() => null);
    if (table && !table.featuredPoll) {
      await queryInterface.addColumn('HomepageSettings', 'featuredPoll', {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: JSON.stringify(DEFAULT_FEATURED_POLL),
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('HomepageSettings').catch(() => null);
    if (table?.featuredPoll) {
      await queryInterface.removeColumn('HomepageSettings', 'featuredPoll');
    }
  },
};
