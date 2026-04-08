'use strict';

const KNOWN_TYPES = ['international', 'country', 'prefecture', 'municipality'];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [rows] = await queryInterface.sequelize.query(
        'SELECT id, slug, type FROM "Locations"',
        { transaction }
      );

      // Track which slugs we've already assigned in this migration run to handle collisions
      const usedSlugs = new Set(rows.map((r) => r.slug));

      for (const row of rows) {
        const prefix = `${row.type}-`;
        if (!row.slug.startsWith(prefix)) {
          // Already clean — nothing to do
          continue;
        }

        let newSlug = row.slug.slice(prefix.length);

        // Handle collision: if the clean slug is already taken, append numeric suffix
        if (usedSlugs.has(newSlug) && newSlug !== row.slug) {
          let counter = 2;
          while (usedSlugs.has(`${newSlug}-${counter}`)) {
            counter++;
          }
          newSlug = `${newSlug}-${counter}`;
        }

        usedSlugs.delete(row.slug);
        usedSlugs.add(newSlug);

        await queryInterface.sequelize.query(
          'UPDATE "Locations" SET slug = :newSlug WHERE id = :id',
          { replacements: { newSlug, id: row.id }, transaction }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    console.warn(
      '[20260408100000] WARNING: Rolling back slug cleanup is best-effort. ' +
        'For a full rollback, restore from a database backup.'
    );

    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [rows] = await queryInterface.sequelize.query(
        'SELECT id, slug, type FROM "Locations"',
        { transaction }
      );

      const usedSlugs = new Set(rows.map((r) => r.slug));

      for (const row of rows) {
        if (!KNOWN_TYPES.includes(row.type)) {
          continue;
        }

        const prefix = `${row.type}-`;

        // Skip rows whose slug already starts with the expected prefix
        if (row.slug.startsWith(prefix)) {
          continue;
        }

        let newSlug = `${prefix}${row.slug}`;

        // Handle collision
        if (usedSlugs.has(newSlug)) {
          let counter = 2;
          while (usedSlugs.has(`${newSlug}-${counter}`)) {
            counter++;
          }
          newSlug = `${newSlug}-${counter}`;
        }

        usedSlugs.delete(row.slug);
        usedSlugs.add(newSlug);

        await queryInterface.sequelize.query(
          'UPDATE "Locations" SET slug = :newSlug WHERE id = :id',
          { replacements: { newSlug, id: row.id }, transaction }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
