'use strict';

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    const now = new Date();
    const nowStr = now.toISOString();

    // Helper to get the correct timestamp value per dialect
    const ts = dialect === 'sqlite' ? nowStr : now;

    // -------------------------------------------------------------------------
    // 1. Rename ypoyrgos-oikonomikon → ypoyrgos-ethnikis-oikonomias
    //    FormationPicks.positionSlug is a plain string — update manually first.
    // -------------------------------------------------------------------------
    await queryInterface.sequelize.query(
      `UPDATE "FormationPicks"
         SET "positionSlug" = 'ypoyrgos-ethnikis-oikonomias',
             "updatedAt"    = :now
       WHERE "positionSlug" = 'ypoyrgos-oikonomikon'`,
      { replacements: { now: ts } }
    );

    if (dialect === 'sqlite') {
      // Ensure the new position row exists (copy metadata from old row when available)
      await queryInterface.sequelize.query(
        `INSERT OR IGNORE INTO "GovernmentPositions"
           (slug, title, "titleEn", "positionTypeKey", scope, "countryCode",
            description, "order", "isActive", "createdAt", "updatedAt")
         SELECT
           'ypoyrgos-ethnikis-oikonomias',
           'Υπουργός Εθνικής Οικονομίας και Οικονομικών',
           'Minister of National Economy and Finance',
           "positionTypeKey", scope, "countryCode", description,
           10, "isActive", :now, :now
         FROM "GovernmentPositions"
         WHERE slug = 'ypoyrgos-oikonomikon'`,
        { replacements: { now: nowStr } }
      );
      // Make sure title/titleEn/order are correct on the new row (covers the case
      // where it already existed from a previous seed run)
      await queryInterface.sequelize.query(
        `UPDATE "GovernmentPositions"
           SET title    = 'Υπουργός Εθνικής Οικονομίας και Οικονομικών',
               "titleEn" = 'Minister of National Economy and Finance',
               "order"   = 10,
               "updatedAt" = :now
         WHERE slug = 'ypoyrgos-ethnikis-oikonomias'`,
        { replacements: { now: nowStr } }
      );
    } else {
      // PostgreSQL: upsert — insert copying from old row if it exists, otherwise
      // update the already-existing new row.
      await queryInterface.sequelize.query(
        `INSERT INTO "GovernmentPositions"
           (slug, title, "titleEn", "positionTypeKey", scope, "countryCode",
            description, "order", "isActive", "createdAt", "updatedAt")
         SELECT
           'ypoyrgos-ethnikis-oikonomias',
           'Υπουργός Εθνικής Οικονομίας και Οικονομικών',
           'Minister of National Economy and Finance',
           "positionTypeKey", scope, "countryCode", description,
           10, "isActive", "createdAt", :now
         FROM "GovernmentPositions"
         WHERE slug = 'ypoyrgos-oikonomikon'
         ON CONFLICT (slug) DO UPDATE
           SET title       = EXCLUDED.title,
               "titleEn"   = EXCLUDED."titleEn",
               "order"     = EXCLUDED."order",
               "updatedAt" = EXCLUDED."updatedAt"`,
        { replacements: { now } }
      );
    }

    // Delete old row (CASCADE removes its DreamTeamVotes, GovernmentCurrentHolders,
    // GovernmentPositionSuggestions via FK onDelete:'CASCADE').
    await queryInterface.sequelize.query(
      `DELETE FROM "GovernmentPositions" WHERE slug = 'ypoyrgos-oikonomikon'`
    );

    // -------------------------------------------------------------------------
    // 2. Update ypoyrgos-paideias title
    // -------------------------------------------------------------------------
    await queryInterface.sequelize.query(
      `UPDATE "GovernmentPositions"
         SET title       = 'Υπουργός Παιδείας, Θρησκευμάτων και Αθλητισμού',
             "titleEn"   = 'Minister of Education, Religious Affairs and Sports',
             "order"     = 20,
             "updatedAt" = :now
       WHERE slug = 'ypoyrgos-paideias'`,
      { replacements: { now: ts } }
    );

    // -------------------------------------------------------------------------
    // 3. Update order values for remaining GR minister rows
    // -------------------------------------------------------------------------
    const orderUpdates = [
      { slug: 'ypoyrgos-eksoterikon',   order: 11 },
      { slug: 'ypoyrgos-amynas',        order: 12 },
      { slug: 'ypoyrgos-esoterikon',    order: 13 },
      { slug: 'ypoyrgos-ygeias',        order: 21 },
      { slug: 'ypoyrgos-ergasias',      order: 22 },
      { slug: 'ypoyrgos-anaptyxis',     order: 30 },
      { slug: 'ypoyrgos-ypodomon',      order: 31 },
      { slug: 'ypoyrgos-perivallon',    order: 32 },
      { slug: 'ypoyrgos-agrotikis',     order: 33 },
      { slug: 'ypoyrgos-prostasias',    order: 40 },
      { slug: 'ypoyrgos-dikaiosynis',   order: 41 },
      { slug: 'ypoyrgos-metanastefsis', order: 42 },
      { slug: 'ypoyrgos-politismoy',    order: 50 },
      { slug: 'ypoyrgos-tourismoy',     order: 51 },
      { slug: 'ypoyrgos-naftilias',     order: 52 },
      { slug: 'ypoyrgos-psifiakis',     order: 53 },
    ];

    for (const { slug, order } of orderUpdates) {
      await queryInterface.sequelize.query(
        `UPDATE "GovernmentPositions"
           SET "order" = :order, "updatedAt" = :now
         WHERE slug = :slug`,
        { replacements: { order, now: ts, slug } }
      );
    }

    // -------------------------------------------------------------------------
    // 4 & 5. Insert new positions (idempotent)
    // -------------------------------------------------------------------------
    const newPositions = [
      {
        slug:            'ypoyrgos-koinonikis-synochis',
        title:           'Υπουργός Κοινωνικής Συνοχής και Οικογένειας',
        titleEn:         'Minister of Social Cohesion and Family',
        positionTypeKey: 'minister',
        scope:           'national',
        countryCode:     'GR',
        order:           23,
      },
      {
        slug:            'ypoyrgos-klimatikis',
        title:           'Υπουργός Κλιματικής Κρίσης και Πολιτικής Προστασίας',
        titleEn:         'Minister of Climate Crisis and Civil Protection',
        positionTypeKey: 'minister',
        scope:           'national',
        countryCode:     'GR',
        order:           54,
      },
    ];

    for (const pos of newPositions) {
      if (dialect === 'sqlite') {
        await queryInterface.sequelize.query(
          `INSERT OR IGNORE INTO "GovernmentPositions"
             (slug, title, "titleEn", "positionTypeKey", scope, "countryCode",
              description, "order", "isActive", "createdAt", "updatedAt")
           VALUES (:slug, :title, :titleEn, :positionTypeKey, :scope, :countryCode,
                   NULL, :order, 1, :now, :now)`,
          {
            replacements: {
              ...pos,
              now: nowStr,
            },
          }
        );
        // Ensure correct values if row already existed
        await queryInterface.sequelize.query(
          `UPDATE "GovernmentPositions"
             SET title       = :title,
                 "titleEn"   = :titleEn,
                 "order"     = :order,
                 "updatedAt" = :now
           WHERE slug = :slug`,
          { replacements: { slug: pos.slug, title: pos.title, titleEn: pos.titleEn, order: pos.order, now: nowStr } }
        );
      } else {
        await queryInterface.sequelize.query(
          `INSERT INTO "GovernmentPositions"
             (slug, title, "titleEn", "positionTypeKey", scope, "countryCode",
              description, "order", "isActive", "createdAt", "updatedAt")
           VALUES (:slug, :title, :titleEn, :positionTypeKey, :scope, :countryCode,
                   NULL, :order, true, :now, :now)
           ON CONFLICT (slug) DO UPDATE
             SET title       = EXCLUDED.title,
                 "titleEn"   = EXCLUDED."titleEn",
                 "order"     = EXCLUDED."order",
                 "updatedAt" = EXCLUDED."updatedAt"`,
          {
            replacements: {
              ...pos,
              now,
            },
          }
        );
      }
    }

    // -------------------------------------------------------------------------
    // 6. Delete abolished ministry ypoyrgos-makethonias
    //    FormationPicks.positionSlug has no FK — delete manually.
    //    DreamTeamVotes, GovernmentCurrentHolders, GovernmentPositionSuggestions
    //    all have onDelete:'CASCADE' on positionId — covered by deleting the row.
    // -------------------------------------------------------------------------
    await queryInterface.sequelize.query(
      `DELETE FROM "FormationPicks"
       WHERE "positionSlug" = 'ypoyrgos-makethonias'`
    );

    await queryInterface.sequelize.query(
      `DELETE FROM "GovernmentPositions"
       WHERE slug = 'ypoyrgos-makethonias'`
    );
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    const now = new Date();
    const nowStr = now.toISOString();
    const ts = dialect === 'sqlite' ? nowStr : now;

    // -------------------------------------------------------------------------
    // 1. Remove the 2 new positions inserted in up()
    // -------------------------------------------------------------------------
    await queryInterface.sequelize.query(
      `DELETE FROM "GovernmentPositions"
       WHERE slug IN ('ypoyrgos-koinonikis-synochis', 'ypoyrgos-klimatikis')`
    );

    // -------------------------------------------------------------------------
    // 2. Re-insert abolished ypoyrgos-makethonias
    // -------------------------------------------------------------------------
    if (dialect === 'sqlite') {
      await queryInterface.sequelize.query(
        `INSERT OR IGNORE INTO "GovernmentPositions"
           (slug, title, "titleEn", "positionTypeKey", scope, "countryCode",
            description, "order", "isActive", "createdAt", "updatedAt")
         VALUES ('ypoyrgos-makethonias',
                 'Υπουργός Μακεδονίας και Θράκης',
                 'Minister of Macedonia and Thrace',
                 'minister', 'national', 'GR',
                 NULL, 55, 1, :now, :now)`,
        { replacements: { now: nowStr } }
      );
    } else {
      await queryInterface.sequelize.query(
        `INSERT INTO "GovernmentPositions"
           (slug, title, "titleEn", "positionTypeKey", scope, "countryCode",
            description, "order", "isActive", "createdAt", "updatedAt")
         VALUES ('ypoyrgos-makethonias',
                 'Υπουργός Μακεδονίας και Θράκης',
                 'Minister of Macedonia and Thrace',
                 'minister', 'national', 'GR',
                 NULL, 55, true, :now, :now)
         ON CONFLICT (slug) DO NOTHING`,
        { replacements: { now } }
      );
    }

    // -------------------------------------------------------------------------
    // 3. Rename ypoyrgos-ethnikis-oikonomias back to ypoyrgos-oikonomikon
    // -------------------------------------------------------------------------
    await queryInterface.sequelize.query(
      `UPDATE "FormationPicks"
         SET "positionSlug" = 'ypoyrgos-oikonomikon',
             "updatedAt"    = :now
       WHERE "positionSlug" = 'ypoyrgos-ethnikis-oikonomias'`,
      { replacements: { now: ts } }
    );

    await queryInterface.sequelize.query(
      `UPDATE "GovernmentPositions"
         SET slug        = 'ypoyrgos-oikonomikon',
             title       = 'Υπουργός Οικονομικών',
             "titleEn"   = 'Minister of Finance',
             "order"     = 10,
             "updatedAt" = :now
       WHERE slug = 'ypoyrgos-ethnikis-oikonomias'`,
      { replacements: { now: ts } }
    );

    // -------------------------------------------------------------------------
    // 4. Restore ypoyrgos-paideias to previous title
    // -------------------------------------------------------------------------
    await queryInterface.sequelize.query(
      `UPDATE "GovernmentPositions"
         SET title       = 'Υπουργός Παιδείας και Θρησκευμάτων',
             "titleEn"   = 'Minister of Education and Religious Affairs',
             "updatedAt" = :now
       WHERE slug = 'ypoyrgos-paideias'`,
      { replacements: { now: ts } }
    );
  },
};
