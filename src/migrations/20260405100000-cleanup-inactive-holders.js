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
    // Deleted rows cannot be restored; this migration is intentionally irreversible.
  },
};
