'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('NewsletterSubscribers');
    for (const [name, type] of Object.entries({ preferences: Sequelize.JSON, profileReminderSentAt: Sequelize.DATE, profileReminderClaimedAt: Sequelize.DATE })) {
      if (!table[name]) await queryInterface.addColumn('NewsletterSubscribers', name, { type, allowNull: true });
    }
  },
  async down(queryInterface) {
    const table = await queryInterface.describeTable('NewsletterSubscribers');
    for (const name of ['preferences', 'profileReminderSentAt', 'profileReminderClaimedAt']) {
      if (table[name]) await queryInterface.removeColumn('NewsletterSubscribers', name);
    }
  },
};
