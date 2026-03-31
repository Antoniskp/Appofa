'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    if (!tableDescription.dateOfBirth) {
      await queryInterface.addColumn('Users', 'dateOfBirth', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
      console.log('Added dateOfBirth column to Users table');
    }

    if (!tableDescription.professions) {
      await queryInterface.addColumn('Users', 'professions', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Added professions column to Users table');
    }

    if (!tableDescription.interests) {
      await queryInterface.addColumn('Users', 'interests', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Added interests column to Users table');
    }

    console.log('DOB, professions and interests migration completed successfully');
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('Users');

    for (const col of ['interests', 'professions', 'dateOfBirth']) {
      if (tableDescription[col]) {
        await queryInterface.removeColumn('Users', col);
        console.log(`Removed ${col} column from Users table`);
      }
    }

    console.log('DOB, professions and interests rollback completed successfully');
  }
};
