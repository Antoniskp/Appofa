'use strict';

const path = require('path');
const { allPositions } = require(path.join(__dirname, '../../config/countries/index.js'));

// Keep legacy positions list for the `down` rollback (slugs only)
const { positions: LEGACY_POSITIONS } = require(path.join(__dirname, '../../config/governmentPositions.json'));

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    const now = new Date();

    for (const pos of allPositions) {
      if (dialect === 'sqlite') {
        await queryInterface.sequelize.query(
          `INSERT OR IGNORE INTO "GovernmentPositions"
             (slug, title, "titleEn", "positionTypeKey", scope, "countryCode", description, "order", "isActive", "createdAt", "updatedAt")
           VALUES
             (:slug, :title, :titleEn, :positionTypeKey, :scope, :countryCode, NULL, :order, 1, :createdAt, :updatedAt)`,
          {
            replacements: {
              slug: pos.slug,
              title: pos.title,
              titleEn: pos.titleEn || null,
              positionTypeKey: pos.positionTypeKey,
              scope: pos.scope || 'national',
              countryCode: pos.countryCode || 'GR',
              order: pos.order,
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
             (:slug, :title, :titleEn, :positionTypeKey, :scope, :countryCode, NULL, :order, true, :createdAt, :updatedAt)
           ON CONFLICT (slug) DO UPDATE SET
             "positionTypeKey" = EXCLUDED."positionTypeKey",
             scope = EXCLUDED.scope,
             "countryCode" = EXCLUDED."countryCode",
             title = EXCLUDED.title,
             "titleEn" = EXCLUDED."titleEn",
             "order" = EXCLUDED."order",
             "updatedAt" = EXCLUDED."updatedAt"`,
          {
            replacements: {
              slug: pos.slug,
              title: pos.title,
              titleEn: pos.titleEn || null,
              positionTypeKey: pos.positionTypeKey,
              scope: pos.scope || 'national',
              countryCode: pos.countryCode || 'GR',
              order: pos.order,
              createdAt: now,
              updatedAt: now,
            },
            type: queryInterface.sequelize.QueryTypes.INSERT,
          }
        );
      }
    }
  },

  async down(queryInterface) {
    const slugs = LEGACY_POSITIONS.map((p) => p.slug);
    await queryInterface.bulkDelete('GovernmentPositions', { slug: slugs });
  },
};
