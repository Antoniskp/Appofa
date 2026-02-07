#!/usr/bin/env node
/**
 * Integration test for poll models and migration
 * Tests the migration in an actual SQLite database
 */

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

console.log('=== Poll System Integration Test ===\n');

// Create a temporary SQLite database for testing
const testDb = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

async function runTest() {
  try {
    // Test 1: Database connection
    console.log('Test 1: Testing database connection...');
    await testDb.authenticate();
    console.log('  ✓ Database connection successful\n');

    // Test 2: Load and run migration
    console.log('Test 2: Running migration...');
    const migrationPath = path.join(__dirname, 'migrations', '006-create-polls-tables.js');
    const migration = require(migrationPath);
    
    await migration.up(testDb.getQueryInterface(), Sequelize);
    console.log('  ✓ Migration executed successfully\n');

    // Test 3: Verify tables were created
    console.log('Test 3: Verifying tables exist...');
    const tables = await testDb.getQueryInterface().showAllTables();
    
    const expectedTables = ['Polls', 'PollOptions', 'Votes'];
    expectedTables.forEach(tableName => {
      if (tables.includes(tableName)) {
        console.log(`  ✓ Table ${tableName} created`);
      } else {
        throw new Error(`Table ${tableName} was not created`);
      }
    });
    console.log('');

    // Test 4: Verify table structures
    console.log('Test 4: Verifying table structures...');
    
    // Check Polls table
    const pollsDesc = await testDb.getQueryInterface().describeTable('Polls');
    const requiredPollColumns = ['id', 'title', 'description', 'status', 'creatorId', 
                                   'pollType', 'questionType', 'allowUnauthenticatedVoting', 
                                   'allowUserAddOptions', 'settings'];
    requiredPollColumns.forEach(col => {
      if (pollsDesc[col]) {
        console.log(`  ✓ Polls.${col} exists`);
      } else {
        throw new Error(`Column ${col} missing from Polls table`);
      }
    });

    // Check PollOptions table
    const optionsDesc = await testDb.getQueryInterface().describeTable('PollOptions');
    const requiredOptionColumns = ['id', 'pollId', 'optionText', 'optionType', 
                                     'imageUrl', 'linkUrl', 'displayName', 'metadata', 
                                     'createdById', 'order'];
    requiredOptionColumns.forEach(col => {
      if (optionsDesc[col]) {
        console.log(`  ✓ PollOptions.${col} exists`);
      } else {
        throw new Error(`Column ${col} missing from PollOptions table`);
      }
    });

    // Check Votes table
    const votesDesc = await testDb.getQueryInterface().describeTable('Votes');
    const requiredVoteColumns = ['id', 'pollId', 'optionId', 'userId', 
                                   'isAuthenticated', 'rankPosition', 'freeTextResponse', 
                                   'sessionId', 'ipAddress'];
    requiredVoteColumns.forEach(col => {
      if (votesDesc[col]) {
        console.log(`  ✓ Votes.${col} exists`);
      } else {
        throw new Error(`Column ${col} missing from Votes table`);
      }
    });
    console.log('');

    // Test 5: Test rollback
    console.log('Test 5: Testing migration rollback...');
    await migration.down(testDb.getQueryInterface(), Sequelize);
    console.log('  ✓ Migration rolled back successfully\n');

    // Test 6: Verify tables were dropped
    console.log('Test 6: Verifying tables were dropped...');
    const tablesAfterRollback = await testDb.getQueryInterface().showAllTables();
    
    expectedTables.forEach(tableName => {
      if (!tablesAfterRollback.includes(tableName)) {
        console.log(`  ✓ Table ${tableName} dropped`);
      } else {
        throw new Error(`Table ${tableName} was not dropped during rollback`);
      }
    });
    console.log('');

    console.log('=== ✓ All Integration Tests Passed! ===\n');
    console.log('The poll system migration is fully functional and ready to deploy.\n');

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await testDb.close();
  }
}

runTest();
