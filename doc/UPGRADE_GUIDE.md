# Upgrade Guide: Hierarchical Locations Feature

## Purpose

This guide provides step-by-step instructions for deploying the hierarchical locations feature to production without encountering 502 errors or other deployment issues.

## Why This Guide Exists

Previous attempts to deploy this feature resulted in 502 errors due to:
1. Database connection issues during startup
2. Missing database schema before application start
3. PM2 process restarts before database sync completed
4. Frontend build failing due to new dependencies

This guide addresses all these issues with a proven, safe deployment workflow.

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass locally: `npm test`
- [ ] Frontend builds successfully: `npm run frontend:build`
- [ ] Backend starts without errors: `npm start`
- [ ] Database is accessible from the application server
- [ ] You have a database backup (see [Backup Section](#database-backup))

## Database Backup (CRITICAL)

**Always backup your database before deploying schema changes!**

### On VPS (PostgreSQL)

```bash
# Navigate to backup directory
cd /var/www/Appofa

# Create backup
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U newsapp_user newsapp > backup_before_locations_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_*.sql

# Optional: Download backup to local machine for safety
# From your local machine:
# scp user@your-vps-ip:/var/www/Appofa/backup_*.sql ~/backups/
```

### On Docker

```bash
# Create backup
docker exec newsapp-db pg_dump -U postgres newsapp > backup_before_locations_$(date +%Y%m%d_%H%M%S).sql
```

## Deployment Steps

### Step 1: Stop Running Services

```bash
cd /var/www/Appofa

# Stop both backend and frontend PM2 processes
pm2 stop newsapp-backend newsapp-frontend

# Verify they're stopped
pm2 status
```

**Why**: Prevents database connection conflicts during schema updates.

### Step 2: Pull Latest Code

```bash
# Ensure you're on main branch
git checkout main

# Fetch latest changes
git fetch --all

# Pull the changes
git pull origin main

# Verify you got the location feature
git log --oneline -5
```

### Step 3: Install Dependencies

```bash
# Clean install all dependencies
npm ci

# Verify critical packages installed
ls node_modules/sequelize
ls node_modules/next
```

**Why**: `npm ci` ensures a clean, reproducible install from package-lock.json.

### Step 4: Database Schema Update (Development Mode Only)

**IMPORTANT**: In production, we do NOT use `sequelize.sync()` automatically. Instead, we'll start the app in a controlled way to let it create the schema.

#### Option A: Let the App Create Schema (Recommended for First-Time)

The application will create the new tables when it starts up the first time. No manual SQL needed.

#### Option B: Manual Schema Creation (Advanced)

If you prefer to create the schema manually before starting the app:

```sql
-- Connect to database
PGPASSWORD=$DB_PASSWORD psql -h localhost -U newsapp_user newsapp

-- Create Locations table
CREATE TABLE IF NOT EXISTS "Locations" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_local VARCHAR(255),
  type VARCHAR(20) NOT NULL CHECK (type IN ('international', 'country', 'prefecture', 'municipality')),
  parent_id INTEGER REFERENCES "Locations"(id) ON DELETE CASCADE,
  code VARCHAR(20),
  slug VARCHAR(255) UNIQUE NOT NULL,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  bounding_box JSON,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create LocationLinks table
CREATE TABLE IF NOT EXISTS "LocationLinks" (
  id SERIAL PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES "Locations"(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('article', 'user')),
  entity_id INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_location_entity_link UNIQUE (location_id, entity_type, entity_id)
);

-- Add home location to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "homeLocationId" INTEGER REFERENCES "Locations"(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS location_code_index ON "Locations"(code);
CREATE INDEX IF NOT EXISTS location_parent_index ON "Locations"(parent_id);
CREATE INDEX IF NOT EXISTS location_slug_index ON "Locations"(slug);
CREATE UNIQUE INDEX IF NOT EXISTS unique_location_name_per_parent ON "Locations"(type, name, COALESCE(parent_id, -1));
CREATE INDEX IF NOT EXISTS entity_index ON "LocationLinks"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS location_index ON "LocationLinks"(location_id);

-- Verify tables were created
\dt "Locations"
\dt "LocationLinks"
\d "Users"

-- Exit psql
\q
```

### Step 5: Build Frontend

```bash
# Remove old build artifacts
rm -rf .next

# Build the Next.js frontend
npm run frontend:build

# Verify build succeeded
ls -la .next
```

**Why**: Fresh build ensures all new components are included.

### Step 6: Start Backend (Carefully)

```bash
# Start backend with PM2
pm2 start src/index.js --name newsapp-backend

# IMMEDIATELY check logs for errors
pm2 logs newsapp-backend --lines 50

# Watch for these messages:
# ✅ "Database connection established successfully."
# ✅ "Database models synchronized." (in non-production) OR "Skipping Sequelize sync in production."
# ✅ "Server is running on port 3000"

# If you see errors, STOP HERE and troubleshoot
# pm2 stop newsapp-backend
```

**Common Errors and Solutions**:

1. **"Unable to connect to the database"**
   - Check database is running: `sudo systemctl status postgresql`
   - Verify connection settings in `.env`
   - Test connection: `PGPASSWORD=$DB_PASSWORD psql -h localhost -U newsapp_user newsapp -c "SELECT 1;"`

2. **"relation 'Locations' does not exist"**
   - The schema wasn't created. Use Option B above to create manually.

3. **"Cannot read properties of undefined"**
   - Check that all models are exported in `src/models/index.js`
   - Verify `npm ci` completed successfully

### Step 7: Start Frontend

```bash
# Start frontend with PM2
pm2 start npm --name newsapp-frontend -- run frontend:start

# Check logs
pm2 logs newsapp-frontend --lines 30

# Look for:
# ✅ "ready - started server on 0.0.0.0:3001"
```

### Step 8: Save PM2 Configuration

```bash
# Save current PM2 process list
pm2 save

# Verify both processes are running
pm2 status

# Should show:
# newsapp-backend  | online
# newsapp-frontend | online
```

### Step 9: Test the Application

#### Health Check

```bash
# Test backend health
curl http://localhost:3000/

# Should return:
# {"success":true,"message":"News Application API",...}

# Test frontend
curl http://localhost:3001/

# Should return HTML
```

#### Web Browser Tests

1. Open http://YOUR_SERVER_IP in a browser
2. Check that the homepage loads (no 502 error!)
3. Login as admin
4. Navigate to `/admin/locations` - should see location management page
5. Create a test location
6. Edit an article and add a location
7. View your profile and set a home location

### Step 10: Verify Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If configuration is valid, reload
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

## Post-Deployment Verification

### 1. Verify Database Schema

```bash
PGPASSWORD=$DB_PASSWORD psql -h localhost -U newsapp_user newsapp

-- Check tables exist
\dt

-- Should see:
-- Locations
-- LocationLinks
-- Users (with homeLocationId column)

-- Check Location table structure
\d "Locations"

-- Exit
\q
```

### 2. Test API Endpoints

```bash
# List locations (should return empty array initially)
curl http://localhost:3000/api/locations

# Should return:
# {"success":true,"locations":[],"pagination":{...}}

# If you get 404, the routes aren't loaded
# If you get 502, the backend isn't running
```

### 3. Monitor Logs

```bash
# Watch logs for any errors
pm2 logs --lines 100

# Look for any ERROR or warning messages
```

### 4. Check Process Health

```bash
# Ensure both processes are running and not restarting
pm2 status

# Both should show:
# - status: online
# - restart: 0 (or low number)

# If restart count is high, check logs:
pm2 logs newsapp-backend --err --lines 50
```

## Rollback Procedure

If anything goes wrong, you can rollback:

### 1. Quick Rollback (Keep Database Changes)

```bash
# Stop new version
pm2 stop newsapp-backend newsapp-frontend

# Switch to previous git commit
git log --oneline -10  # Find the commit before locations
git checkout <previous-commit-hash>

# Reinstall dependencies
npm ci

# Rebuild frontend
rm -rf .next
npm run frontend:build

# Restart
pm2 restart newsapp-backend newsapp-frontend

# Verify it works
curl http://localhost:3000/
```

### 2. Full Rollback (Restore Database)

```bash
# Stop processes
pm2 stop newsapp-backend newsapp-frontend

# Restore database backup
PGPASSWORD=$DB_PASSWORD psql -h localhost -U newsapp_user newsapp < backup_before_locations_YYYYMMDD_HHMMSS.sql

# Follow Quick Rollback steps above
```

## Common Issues and Solutions

### Issue: 502 Bad Gateway

**Symptoms**: Nginx returns 502 error

**Causes**:
1. Backend not running
2. Backend crashed during startup
3. Database connection failed

**Solution**:
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs newsapp-backend --err --lines 50

# If crashed, check database connection:
PGPASSWORD=$DB_PASSWORD psql -h localhost -U newsapp_user newsapp -c "SELECT 1;"

# Restart backend
pm2 restart newsapp-backend
```

### Issue: "Cannot find module './Location'"

**Symptoms**: Backend fails to start, error mentions missing Location module

**Solution**:
```bash
# Verify files exist
ls src/models/Location.js
ls src/models/LocationLink.js

# If missing, pull code again
git pull origin main

# Verify models/index.js includes new models
cat src/models/index.js | grep Location
```

### Issue: Frontend Build Fails

**Symptoms**: `npm run frontend:build` fails

**Solution**:
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Try build again
npm run frontend:build
```

### Issue: Database Connection Timeout

**Symptoms**: "Unable to connect to the database" error

**Solution**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Check if database exists
PGPASSWORD=$DB_PASSWORD psql -h localhost -U newsapp_user -l | grep newsapp

# Test connection
PGPASSWORD=$DB_PASSWORD psql -h localhost -U newsapp_user newsapp -c "SELECT version();"

# Check .env has correct credentials
cat .env | grep DB_
```

## Environment Variables

Ensure these are set in `/var/www/Appofa/.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=newsapp
DB_USER=newsapp_user
DB_PASSWORD=your_strong_password

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret

# Frontend
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP
```

## Success Criteria

Deployment is successful when:

- [ ] Both PM2 processes show status "online" with 0 restarts
- [ ] Homepage loads without 502 error
- [ ] Admin can access `/admin/locations`
- [ ] Can create, edit, and delete locations
- [ ] Can link locations to articles
- [ ] Can set home location in profile
- [ ] No errors in PM2 logs
- [ ] Database contains new tables (Locations, LocationLinks)

## Getting Help

If you encounter issues not covered here:

1. Check PM2 logs: `pm2 logs --lines 200`
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Check database connection: `PGPASSWORD=$DB_PASSWORD psql -h localhost -U newsapp_user newsapp`
4. Review the application logs for specific error messages

## Summary

This upgrade adds hierarchical location support to the application. The key to avoiding 502 errors is:

1. **Always backup the database first**
2. **Stop services before updating**
3. **Ensure database is accessible**
4. **Start backend first and verify before starting frontend**
5. **Monitor logs during startup**
6. **Have a rollback plan ready**

Following this guide step-by-step will ensure a smooth deployment without 502 errors.
