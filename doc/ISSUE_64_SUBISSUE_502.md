# Sub-Issue: Prevent 502 Errors After Merging Issue #64

## Summary
Repeated merges for issue #64 have caused 502 responses in production. This sub-issue documents a simple, repeatable checklist to avoid the failure and to make the rollout for the location model predictable.

## Scope
- Applies to merges/deployments for issue #64 (location model + links).
- Focuses on preventing 502 errors caused by missing env vars, database connectivity, or app startup failures.

## Step-by-Step Checklist

### 1) Pre-Merge Validation (Local or CI)
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run backend tests**
   ```bash
   npm test
   ```
3. **Run frontend build** (ensures Next.js build still succeeds)
   ```bash
   npm run frontend:build
   ```
4. **Confirm environment variables are documented**
   - Verify any new env vars for locations are added to `.env.example`.
   - Confirm prod/staging secrets are updated before merge.

### 2) Pre-Deployment Checks (Staging/Production)
1. **Database connectivity**
   - Confirm DB host, port, user, and password are valid.
   - Ensure the database exists and is reachable from the app host/container.
2. **Schema readiness**
   - If new tables or columns are added, ensure the deployment process runs the required setup (`setup-db.sh` or model sync) before app restart.
3. **Reverse proxy routing**
   - Confirm nginx (or other proxy) forwards to the correct port (`PORT` default 3000).

### 3) Deployment Steps
1. **Pull and install**
   ```bash
   git pull origin main
   npm install --production
   ```
2. **Restart the app**
   - **PM2**: `pm2 restart newsapp`
   - **Docker**: `docker-compose up -d --build`

### 4) Post-Deployment Verification
1. **Health check**
   - Admin endpoint: `/api/admin/health` with admin auth token.
2. **Basic smoke test**
   - Load home page and an article list page.
3. **Log scan**
   - Check logs for startup errors:
     - PM2: `pm2 logs newsapp --lines 200`
     - Docker: `docker-compose logs -f app`

### 5) If 502 Happens (Immediate Triage)
1. **Confirm the app is running**
   - Is the Node process alive?
   - Is the container healthy?
2. **Check application logs for startup errors**
3. **Verify DB connection** (common failure point)
4. **Validate proxy port mapping**

## Definition of Done
- Pre-merge validation runs cleanly.
- Deployment checklist is followed with no 502 errors.
- If a 502 occurs, the triage steps lead to a concrete root cause and fix.

## Notes
- Keep this checklist updated when issue #64 introduces new env vars, tables, or startup steps.
