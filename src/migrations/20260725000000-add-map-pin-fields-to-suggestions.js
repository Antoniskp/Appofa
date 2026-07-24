'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Suggestions', 'mapLat', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true
    });
    await queryInterface.addColumn('Suggestions', 'mapLng', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true
    });
    await queryInterface.addColumn('Suggestions', 'mapIssueType', {
      type: Sequelize.STRING(40),
      allowNull: true
    });

    await queryInterface.addIndex('Suggestions', ['locationId', 'mapIssueType'], {
      name: 'suggestions_location_map_issue_type_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Suggestions', 'suggestions_location_map_issue_type_idx');
    await queryInterface.removeColumn('Suggestions', 'mapIssueType');
    await queryInterface.removeColumn('Suggestions', 'mapLng');
    await queryInterface.removeColumn('Suggestions', 'mapLat');
  }
};
