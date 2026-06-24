'use strict';

const path = require('path');

/**
 * Data migration: populate politicalPosition on party organizations and migrate
 * existing User.partyId → UserPoliticalAffiliation records.
 *
 * The mapping is derived from config/politicalParties.json which contains the
 * old hardcoded parties along with their political positions.  We look up
 * Organizations by slug (the party slug from the config file) or by name
 * fuzzy-match as a fallback.
 */
module.exports = {
  async up(queryInterface) {
    const partiesConfig = require(path.join(__dirname, '..', '..', 'config', 'politicalParties.json'));

    const [orgs] = await queryInterface.sequelize.query(
      `SELECT id, slug, name, type FROM "Organizations" WHERE type = 'party'`
    );

    // Build lookup maps: slug→orgId and abbreviated-name→orgId
    const slugToOrgId = {};
    for (const org of orgs) {
      slugToOrgId[org.slug] = org.id;
    }

    // Map config party id to org id and set politicalPosition
    const partyIdToOrgId = {};
    for (const party of partiesConfig.parties) {
      const orgId = slugToOrgId[party.id] || slugToOrgId[party.id.toLowerCase()];
      if (orgId && party.position) {
        partyIdToOrgId[party.id] = orgId;
        await queryInterface.sequelize.query(
          `UPDATE "Organizations" SET "politicalPosition" = :pos WHERE id = :id`,
          { replacements: { pos: party.position, id: orgId } }
        );
      }
    }

    // Migrate User.partyId → UserPoliticalAffiliation records
    // Check if partyId column still exists on Users before trying to read it
    let partyIdExists = false;
    try {
      const description = await queryInterface.describeTable('Users');
      partyIdExists = !!description.partyId;
    } catch {
      partyIdExists = false;
    }

    if (!partyIdExists || Object.keys(partyIdToOrgId).length === 0) return;

    const [usersWithParty] = await queryInterface.sequelize.query(
      `SELECT id, "partyId" FROM "Users" WHERE "partyId" IS NOT NULL`
    );

    const now = new Date().toISOString();
    for (const u of usersWithParty) {
      const orgId = partyIdToOrgId[u.partyId];
      if (!orgId) continue;

      // Upsert: ignore if already exists
      await queryInterface.sequelize.query(
        `INSERT INTO "UserPoliticalAffiliations" ("userId", "organizationId", "endorsementLevel", "createdAt", "updatedAt")
         VALUES (:userId, :orgId, 'neutral', :now, :now)
         ON CONFLICT ("userId", "organizationId") DO NOTHING`,
        { replacements: { userId: u.id, orgId, now } }
      );
    }
  },

  async down(_queryInterface) {
    // Reversing this data migration is intentionally a no-op: we do not want
    // to destroy UserPoliticalAffiliation rows or reset politicalPosition
    // values when rolling back this single migration step, because the
    // structural migrations (which create the table) handle their own rollback.
  },
};
