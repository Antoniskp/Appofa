'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Locations');

    if (!tableDescription.population_override) {
      await queryInterface.addColumn('Locations', 'population_override', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Moderator-set population override; takes precedence over the Wikipedia-derived population'
      });
      console.log('population_override column added to Locations table');
    } else {
      console.log('population_override column already exists, skipping addition');
    }
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeColumn('Locations', 'population_override');
    console.log('population_override column removed from Locations table');
  }
};
