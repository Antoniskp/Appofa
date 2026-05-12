'use strict';

module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.removeIndex('LocationRoles', 'idx_location_roles_unique');
    } catch {
      // index may not exist in some environments
    }

    await queryInterface.addIndex('LocationRoles', ['locationId', 'roleKey', 'userId'], {
      unique: true,
      name: 'idx_location_roles_unique_role_holder',
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('LocationRoles', 'idx_location_roles_unique_role_holder');
    } catch {
      // index may not exist in some environments
    }

    await queryInterface.addIndex('LocationRoles', ['locationId', 'roleKey'], {
      unique: true,
      name: 'idx_location_roles_unique',
    });
  },
};
