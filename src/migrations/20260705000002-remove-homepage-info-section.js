'use strict';

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('HomepageSettings').catch(() => null);
    if (table?.infoSection) {
      await queryInterface.removeColumn('HomepageSettings', 'infoSection');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('HomepageSettings').catch(() => null);
    if (table && !table.infoSection) {
      await queryInterface.addColumn('HomepageSettings', 'infoSection', {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: JSON.stringify({
          enabled: false,
          audience: 'guest',
          bannerText: 'Ψήφισε ελεύθερα · Ανώνυμα',
          subText: 'Πριν γράψεις, καλό θα είναι να γνωρίζεις αυτά',
          bodyText: '',
          experimentalNotice: true,
          quickLinks: [],
          roadmap: [],
          done: [],
        }),
      });
    }
  },
};
