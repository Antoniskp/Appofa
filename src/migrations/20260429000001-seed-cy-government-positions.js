'use strict';

/**
 * Seeds Cyprus (CY) government positions into the GovernmentPositions table.
 *
 * This migration is safe to run even if the earlier generic seed migration
 * (20260331100000-seed-government-positions.js) was executed before CY.json
 * was added to the repository.  It uses INSERT OR IGNORE (SQLite) /
 * ON CONFLICT DO UPDATE (PostgreSQL) so it is idempotent and will not affect
 * existing Greece (GR) or other country rows.
 */

const path = require('path');
const cyPositions = require(path.join(__dirname, '../../config/countries/CY.json'));

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    const now = new Date();
    const nowStr = now.toISOString();
    // Use a consistent string timestamp for both dialects
    const ts = dialect === 'sqlite' ? nowStr : now;

    for (const pos of cyPositions.positions) {
      if (dialect === 'sqlite') {
        await queryInterface.sequelize.query(
          `INSERT OR IGNORE INTO "GovernmentPositions"
             (slug, title, "titleEn", "positionTypeKey", scope, "countryCode",
              description, "order", "isActive", "createdAt", "updatedAt")
           VALUES (:slug, :title, :titleEn, :positionTypeKey, :scope, 'CY',
                   NULL, :order, 1, :ts, :ts)`,
          {
            replacements: {
              slug: pos.slug,
              title: pos.title,
              titleEn: pos.titleEn || null,
              positionTypeKey: pos.positionTypeKey,
              scope: pos.scope || 'national',
              order: pos.order,
              ts,
            },
            type: queryInterface.sequelize.QueryTypes.INSERT,
          }
        );
      } else {
        await queryInterface.sequelize.query(
          `INSERT INTO "GovernmentPositions"
             (slug, title, "titleEn", "positionTypeKey", scope, "countryCode",
              description, "order", "isActive", "createdAt", "updatedAt")
           VALUES (:slug, :title, :titleEn, :positionTypeKey, :scope, 'CY',
                   NULL, :order, true, :ts, :ts)
           ON CONFLICT (slug) DO UPDATE SET
             title             = EXCLUDED.title,
             "titleEn"         = EXCLUDED."titleEn",
             "positionTypeKey" = EXCLUDED."positionTypeKey",
             scope             = EXCLUDED.scope,
             "countryCode"     = EXCLUDED."countryCode",
             "order"           = EXCLUDED."order",
             "updatedAt"       = EXCLUDED."updatedAt"`,
          {
            replacements: {
              slug: pos.slug,
              title: pos.title,
              titleEn: pos.titleEn || null,
              positionTypeKey: pos.positionTypeKey,
              scope: pos.scope || 'national',
              order: pos.order,
              ts,
            },
            type: queryInterface.sequelize.QueryTypes.INSERT,
          }
        );
      }
    }
  },

  async down(queryInterface) {
    const slugs = cyPositions.positions.map((p) => p.slug);
    if (slugs.length) {
      await queryInterface.bulkDelete('GovernmentPositions', { slug: slugs });
    }
  },
};
