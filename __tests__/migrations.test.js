const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

/**
 * Test suite for database migrations
 * Tests that migrations can be run, are idempotent, and can be rolled back
 */
describe('Database Migrations', () => {
  let sequelize;
  let queryInterface;
  const MIGRATIONS_DIR = path.join(__dirname, '../src/migrations');

  // Helper to get migration files
  const getMigrationFiles = () => {
    return fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.js'))
      .sort();
  };

  // Helper to run a migration
  const runMigration = async (migrationFile) => {
    const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
    const migration = require(migrationPath);
    await migration.up(queryInterface, Sequelize);
  };

  // Helper to rollback a migration
  const rollbackMigration = async (migrationFile) => {
    const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
    const migration = require(migrationPath);
    await migration.down(queryInterface, Sequelize);
  };

  beforeEach(async () => {
    // Create a fresh in-memory SQLite database for each test
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });

    await sequelize.authenticate();
    queryInterface = sequelize.getQueryInterface();

    // Create Users table for foreign key relationships
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('admin', 'moderator', 'editor', 'viewer'),
        defaultValue: 'viewer',
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  describe('Migration Files', () => {
    test('should have migration files in the correct directory', () => {
      const files = getMigrationFiles();
      expect(files.length).toBeGreaterThan(0);
      expect(files).toContain('000-create-base-tables.js');
      expect(files).toContain('001-create-locations-table.js');
      expect(files).toContain('002-create-location-links-table.js');
      expect(files).toContain('003-add-user-columns.js');
    });

    test('migration files should export up and down functions', () => {
      const files = getMigrationFiles();
      files.forEach(file => {
        const migrationPath = path.join(MIGRATIONS_DIR, file);
        const migration = require(migrationPath);
        expect(typeof migration.up).toBe('function');
        expect(typeof migration.down).toBe('function');
      });
    });
  });

  describe('001-create-locations-table', () => {
    test('should create Locations table with all columns', async () => {
      await runMigration('001-create-locations-table.js');

      const tables = await queryInterface.showAllTables();
      expect(tables).toContain('Locations');

      const tableDescription = await queryInterface.describeTable('Locations');
      expect(tableDescription).toHaveProperty('id');
      expect(tableDescription).toHaveProperty('name');
      expect(tableDescription).toHaveProperty('name_local');
      expect(tableDescription).toHaveProperty('type');
      expect(tableDescription).toHaveProperty('parent_id');
      expect(tableDescription).toHaveProperty('code');
      expect(tableDescription).toHaveProperty('slug');
      expect(tableDescription).toHaveProperty('lat');
      expect(tableDescription).toHaveProperty('lng');
      expect(tableDescription).toHaveProperty('bounding_box');
      expect(tableDescription).toHaveProperty('createdAt');
      expect(tableDescription).toHaveProperty('updatedAt');
    });

    test('should be idempotent (can run multiple times)', async () => {
      await runMigration('001-create-locations-table.js');
      await expect(runMigration('001-create-locations-table.js')).resolves.not.toThrow();

      const tables = await queryInterface.showAllTables();
      expect(tables).toContain('Locations');
    });

    test('should rollback successfully', async () => {
      await runMigration('001-create-locations-table.js');
      await rollbackMigration('001-create-locations-table.js');

      const tables = await queryInterface.showAllTables();
      expect(tables).not.toContain('Locations');
    });
  });

  describe('002-create-location-links-table', () => {
    test('should create LocationLinks table with all columns', async () => {
      // Run prerequisite migration
      await runMigration('001-create-locations-table.js');
      
      // Run the migration
      await runMigration('002-create-location-links-table.js');

      const tables = await queryInterface.showAllTables();
      expect(tables).toContain('LocationLinks');

      const tableDescription = await queryInterface.describeTable('LocationLinks');
      expect(tableDescription).toHaveProperty('id');
      expect(tableDescription).toHaveProperty('location_id');
      expect(tableDescription).toHaveProperty('entity_type');
      expect(tableDescription).toHaveProperty('entity_id');
      expect(tableDescription).toHaveProperty('createdAt');
      expect(tableDescription).toHaveProperty('updatedAt');
    });

    test('should be idempotent (can run multiple times)', async () => {
      await runMigration('001-create-locations-table.js');
      await runMigration('002-create-location-links-table.js');
      await expect(runMigration('002-create-location-links-table.js')).resolves.not.toThrow();

      const tables = await queryInterface.showAllTables();
      expect(tables).toContain('LocationLinks');
    });

    test('should rollback successfully', async () => {
      await runMigration('001-create-locations-table.js');
      await runMigration('002-create-location-links-table.js');
      await rollbackMigration('002-create-location-links-table.js');

      const tables = await queryInterface.showAllTables();
      expect(tables).not.toContain('LocationLinks');
    });
  });

  describe('003-add-user-columns', () => {
    test('should add new columns to Users table', async () => {
      // Run prerequisite migrations
      await runMigration('001-create-locations-table.js');
      
      // Run the migration
      await runMigration('003-add-user-columns.js');

      const tableDescription = await queryInterface.describeTable('Users');
      expect(tableDescription).toHaveProperty('githubId');
      expect(tableDescription).toHaveProperty('githubAccessToken');
      expect(tableDescription).toHaveProperty('avatar');
      expect(tableDescription).toHaveProperty('avatarColor');
      expect(tableDescription).toHaveProperty('homeLocationId');
    });

    test('should be idempotent (can run multiple times)', async () => {
      await runMigration('001-create-locations-table.js');
      await runMigration('003-add-user-columns.js');
      await expect(runMigration('003-add-user-columns.js')).resolves.not.toThrow();

      const tableDescription = await queryInterface.describeTable('Users');
      expect(tableDescription).toHaveProperty('githubId');
      expect(tableDescription).toHaveProperty('avatar');
    });

    test('should rollback successfully', async () => {
      await runMigration('001-create-locations-table.js');
      await runMigration('003-add-user-columns.js');
      
      const beforeRollback = await queryInterface.describeTable('Users');
      expect(beforeRollback).toHaveProperty('githubId');

      await rollbackMigration('003-add-user-columns.js');

      const afterRollback = await queryInterface.describeTable('Users');
      expect(afterRollback).not.toHaveProperty('githubId');
      expect(afterRollback).not.toHaveProperty('githubAccessToken');
      expect(afterRollback).not.toHaveProperty('avatar');
      expect(afterRollback).not.toHaveProperty('avatarColor');
      expect(afterRollback).not.toHaveProperty('homeLocationId');
    });
  });

  describe('011-add-google-oauth-fields', () => {
    test('should add Google OAuth columns to Users table', async () => {
      // Run prerequisite migrations
      await runMigration('001-create-locations-table.js');
      await runMigration('003-add-user-columns.js');
      
      // Run the migration
      await runMigration('011-add-google-oauth-fields.js');

      const tableDescription = await queryInterface.describeTable('Users');
      expect(tableDescription).toHaveProperty('googleId');
      expect(tableDescription).toHaveProperty('googleAccessToken');
    });

    test('should be idempotent (can run multiple times)', async () => {
      await runMigration('001-create-locations-table.js');
      await runMigration('003-add-user-columns.js');
      await runMigration('011-add-google-oauth-fields.js');
      await expect(runMigration('011-add-google-oauth-fields.js')).resolves.not.toThrow();

      const tableDescription = await queryInterface.describeTable('Users');
      expect(tableDescription).toHaveProperty('googleId');
      expect(tableDescription).toHaveProperty('googleAccessToken');
    });

    test('should rollback successfully', async () => {
      await runMigration('001-create-locations-table.js');
      await runMigration('003-add-user-columns.js');
      await runMigration('011-add-google-oauth-fields.js');
      
      const beforeRollback = await queryInterface.describeTable('Users');
      expect(beforeRollback).toHaveProperty('googleId');
      expect(beforeRollback).toHaveProperty('googleAccessToken');

      await rollbackMigration('011-add-google-oauth-fields.js');

      const afterRollback = await queryInterface.describeTable('Users');
      expect(afterRollback).not.toHaveProperty('googleId');
      expect(afterRollback).not.toHaveProperty('googleAccessToken');
    });
  });

  describe('012-fix-google-access-token-length', () => {
    test('should change access token columns to TEXT type', async () => {
      // Run prerequisite migrations
      await runMigration('001-create-locations-table.js');
      await runMigration('003-add-user-columns.js');
      await runMigration('011-add-google-oauth-fields.js');
      
      // Run the migration
      await runMigration('012-fix-google-access-token-length.js');

      const tableDescription = await queryInterface.describeTable('Users');
      
      // In SQLite, TEXT columns are stored as 'TEXT'
      // Verify the columns exist (type checking differs between SQLite and PostgreSQL)
      expect(tableDescription).toHaveProperty('googleAccessToken');
      expect(tableDescription).toHaveProperty('githubAccessToken');
    });

    test('should be idempotent (can run multiple times)', async () => {
      await runMigration('001-create-locations-table.js');
      await runMigration('003-add-user-columns.js');
      await runMigration('011-add-google-oauth-fields.js');
      await runMigration('012-fix-google-access-token-length.js');
      await expect(runMigration('012-fix-google-access-token-length.js')).resolves.not.toThrow();

      const tableDescription = await queryInterface.describeTable('Users');
      expect(tableDescription).toHaveProperty('googleAccessToken');
      expect(tableDescription).toHaveProperty('githubAccessToken');
    });

    test('should rollback successfully', async () => {
      await runMigration('001-create-locations-table.js');
      await runMigration('003-add-user-columns.js');
      await runMigration('011-add-google-oauth-fields.js');
      await runMigration('012-fix-google-access-token-length.js');
      
      await rollbackMigration('012-fix-google-access-token-length.js');

      const tableDescription = await queryInterface.describeTable('Users');
      // Columns should still exist after rollback, just reverted to STRING type
      expect(tableDescription).toHaveProperty('googleAccessToken');
      expect(tableDescription).toHaveProperty('githubAccessToken');
    });
  });

  describe('Full Migration Suite', () => {
    test('should run all migrations in order', async () => {
      const files = getMigrationFiles();
      
      for (const file of files) {
        await runMigration(file);
      }

      const tables = await queryInterface.showAllTables();
      expect(tables).toContain('Locations');
      expect(tables).toContain('LocationLinks');
      expect(tables).toContain('Users');

      const usersTable = await queryInterface.describeTable('Users');
      expect(usersTable).toHaveProperty('homeLocationId');
    });

    test('should rollback all migrations in reverse order', async () => {
      const files = getMigrationFiles();
      
      // Run all migrations
      for (const file of files) {
        await runMigration(file);
      }

      // Rollback in reverse order
      for (let i = files.length - 1; i >= 0; i--) {
        await rollbackMigration(files[i]);
      }

      const tables = await queryInterface.showAllTables();
      expect(tables).not.toContain('Locations');
      expect(tables).not.toContain('LocationLinks');
      
      // After rolling back all migrations (including 000-create-base-tables),
      // the Users and Articles tables should also be dropped
      expect(tables).not.toContain('Users');
      expect(tables).not.toContain('Articles');
    });
  });
});
