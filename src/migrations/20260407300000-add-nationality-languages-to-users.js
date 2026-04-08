'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');

    if (!columns.nationality) {
      await queryInterface.addColumn('Users', 'nationality', {
        type: Sequelize.STRING(2),
        allowNull: true,
        comment: 'ISO 3166-1 alpha-2 country code, e.g. GR, DE, US'
      });
    }

    if (!columns.languagesSpoken) {
      await queryInterface.addColumn('Users', 'languagesSpoken', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of BCP-47 language tags, e.g. ["el", "en"]'
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Users');
    if (columns.nationality) {
      await queryInterface.removeColumn('Users', 'nationality');
    }
    if (columns.languagesSpoken) {
      await queryInterface.removeColumn('Users', 'languagesSpoken');
    }
  }
};
