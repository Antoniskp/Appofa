'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('HeroSettings').catch(() => null);
    if (!tableDescription) return;
    if (!tableDescription.counterEnabled) {
      await queryInterface.addColumn('HeroSettings', 'counterEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('HeroSettings', 'counterEnabled').catch(() => {});
  },
};
