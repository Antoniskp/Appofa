'use strict';

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    const now = new Date();

    if (dialect === 'sqlite') {
      await queryInterface.sequelize.query(
        `INSERT OR REPLACE INTO "GovernmentPositions"
           (slug, title, "titleEn", "positionTypeKey", scope, "countryCode", description, "order", "isActive", "createdAt", "updatedAt")
         VALUES
           ('proedros-voulis', 'Πρόεδρος της Βουλής', 'Speaker of Parliament', 'parliament_speaker', 'national', 'GR', NULL, 2 /* order from config */, 1, :createdAt, :updatedAt)`,
        {
          replacements: {
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
          type: queryInterface.sequelize.QueryTypes.INSERT,
        }
      );
    } else {
      await queryInterface.sequelize.query(
        `INSERT INTO "GovernmentPositions"
           (slug, title, "titleEn", "positionTypeKey", scope, "countryCode", description, "order", "isActive", "createdAt", "updatedAt")
         VALUES
           ('proedros-voulis', 'Πρόεδρος της Βουλής', 'Speaker of Parliament', 'parliament_speaker', 'national', 'GR', NULL, 2 /* order from config */, true, :createdAt, :updatedAt)
         ON CONFLICT (slug) DO UPDATE SET
           "isActive"       = true,
           "positionTypeKey" = 'parliament_speaker',
           title            = 'Πρόεδρος της Βουλής',
           "titleEn"        = 'Speaker of Parliament',
           scope            = 'national',
           "countryCode"    = 'GR',
           "order"          = 2,
           "updatedAt"      = :updatedAt`,
        {
          replacements: {
            createdAt: now,
            updatedAt: now,
          },
          type: queryInterface.sequelize.QueryTypes.INSERT,
        }
      );
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    const now = new Date();

    if (dialect === 'sqlite') {
      await queryInterface.sequelize.query(
        `UPDATE "GovernmentPositions" SET "isActive" = 0, "updatedAt" = :updatedAt WHERE slug = 'proedros-voulis'`,
        {
          replacements: { updatedAt: now.toISOString() },
          type: queryInterface.sequelize.QueryTypes.UPDATE,
        }
      );
    } else {
      await queryInterface.sequelize.query(
        `UPDATE "GovernmentPositions" SET "isActive" = false, "updatedAt" = :updatedAt WHERE slug = 'proedros-voulis'`,
        {
          replacements: { updatedAt: now },
          type: queryInterface.sequelize.QueryTypes.UPDATE,
        }
      );
    }
  },
};
