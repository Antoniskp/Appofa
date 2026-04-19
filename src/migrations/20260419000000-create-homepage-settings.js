'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('HomepageSettings')) {
      await queryInterface.createTable('HomepageSettings', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        manifestSection: {
          type: Sequelize.TEXT,
          allowNull: false,
          defaultValue: JSON.stringify({ enabled: true, audience: 'all' }),
        },
        infoSection: {
          type: Sequelize.TEXT,
          allowNull: false,
          defaultValue: JSON.stringify({
            enabled: false,
            audience: 'guest',
            bannerText: 'Ψήφισε ελεύθερα · Ανώνυμα',
            subText: 'Πριν γράψεις, καλό θα είναι να γνωρίζεις αυτά',
            experimentalNotice: true,
            quickLinks: [],
            roadmap: [],
            done: [],
          }),
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
    await queryInterface.dropTable('HomepageSettings').catch(() => {});
  },
};
