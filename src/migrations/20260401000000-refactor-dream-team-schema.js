'use strict';

/**
 * Safe migration: refactor Dream Team schema to data-driven, extensible architecture.
 *
 * Applies to: existing databases that were created with the old schema.
 * Fresh databases created after this PR are handled by 20260331000000-create-dream-team-tables.js.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();

    // ── 1. GovernmentPositions: replace category ENUM with positionTypeKey + scope + countryCode + jurisdictionId ──

    if (tables.includes('GovernmentPositions')) {
      const columns = await queryInterface.describeTable('GovernmentPositions');

      // Add positionTypeKey if missing (nullable first, then fill, then NOT NULL)
      if (!columns.positionTypeKey) {
        await queryInterface.addColumn('GovernmentPositions', 'positionTypeKey', {
          type: Sequelize.STRING(50),
          allowNull: true,
        });

        // Migrate category → positionTypeKey
        await queryInterface.sequelize.query(`
          UPDATE "GovernmentPositions"
          SET "positionTypeKey" = CASE
            WHEN category = 'president' AND slug = 'proedros-dimokratias' THEN 'head_of_state'
            WHEN slug = 'proedros-voulis' THEN 'parliament_speaker'
            WHEN category = 'prime_minister' THEN 'prime_minister'
            WHEN category = 'minister' THEN 'minister'
            ELSE 'minister'
          END
          WHERE "positionTypeKey" IS NULL
        `);

        if (dialect === 'sqlite') {
          // SQLite does not support ALTER COLUMN; positionTypeKey stays nullable in SQLite test env
        } else {
          await queryInterface.changeColumn('GovernmentPositions', 'positionTypeKey', {
            type: Sequelize.STRING(50),
            allowNull: false,
          });
        }
      }

      // Add scope if missing
      if (!columns.scope) {
        await queryInterface.addColumn('GovernmentPositions', 'scope', {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'national',
        });
      }

      // Add countryCode if missing
      if (!columns.countryCode) {
        await queryInterface.addColumn('GovernmentPositions', 'countryCode', {
          type: Sequelize.STRING(5),
          allowNull: false,
          defaultValue: 'GR',
        });
      }

      // Add jurisdictionId if missing
      if (!columns.jurisdictionId) {
        await queryInterface.addColumn('GovernmentPositions', 'jurisdictionId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Locations', key: 'id' },
          onDelete: 'SET NULL',
        });
      }

      // Drop category column
      if (columns.category) {
        await queryInterface.removeColumn('GovernmentPositions', 'category');
        // Drop PostgreSQL ENUM type if it exists
        if (dialect !== 'sqlite') {
          try {
            await queryInterface.sequelize.query(
              'DROP TYPE IF EXISTS "enum_GovernmentPositions_category";'
            );
          } catch {
            // Ignore if ENUM type doesn't exist
          }
        }
      }
    }

    // ── 2. GovernmentCurrentHolders: remove holderName/holderPhoto, make personId NOT NULL ──

    if (tables.includes('GovernmentCurrentHolders')) {
      const columns = await queryInterface.describeTable('GovernmentCurrentHolders');

      // Delete rows where personId IS NULL (old hardcoded-name-only rows)
      await queryInterface.sequelize.query(
        `DELETE FROM "GovernmentCurrentHolders" WHERE "personId" IS NULL`
      );

      // Make personId NOT NULL
      if (columns.personId && columns.personId.allowNull !== false) {
        if (dialect !== 'sqlite') {
          await queryInterface.changeColumn('GovernmentCurrentHolders', 'personId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'PublicPersonProfiles', key: 'id' },
            onDelete: 'CASCADE',
          });
        }
      }

      // Drop holderName
      if (columns.holderName) {
        await queryInterface.removeColumn('GovernmentCurrentHolders', 'holderName');
      }

      // Drop holderPhoto
      if (columns.holderPhoto) {
        await queryInterface.removeColumn('GovernmentCurrentHolders', 'holderPhoto');
      }
    }

    // ── 3. GovernmentPositionSuggestions: replace name with personId ──

    if (tables.includes('GovernmentPositionSuggestions')) {
      const columns = await queryInterface.describeTable('GovernmentPositionSuggestions');

      // Delete all existing suggestion rows (they have free-text names, invalid under new schema)
      await queryInterface.sequelize.query(
        `DELETE FROM "GovernmentPositionSuggestions"`
      );

      // Drop name column
      if (columns.name) {
        await queryInterface.removeColumn('GovernmentPositionSuggestions', 'name');
      }

      // Add personId column if missing
      if (!columns.personId) {
        await queryInterface.addColumn('GovernmentPositionSuggestions', 'personId', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'PublicPersonProfiles', key: 'id' },
          onDelete: 'CASCADE',
        });
      }
    }

    // ── 4. PublicPersonProfiles: drop position ENUM ──

    if (tables.includes('PublicPersonProfiles')) {
      const columns = await queryInterface.describeTable('PublicPersonProfiles');

      if (columns.position) {
        await queryInterface.removeColumn('PublicPersonProfiles', 'position');
        if (dialect !== 'sqlite') {
          try {
            await queryInterface.sequelize.query(
              'DROP TYPE IF EXISTS "enum_PublicPersonProfiles_position";'
            );
          } catch {
            // Ignore
          }
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();

    // ── Reverse 4: re-add position ENUM to PublicPersonProfiles ──
    if (tables.includes('PublicPersonProfiles')) {
      const columns = await queryInterface.describeTable('PublicPersonProfiles');
      if (!columns.position) {
        await queryInterface.addColumn('PublicPersonProfiles', 'position', {
          type: dialect === 'sqlite'
            ? Sequelize.STRING
            : Sequelize.ENUM('mayor', 'prefect', 'parliamentary'),
          allowNull: true,
        });
      }
    }

    // ── Reverse 3: restore name column, remove personId ──
    if (tables.includes('GovernmentPositionSuggestions')) {
      const columns = await queryInterface.describeTable('GovernmentPositionSuggestions');
      if (columns.personId) {
        await queryInterface.removeColumn('GovernmentPositionSuggestions', 'personId');
      }
      if (!columns.name) {
        await queryInterface.addColumn('GovernmentPositionSuggestions', 'name', {
          type: Sequelize.STRING(200),
          allowNull: true,
        });
      }
    }

    // ── Reverse 2: re-add holderName/holderPhoto, make personId nullable ──
    if (tables.includes('GovernmentCurrentHolders')) {
      const columns = await queryInterface.describeTable('GovernmentCurrentHolders');
      if (!columns.holderName) {
        await queryInterface.addColumn('GovernmentCurrentHolders', 'holderName', {
          type: Sequelize.STRING(200),
          allowNull: true,
        });
      }
      if (!columns.holderPhoto) {
        await queryInterface.addColumn('GovernmentCurrentHolders', 'holderPhoto', {
          type: Sequelize.STRING(500),
          allowNull: true,
        });
      }
      if (dialect !== 'sqlite') {
        await queryInterface.changeColumn('GovernmentCurrentHolders', 'personId', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'PublicPersonProfiles', key: 'id' },
          onDelete: 'SET NULL',
        });
      }
    }

    // ── Reverse 1: restore category ENUM, remove new columns ──
    if (tables.includes('GovernmentPositions')) {
      const columns = await queryInterface.describeTable('GovernmentPositions');

      if (!columns.category) {
        await queryInterface.addColumn('GovernmentPositions', 'category', {
          type: dialect === 'sqlite'
            ? Sequelize.STRING
            : Sequelize.ENUM('president', 'prime_minister', 'minister'),
          allowNull: true,
        });
      }
      if (columns.positionTypeKey) {
        await queryInterface.removeColumn('GovernmentPositions', 'positionTypeKey');
      }
      if (columns.scope) {
        await queryInterface.removeColumn('GovernmentPositions', 'scope');
      }
      if (columns.countryCode) {
        await queryInterface.removeColumn('GovernmentPositions', 'countryCode');
      }
      if (columns.jurisdictionId) {
        await queryInterface.removeColumn('GovernmentPositions', 'jurisdictionId');
      }
    }
  },
};
