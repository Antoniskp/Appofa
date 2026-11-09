'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      INSERT INTO "UserPoliticalAffiliations"
        ("userId", "organizationId", "endorsementLevel", "createdAt", "updatedAt")
      SELECT u."id", o."id", 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM "Users" u
      INNER JOIN "Organizations" o
        ON o."slug" = u."partyId" AND o."type" = 'party'
      WHERE u."claimStatus" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "UserPoliticalAffiliations" upa
          WHERE upa."userId" = u."id" AND upa."organizationId" = o."id"
        )
    `, { type: Sequelize.QueryTypes.INSERT });
  },

  async down() {
    // Affiliation rows may have been edited after backfilling, so rollback leaves them intact.
  },
};
