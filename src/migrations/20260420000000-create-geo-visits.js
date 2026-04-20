'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('GeoVisits')) {
      await queryInterface.createTable('GeoVisits', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        countryCode: {
          type: Sequelize.STRING(5),
          allowNull: true,
        },
        countryName: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        isAuthenticated: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        isDiaspora: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        sessionHash: {
          type: Sequelize.STRING(64),
          allowNull: true,
        },
        path: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        locale: {
          type: Sequelize.STRING(10),
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });

      await queryInterface.addIndex('GeoVisits', ['countryCode'], {
        name: 'geo_visit_country_code_index',
      });
      await queryInterface.addIndex('GeoVisits', ['createdAt'], {
        name: 'geo_visit_created_at_index',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('GeoVisits').catch(() => {});
  },
};
