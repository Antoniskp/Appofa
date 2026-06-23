'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Organizations');
    if (tableDescription.politicalPosition) return; // already applied

    const dialect = queryInterface.sequelize.getDialect();
    await queryInterface.addColumn('Organizations', 'politicalPosition', {
      type: dialect === 'postgres'
        ? Sequelize.ENUM('far-left', 'left', 'center-left', 'center-right', 'right', 'far-right', 'independent')
        : Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Organizations', 'politicalPosition');
  },
};
