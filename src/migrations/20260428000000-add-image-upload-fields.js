'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add avatar upload fields to Users
    const usersDescription = await queryInterface.describeTable('Users').catch(() => null);
    if (usersDescription) {
      if (!usersDescription.avatarUrl) {
        await queryInterface.addColumn('Users', 'avatarUrl', {
          type: Sequelize.STRING(500),
          allowNull: true,
          comment: 'URL of the uploaded/optimized profile avatar',
        });
      }
      if (!usersDescription.avatarUpdatedAt) {
        await queryInterface.addColumn('Users', 'avatarUpdatedAt', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp of the last avatar upload',
        });
      }
    }

    // Add image upload fields to Locations
    const locationsDescription = await queryInterface.describeTable('Locations').catch(() => null);
    if (locationsDescription) {
      if (!locationsDescription.imageUrl) {
        await queryInterface.addColumn('Locations', 'imageUrl', {
          type: Sequelize.STRING(500),
          allowNull: true,
          comment: 'URL of the uploaded/optimized location image',
        });
      }
      if (!locationsDescription.imageUpdatedAt) {
        await queryInterface.addColumn('Locations', 'imageUpdatedAt', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp of the last location image upload',
        });
      }
      if (!locationsDescription.imageUpdatedBy) {
        await queryInterface.addColumn('Locations', 'imageUpdatedBy', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'SET NULL',
          comment: 'User ID who last uploaded the location image',
        });
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'avatarUrl').catch(() => {});
    await queryInterface.removeColumn('Users', 'avatarUpdatedAt').catch(() => {});
    await queryInterface.removeColumn('Locations', 'imageUrl').catch(() => {});
    await queryInterface.removeColumn('Locations', 'imageUpdatedAt').catch(() => {});
    await queryInterface.removeColumn('Locations', 'imageUpdatedBy').catch(() => {});
  },
};
