'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "unique_location_name_per_parent";
    `);

    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT
          id,
          FIRST_VALUE(id) OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS keep_id,
          ROW_NUMBER() OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS row_num
        FROM "Locations"
      ),
      duplicates AS (
        SELECT id AS duplicate_id, keep_id
        FROM ranked
        WHERE row_num > 1
      )
      UPDATE "Locations" l
      SET parent_id = d.keep_id
      FROM duplicates d
      WHERE l.parent_id = d.duplicate_id;
    `);

    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT
          id,
          FIRST_VALUE(id) OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS keep_id,
          ROW_NUMBER() OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS row_num
        FROM "Locations"
      ),
      duplicates AS (
        SELECT id AS duplicate_id, keep_id
        FROM ranked
        WHERE row_num > 1
      )
      UPDATE "LocationLinks" ll
      SET location_id = d.keep_id
      FROM duplicates d
      WHERE ll.location_id = d.duplicate_id;
    `);

    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT
          id,
          FIRST_VALUE(id) OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS keep_id,
          ROW_NUMBER() OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS row_num
        FROM "Locations"
      ),
      duplicates AS (
        SELECT id AS duplicate_id, keep_id
        FROM ranked
        WHERE row_num > 1
      )
      UPDATE "Messages" m
      SET "locationId" = d.keep_id
      FROM duplicates d
      WHERE m."locationId" = d.duplicate_id;
    `);

    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT
          id,
          FIRST_VALUE(id) OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS keep_id,
          ROW_NUMBER() OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS row_num
        FROM "Locations"
      ),
      duplicates AS (
        SELECT id AS duplicate_id, keep_id
        FROM ranked
        WHERE row_num > 1
      )
      UPDATE "Polls" p
      SET "locationId" = d.keep_id
      FROM duplicates d
      WHERE p."locationId" = d.duplicate_id;
    `);

    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT
          id,
          FIRST_VALUE(id) OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS keep_id,
          ROW_NUMBER() OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS row_num
        FROM "Locations"
      ),
      duplicates AS (
        SELECT id AS duplicate_id, keep_id
        FROM ranked
        WHERE row_num > 1
      )
      UPDATE "Users" u
      SET "homeLocationId" = d.keep_id
      FROM duplicates d
      WHERE u."homeLocationId" = d.duplicate_id;
    `);

    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY type, LOWER(TRIM(name)), COALESCE(parent_id, -1)
            ORDER BY id
          ) AS row_num
        FROM "Locations"
      )
      DELETE FROM "Locations" l
      USING ranked r
      WHERE l.id = r.id
        AND r.row_num > 1;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "unique_location_name_per_parent"
      ON "Locations" (type, LOWER(TRIM(name)), COALESCE(parent_id, -1));
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "unique_location_name_per_parent";
    `);

    await queryInterface.addIndex('Locations', ['type', 'name', 'parent_id'], {
      unique: true,
      name: 'unique_location_name_per_parent'
    });
  }
};