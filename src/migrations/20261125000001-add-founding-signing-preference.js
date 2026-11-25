'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('FoundingInterests', 'signingPreference', {
      type: Sequelize.STRING(12), allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE "FoundingInterests" DROP COLUMN "signingPreference"');
  },
};
