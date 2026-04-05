'use strict';

// Clean up stale GovernmentCurrentHolder rows where isActive = false.
// These are historical duplicates left behind by the old deactivate-instead-of-delete
// logic in adminCreateHolder and syncLocationRoleToHolder. Only the active holder per
// position should exist; inactive rows are irrelevant data.

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkDelete(
      'GovernmentCurrentHolders',
      { isActive: false },
      {}
    );
  },

  async down() {
    throw new Error('This migration cannot be reversed as permanently deleted holder rows cannot be restored.');
  },
};
