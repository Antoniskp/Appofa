# Database Migrations Guide

This document explains how to manage database schema changes using Sequelize migrations in the Appofa application.

## Overview

The application uses Sequelize migrations to manage database schema changes. In production environments (`NODE_ENV=production`), automatic schema synchronization is disabled for safety. Instead, migrations must be run explicitly before starting the server.

## Migration System

### Migration Files

Migration files are located in `src/migrations/` directory and follow the naming convention:
```
XXX-description.js
```

Where `XXX` is a sequential number (001, 002, etc.) and `description` briefly explains what the migration does.

Each migration file exports two functions:
- `up(queryInterface, Sequelize)` - Applies the migration
- `down(queryInterface, Sequelize)` - Reverts the migration

### Migration Tracking

The system tracks executed migrations in the `SequelizeMeta` table. This table is automatically created when you run migrations for the first time.

## Running Migrations

### Prerequisites

1. Ensure your database is running
2. Configure database credentials in `.env` file:
   ```
   DB_NAME=newsapp
   DB_USER=postgres
   DB_PASSWORD=password
   DB_HOST=localhost
   DB_PORT=5432
   ```

### Commands

#### Run Pending Migrations

To apply all pending migrations:
```bash
node src/run-migrations.js
```

Or explicitly:
```bash
node src/run-migrations.js up
```

This command:
- Connects to the database
- Creates the `SequelizeMeta` table if it doesn't exist
- Checks which migrations have already been executed
- Runs pending migrations in sequential order
- Marks each migration as executed after successful completion

#### Rollback Last Migration

To rollback the most recently executed migration:
```bash
node src/run-migrations.js down
```

This command:
- Finds the last executed migration
- Runs its `down()` function
- Removes the migration from the tracking table

#### Check Migration Status

To see which migrations have been executed and which are pending:
```bash
node src/run-migrations.js status
```

This displays:
- Total number of migrations
- Number of executed migrations
- Number of pending migrations
- Detailed status of each migration file

## Existing Migrations

### 001-create-locations-table.js

Creates the `Locations` table for hierarchical location data with:
- Basic fields: id, name, name_local, type, code, slug
- Hierarchical structure: parent_id (self-referencing foreign key)
- Geographic data: lat, lng, bounding_box
- Timestamps: createdAt, updatedAt
- Indexes on: parent_id, code, slug
- Unique constraint on (type, name, parent_id)

### 002-create-location-links-table.js

Creates the `LocationLinks` table for linking locations to articles and users with:
- Fields: id, location_id, entity_type, entity_id
- Foreign key to Locations table
- Timestamps: createdAt, updatedAt
- Unique constraint on (location_id, entity_type, entity_id)
- Indexes for efficient lookups

### 003-add-user-columns.js

Adds new columns to the `Users` table:
- `githubId` - GitHub OAuth user ID
- `githubAccessToken` - GitHub OAuth access token
- `avatar` - User avatar URL
- `avatarColor` - Avatar background color
- `homeLocationId` - Foreign key to Locations table

## Production Deployment Workflow

### Initial Setup

1. Deploy your application code
2. Run migrations before starting the server:
   ```bash
   node src/run-migrations.js
   ```
3. Start the server:
   ```bash
   NODE_ENV=production node src/index.js
   ```

### Updating Schema

When deploying code changes that include new migrations:

1. Stop the server (if necessary for the migration)
2. Pull the latest code
3. Run migrations:
   ```bash
   node src/run-migrations.js
   ```
4. Start the server:
   ```bash
   NODE_ENV=production node src/index.js
   ```

## Migration Best Practices

### Idempotency

All migrations are designed to be idempotent, meaning they can be safely run multiple times. Each migration checks if changes have already been applied before attempting to apply them again.

### Safety

- Migrations run in a transaction when possible
- Each migration checks for existing tables/columns before creating them
- Down migrations verify existence before attempting to drop items
- Errors are logged with helpful messages

### Writing New Migrations

When creating new migrations:

1. Create a new file with the next sequential number:
   ```
   src/migrations/00X-description.js
   ```

2. Implement both `up` and `down` functions:
   ```javascript
   module.exports = {
     async up(queryInterface, Sequelize) {
       // Apply changes
     },
     async down(queryInterface, Sequelize) {
       // Revert changes
     }
   };
   ```

3. Make migrations idempotent by checking for existence:
   ```javascript
   async up(queryInterface, Sequelize) {
     const tableDescription = await queryInterface.describeTable('TableName');
     if (!tableDescription.columnName) {
       await queryInterface.addColumn('TableName', 'columnName', {
         type: Sequelize.STRING
       });
     }
   }
   ```

4. Test both up and down migrations:
   ```bash
   node src/run-migrations.js up
   node src/run-migrations.js down
   node src/run-migrations.js up
   ```

## Troubleshooting

### Migration Fails

If a migration fails:
1. Check the error message for details
2. Fix the issue (database connection, syntax error, etc.)
3. If the migration partially completed, you may need to manually clean up
4. Run the migration again

### Schema Out of Sync

If your schema is out of sync with migrations:
1. Check migration status: `node src/run-migrations.js status`
2. In development, you can drop and recreate the database, then run all migrations
3. In production, create corrective migrations to bring schema into alignment

### Rollback Issues

If rollback fails:
1. Check that the down migration is correctly implemented
2. Manually verify what changes were applied
3. Fix the down migration or manually revert changes if necessary

## Support

For issues or questions about migrations:
- Check existing migration files for examples
- Review Sequelize documentation: https://sequelize.org/docs/v6/other-topics/migrations/
- Consult the project's issue tracker
