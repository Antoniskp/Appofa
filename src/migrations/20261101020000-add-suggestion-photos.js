'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Suggestions', 'photos', { type: Sequelize.JSON, allowNull: true });
  },
  async down(queryInterface) { await queryInterface.removeColumn('Suggestions', 'photos'); },
};
