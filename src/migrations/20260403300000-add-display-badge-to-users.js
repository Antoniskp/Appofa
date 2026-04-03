'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    if (!tableDescription.displayBadgeSlug) {
      await queryInterface.addColumn('Users', 'displayBadgeSlug', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableDescription.displayBadgeTier) {
      await queryInterface.addColumn('Users', 'displayBadgeTier', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'displayBadgeSlug').catch(() => {});
    await queryInterface.removeColumn('Users', 'displayBadgeTier').catch(() => {});
  },
};
