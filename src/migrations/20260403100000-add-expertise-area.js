'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const usersDesc = await queryInterface.describeTable('Users');
    if (!usersDesc.expertiseArea) {
      await queryInterface.addColumn('Users', 'expertiseArea', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Added expertiseArea column to Users table');
    }

    const personsDesc = await queryInterface.describeTable('PublicPersonProfiles');
    if (!personsDesc.expertiseArea) {
      await queryInterface.addColumn('PublicPersonProfiles', 'expertiseArea', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Added expertiseArea column to PublicPersonProfiles table');
    }

    console.log('expertiseArea migration completed successfully');
  },

  async down(queryInterface) {
    const usersDesc = await queryInterface.describeTable('Users');
    if (usersDesc.expertiseArea) {
      await queryInterface.removeColumn('Users', 'expertiseArea');
      console.log('Removed expertiseArea column from Users table');
    }

    const personsDesc = await queryInterface.describeTable('PublicPersonProfiles');
    if (personsDesc.expertiseArea) {
      await queryInterface.removeColumn('PublicPersonProfiles', 'expertiseArea');
      console.log('Removed expertiseArea column from PublicPersonProfiles table');
    }

    console.log('expertiseArea rollback completed successfully');
  }
};
