'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('HeroSettings')) {
      await queryInterface.createTable('HeroSettings', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        backgroundImageUrl: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: '',
        },
        backgroundColor: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: '#1a2a3a',
        },
        slides: {
          type: Sequelize.TEXT,
          allowNull: false,
          defaultValue: '[]',
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
    await queryInterface.dropTable('HeroSettings').catch(() => {});
  },
};
