# Google OAuth Migration Guide

## Overview

This guide explains how to apply the Google OAuth migration to add `googleId` and `googleAccessToken` fields to the Users table in production.

## Migration File

**Location:** `src/migrations/011-add-google-oauth-fields.js`

**Status:** ✅ Ready for production deployment

## What the Migration Does

### Up Migration (Forward)

1. **Adds `googleId` column:**
   - Type: `STRING` (VARCHAR 255)
   - Nullable: `true`
   - Unique: `true` (via unique index)
   - Purpose: Store Google user ID for OAuth authentication

2. **Adds `googleAccessToken` column:**
   - Type: `STRING`
   - Nullable: `true`
   - Purpose: Store Google access token for API calls

3. **Creates unique index:**
   - Index name: `users_google_id_unique`
   - Column: `googleId`
   - Prevents duplicate Google account linkages

### Down Migration (Rollback)

1. Removes `googleAccessToken` column
2. Removes unique index `users_google_id_unique`
3. Removes `googleId` column

## Features

- ✅ **Idempotent**: Safe to run multiple times (won't fail if columns already exist)
- ✅ **Reversible**: Complete down migration for rollback
- ✅ **Cross-database**: Works with both PostgreSQL (production) and SQLite (dev/test)
- ✅ **Error handling**: Gracefully handles duplicate index errors
- ✅ **Logging**: Informative console messages for debugging

## Production Deployment

### Prerequisites

1. Ensure you have SSH access to the production server
2. Ensure the application is running in production mode
3. Back up the database before running migrations (recommended)

### Step 1: Backup Database (Recommended)

```bash
# Connect to production server
ssh your-server

# Create database backup
pg_dump -U postgres newsapp > /backup/newsapp_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run Migration

```bash
# Navigate to application directory
cd /var/www/Appofa

# Pull latest code (if not already deployed)
git pull origin main

# Install dependencies (if needed)
npm install

# Check migration status (see what migrations are pending)
npm run migrate:status

# Run pending migrations
npm run migrate:up

# Verify migration was applied
npm run migrate:status
```

### Step 3: Restart Application

```bash
# Restart the backend server with PM2
pm2 restart newsapp-backend

# Check application logs for any errors
pm2 logs newsapp-backend --lines 50
```

### Step 4: Verify Database Schema

```bash
# Connect to PostgreSQL
psql -U postgres -d newsapp

# Check Users table schema
\d "Users"

# Look for these columns in the output:
# - googleId         | character varying(255)
# - googleAccessToken| character varying(255)

# Check indexes
\di

# Look for: users_google_id_unique

# Exit psql
\q
```

### Step 5: Test Google OAuth

1. Open your application in a web browser
2. Navigate to the login page
3. Click "Sign in with Google"
4. Complete the OAuth flow
5. Verify user is logged in successfully
6. Check database to confirm `googleId` and `googleAccessToken` are populated

## Rollback (If Needed)

If you need to revert the migration:

```bash
cd /var/www/Appofa

# Rollback the last migration
npm run migrate:down

# Restart application
pm2 restart newsapp-backend
```

**Note:** Rollback will remove the Google OAuth columns and any data stored in them. Users who signed up with Google OAuth will not be able to log in until the migration is re-applied.

## Troubleshooting

### Migration Fails: "column already exists"

This is normal if the migration has already been run. The migration is idempotent and will skip adding columns that already exist.

### Migration Fails: "relation 'Users' does not exist"

Ensure base migrations have been run first:

```bash
npm run migrate:up
```

This will run all pending migrations in order.

### Application Still Shows Error After Migration

1. Verify migration was applied: `npm run migrate:status`
2. Check application is using correct database credentials
3. Restart the application: `pm2 restart newsapp-backend`
4. Check application logs: `pm2 logs newsapp-backend`

### Index Creation Fails

If the unique index creation fails but columns are created, you can manually create the index:

```sql
CREATE UNIQUE INDEX users_google_id_unique ON "Users" (googleId);
```

## Testing in Development

Before deploying to production, test the migration locally:

```bash
# Use SQLite for local testing
DB_DIALECT=sqlite DB_STORAGE=./test.db npm run migrate:up

# Verify it worked
DB_DIALECT=sqlite DB_STORAGE=./test.db sqlite3 test.db ".schema Users"

# Test rollback
DB_DIALECT=sqlite DB_STORAGE=./test.db npm run migrate:down

# Clean up
rm test.db
```

## Support

If you encounter issues:

1. Check application logs: `pm2 logs newsapp-backend`
2. Check database logs
3. Verify environment variables are set correctly
4. Ensure database user has permission to ALTER tables

## Migration History

- Created in PR #186 (Implement Google OAuth authentication)
- Tested with SQLite and PostgreSQL
- Compatible with Sequelize 6.x
- Migration number: 011

## Related Files

- User Model: `src/models/User.js`
- Database Config: `src/config/database.js`
- Migration Runner: `src/run-migrations.js`
- OAuth Routes: `src/routes/auth.js`
