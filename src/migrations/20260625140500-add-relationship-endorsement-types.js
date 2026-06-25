'use strict';

const RELATIONSHIP_ENDORSEMENT_TYPES = [
  'Real Profile',
  'Knows Personally',
  'Worked Together',
  'Local Connection'
];

module.exports = {
  up: async (queryInterface) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'postgres') return;

    for (const type of RELATIONSHIP_ENDORSEMENT_TYPES) {
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_Endorsements_topic" ADD VALUE IF NOT EXISTS '${type}';`
      );
    }
  },

  down: async () => {
    // PostgreSQL does not support removing enum values safely without rebuilding the type.
    // Leaving these values in place is harmless and preserves existing endorsements.
  }
};
