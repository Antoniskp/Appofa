'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('NewsletterCampaigns');
    for (const [name, type] of Object.entries({
      lastTestSentAt: Sequelize.DATE,
      lastTestSentTo: Sequelize.STRING(255),
      lastTestContentHash: Sequelize.STRING(64),
    })) {
      if (!table[name]) await queryInterface.addColumn('NewsletterCampaigns', name, { type, allowNull: true });
    }
  },
  async down(queryInterface) {
    const table = await queryInterface.describeTable('NewsletterCampaigns');
    for (const name of ['lastTestSentAt', 'lastTestSentTo', 'lastTestContentHash']) {
      if (table[name]) await queryInterface.removeColumn('NewsletterCampaigns', name);
    }
  },
};
