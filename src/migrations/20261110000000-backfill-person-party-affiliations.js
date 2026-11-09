'use strict';

const path = require('path');

const normalizeName = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('el')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

module.exports = {
  async up(queryInterface, Sequelize) {
    const { parties } = require(path.join(__dirname, '..', '..', 'config', 'politicalParties.json'));
    const [users] = await queryInterface.sequelize.query(
      'SELECT id, "partyId" FROM "Users" WHERE "partyId" IS NOT NULL'
    );
    const [organizations] = await queryInterface.sequelize.query(
      'SELECT id, slug, name FROM "Organizations" WHERE type = \'party\''
    );
    const orgBySlug = new Map(organizations.map((organization) => [organization.slug, organization]));
    const orgByName = new Map(organizations.map((organization) => [normalizeName(organization.name), organization]));

    for (const user of users) {
      let organization = orgBySlug.get(user.partyId);
      if (!organization) {
        const legacyParty = parties.find((party) => party.id === user.partyId);
        if (legacyParty) {
          organization = orgBySlug.get(legacyParty.id)
            || [legacyParty.name, legacyParty.nameEn, legacyParty.abbreviation, legacyParty.abbreviationEn]
              .map(normalizeName)
              .map((name) => orgByName.get(name))
              .find(Boolean);
        }
      }
      if (!organization) continue;

      await queryInterface.sequelize.query(
        `INSERT INTO "UserPoliticalAffiliations"
          ("userId", "organizationId", "endorsementLevel", "createdAt", "updatedAt")
         VALUES (:userId, :organizationId, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("userId", "organizationId") DO NOTHING`,
        { replacements: { userId: user.id, organizationId: organization.id }, type: Sequelize.QueryTypes.INSERT }
      );
    }
  },

  async down() {
    // Affiliation rows may have been edited after backfilling, so rollback leaves them intact.
  },
};
