#!/usr/bin/env node
'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sequelize = require('./config/database');

/**
 * Migration runner script for Sequelize migrations
 * This script runs migrations in order and tracks which ones have been executed
 */

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'SequelizeMeta';

/**
 * Ensure the migrations tracking table exists
 */
async function ensureMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
      name VARCHAR(255) PRIMARY KEY
    );
  `);
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations() {
  try {
    const [results] = await sequelize.query(
      `SELECT name FROM "${MIGRATIONS_TABLE}" ORDER BY name ASC;`
    );
    return results.map(r => r.name);
  } catch (error) {
    console.error('Error fetching executed migrations:', error.message);
    return [];
  }
}

/**
 * Mark a migration as executed
 */
async function markMigrationAsExecuted(migrationName) {
  await sequelize.query(
    `INSERT INTO "${MIGRATIONS_TABLE}" (name) VALUES (:name);`,
    {
      replacements: { name: migrationName }
    }
  );
}

/**
 * Unmark a migration (for rollback)
 */
async function unmarkMigration(migrationName) {
  await sequelize.query(
    `DELETE FROM "${MIGRATIONS_TABLE}" WHERE name = :name;`,
    {
      replacements: { name: migrationName }
    }
  );
}

/**
 * Get all migration files sorted by name
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.js'))
    .sort();

  return files;
}

/**
 * Run pending migrations
 */
async function runMigrations() {
  console.log('=== Starting Database Migrations ===\n');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Ensure migrations table exists
    await ensureMigrationsTable();
    console.log('✓ Migrations tracking table ready\n');

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    console.log(`Already executed migrations: ${executedMigrations.length}`);
    if (executedMigrations.length > 0) {
      executedMigrations.forEach(m => console.log(`  - ${m}`));
    }
    console.log('');

    // Get all migration files
    const migrationFiles = getMigrationFiles();
    console.log(`Total migration files found: ${migrationFiles.length}\n`);

    // Filter pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log('✓ No pending migrations to run\n');
      return;
    }

    console.log(`Pending migrations: ${pendingMigrations.length}`);
    pendingMigrations.forEach(m => console.log(`  - ${m}`));
    console.log('');

    // Run each pending migration
    for (const migrationFile of pendingMigrations) {
      console.log(`Running migration: ${migrationFile}`);
      const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
      const migration = require(migrationPath);

      try {
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
        await markMigrationAsExecuted(migrationFile);
        console.log(`✓ ${migrationFile} completed successfully\n`);
      } catch (error) {
        console.error(`✗ Migration ${migrationFile} failed:`, error.message);
        throw error;
      }
    }

    console.log('=== All migrations completed successfully ===\n');
  } catch (error) {
    console.error('\n=== Migration Error ===');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

/**
 * Rollback the last migration
 */
async function rollbackMigration() {
  console.log('=== Rolling Back Last Migration ===\n');

  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    await ensureMigrationsTable();

    const executedMigrations = await getExecutedMigrations();
    
    if (executedMigrations.length === 0) {
      console.log('No migrations to rollback\n');
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    console.log(`Rolling back migration: ${lastMigration}\n`);

    const migrationPath = path.join(MIGRATIONS_DIR, lastMigration);
    const migration = require(migrationPath);

    try {
      await migration.down(sequelize.getQueryInterface(), sequelize.Sequelize);
      await unmarkMigration(lastMigration);
      console.log(`✓ ${lastMigration} rolled back successfully\n`);
    } catch (error) {
      console.error(`✗ Rollback of ${lastMigration} failed:`, error.message);
      throw error;
    }

    console.log('=== Rollback completed successfully ===\n');
  } catch (error) {
    console.error('\n=== Rollback Error ===');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  console.log('=== Migration Status ===\n');

  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    await ensureMigrationsTable();

    const executedMigrations = await getExecutedMigrations();
    const allMigrations = getMigrationFiles();

    console.log(`Total migrations: ${allMigrations.length}`);
    console.log(`Executed: ${executedMigrations.length}`);
    console.log(`Pending: ${allMigrations.length - executedMigrations.length}\n`);

    console.log('Migration Status:');
    allMigrations.forEach(migration => {
      const status = executedMigrations.includes(migration) ? '✓ EXECUTED' : '⧗ PENDING';
      console.log(`  ${status}  ${migration}`);
    });
    console.log('');
  } catch (error) {
    console.error('Error checking status:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Parse command line arguments
const command = process.argv[2] || 'up';

(async () => {
  switch (command) {
    case 'up':
      await runMigrations();
      break;
    case 'down':
      await rollbackMigration();
      break;
    case 'status':
      await showStatus();
      break;
    default:
      console.log('Usage:');
      console.log('  node src/run-migrations.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  up      Run pending migrations (default)');
      console.log('  down    Rollback the last migration');
      console.log('  status  Show migration status');
      process.exit(1);
  }
})();
