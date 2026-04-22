'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('CountryAccessRules')) {
      await queryInterface.createTable('CountryAccessRules', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        countryCode: {
          type: Sequelize.STRING(2),
          allowNull: false,
          unique: true,
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        createdByUserId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'SET NULL',
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
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CountryAccessRules').catch(() => {});
  },
};
