'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    if (!tableDescription.mobileTel) {
      await queryInterface.addColumn('Users', 'mobileTel', {
        type: Sequelize.STRING(30),
        allowNull: true
      });
      console.log('Added mobileTel column to Users table');
    }

    if (!tableDescription.bio) {
      await queryInterface.addColumn('Users', 'bio', {
        type: Sequelize.STRING(280),
        allowNull: true
      });
      console.log('Added bio column to Users table');
    }

    if (!tableDescription.socialLinks) {
      await queryInterface.addColumn('Users', 'socialLinks', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      console.log('Added socialLinks column to Users table');
    }

    if (!tableDescription.isVerified) {
      await queryInterface.addColumn('Users', 'isVerified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('Added isVerified column to Users table');
    }

    if (!tableDescription.verifiedAt) {
      await queryInterface.addColumn('Users', 'verifiedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('Added verifiedAt column to Users table');
    }

    if (!tableDescription.verifiedByUserId) {
      await queryInterface.addColumn('Users', 'verifiedByUserId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      });
      console.log('Added verifiedByUserId column to Users table');
    }

    if (!tableDescription.verifiedScopeLocationId) {
      await queryInterface.addColumn('Users', 'verifiedScopeLocationId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id'
        },
        onDelete: 'SET NULL'
      });
      console.log('Added verifiedScopeLocationId column to Users table');
    }

    console.log('User profile fields migration completed successfully');
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('Users');

    for (const col of ['verifiedScopeLocationId', 'verifiedByUserId', 'verifiedAt', 'isVerified', 'socialLinks', 'bio', 'mobileTel']) {
      if (tableDescription[col]) {
        await queryInterface.removeColumn('Users', col);
        console.log(`Removed ${col} column from Users table`);
      }
    }

    console.log('User profile fields rollback completed successfully');
  }
};
