'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change photoUrl from STRING to TEXT
    await queryInterface.changeColumn('PollOptions', 'photoUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Change linkUrl from STRING to TEXT
    await queryInterface.changeColumn('PollOptions', 'linkUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    console.log('Updated photoUrl and linkUrl to TEXT in PollOptions table');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to STRING (be careful - this might truncate long URLs!)
    await queryInterface.changeColumn('PollOptions', 'photoUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('PollOptions', 'linkUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });

    console.log('Reverted photoUrl and linkUrl to STRING in PollOptions table');
  }
};
