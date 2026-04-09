'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');
    if (!columns.notificationPreferences) {
      await queryInterface.addColumn('Users', 'notificationPreferences', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON object of notification type → boolean (false = opted out). Null means all enabled.'
      });
    }
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Users');
    if (columns.notificationPreferences) {
      await queryInterface.removeColumn('Users', 'notificationPreferences');
    }
  }
};
