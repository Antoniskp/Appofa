# Staging Environment Deployment Guide

## Overview

This document explains how to set up and deploy the **STAGING/NON-PRODUCTION** environment for the Appofa news application. The staging environment runs on **staging.appofasi.gr** and uses the same PostgreSQL database as production (per user request).

**Important:** This is a staging environment intended for testing and validation before production deployment. It shares the production database but runs on separate ports and domain.

## Architecture

The staging environment mirrors the production deployment architecture:

- **Domain:** staging.appofasi.gr
- **Backend:** Express API server on port 3002
- **Frontend:** Next.js server on port 3003
- **Database:** Shared production PostgreSQL (newsapp database, newsapp_user)
- **Process Manager:** PM2 with separate processes (newsapp-staging-backend, newsapp-staging-frontend)
- **Web Server:** Nginx reverse proxy with routing for /api and /_next

## Prerequisites

Before setting up staging, ensure the production environment is already configured:

1. ✅ Production PostgreSQL database and user exist
2. ✅ Node.js 20 LTS is installed
3. ✅ PM2 is installed globally
4. ✅ Nginx is installed and configured
5. ✅ Production environment is running on appofasi.gr

## Initial Staging Setup on VPS

### Step 1: Clone Repository for Staging

```bash
# Clone to a separate directory for staging
cd /var/www
git clone https://github.com/Antoniskp/Appofa.git Appofa-staging
cd Appofa-staging
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm ci
```

### Step 3: Configure Staging Environment

```bash
# Copy the staging example to create actual staging config
cp .env.staging.example .env.staging

# Edit the staging configuration
nano .env.staging
```

**Required changes in `.env.staging`:**

```env
# Use production database credentials
DB_PASSWORD=YOUR_PRODUCTION_DB_PASSWORD

# Use production JWT secret or separate staging secret
JWT_SECRET=YOUR_JWT_SECRET

# Configure GitHub OAuth for staging (create separate OAuth app)
GITHUB_CLIENT_ID=your-staging-github-client-id
GITHUB_CLIENT_SECRET=your-staging-github-client-secret
```

**Note:** The staging environment reuses the production database (newsapp) and user (newsapp_user) as requested. This means staging and production share the same data.

### Step 4: Build the Frontend

```bash
# Build the Next.js frontend for production
npm run frontend:build
```

### Step 5: Start PM2 Processes

Copy `.env.staging` to `.env` before starting processes:

```bash
# Copy staging config to .env (used by application)
cp .env.staging .env

# Start the Express backend on port 3002
pm2 start src/index.js --name newsapp-staging-backend

# Start the Next.js frontend on port 3003
pm2 start npm --name newsapp-staging-frontend -- run frontend:start -- -p 3003

# Save PM2 process list
pm2 save
```

**Verify processes are running:**

```bash
pm2 status
# You should see:
# - newsapp-backend (production on port 3000)
# - newsapp-frontend (production on port 3001)
# - newsapp-staging-backend (staging on port 3002)
# - newsapp-staging-frontend (staging on port 3003)
```

### Step 6: Configure Nginx for Staging

Create the staging nginx configuration:

```bash
# Copy the staging nginx config template
sudo cp /var/www/Appofa-staging/config/nginx/staging.conf /etc/nginx/sites-available/newsapp-staging

# Enable the staging site
sudo ln -s /etc/nginx/sites-available/newsapp-staging /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**Important:** The nginx configuration routes requests as follows:
- `/api/*` → Backend on port 3002
- `/_next/*` → Frontend on port 3003  
- All other paths → Frontend on port 3003

### Step 7: Configure DNS

Add a DNS A record for the staging subdomain:

```
Type: A
Name: staging
Value: YOUR_VPS_IP_ADDRESS
```

Wait for DNS propagation and verify:

```bash
dig +short staging.appofasi.gr
# Should return YOUR_VPS_IP_ADDRESS
```

### Step 8: Set Up SSL with Let's Encrypt

```bash
# Request SSL certificate for staging domain
sudo certbot --nginx -d staging.appofasi.gr

# Verify HTTPS works
curl -I https://staging.appofasi.gr
```

### Step 9: Configure GitHub OAuth App for Staging

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a **new OAuth App** specifically for staging
3. Configure it:
   - **Application name:** Appofa Staging
   - **Homepage URL:** https://staging.appofasi.gr
   - **Authorization callback URL:** https://staging.appofasi.gr/api/auth/github/callback
4. Copy the Client ID and Client Secret
5. Update `.env.staging`:
   ```env
   GITHUB_CLIENT_ID=your-staging-client-id
   GITHUB_CLIENT_SECRET=your-staging-client-secret
   GITHUB_CALLBACK_URL=https://staging.appofasi.gr/api/auth/github/callback
   FRONTEND_URL=https://staging.appofasi.gr
   ```
6. Copy to `.env` and restart PM2 processes:
   ```bash
   cp .env.staging .env
   pm2 restart newsapp-staging-backend newsapp-staging-frontend
   ```

## Automated Deployments via GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys to staging when changes are pushed to the `main` branch.

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `VPS_HOST` | VPS IP address or hostname | `185.92.192.81` |
| `VPS_USERNAME` | SSH username for VPS | `root` or `ubuntu` |
| `VPS_SSH_KEY` | Private SSH key for authentication | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_PORT` | SSH port (optional, defaults to 22) | `22` |

### How to Set Up Secrets

1. **Generate SSH Key (if not already done):**
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-staging" -f ~/.ssh/github_actions_staging
   ```

2. **Add Public Key to VPS:**
   ```bash
   # Copy public key to VPS
   ssh-copy-id -i ~/.ssh/github_actions_staging.pub user@your-vps-ip
   ```

3. **Add Private Key to GitHub Secrets:**
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VPS_SSH_KEY`
   - Value: Paste the contents of `~/.ssh/github_actions_staging` (private key)

4. **Add Other Secrets:**
   - Add `VPS_HOST`, `VPS_USERNAME`, and optionally `VPS_PORT`

### Workflow Details

The staging deployment workflow (`.github/workflows/deploy-staging.yml`) performs the following steps:

1. **Checkout Code** - Fetches the latest code from the repository
2. **Connect to VPS via SSH** - Uses secrets to establish secure connection
3. **Stop PM2 Processes** - Gracefully stops staging backend and frontend
4. **Pull Latest Changes** - Fetches and pulls from main branch
5. **Clean Build Artifacts** - Removes old `.next` directory
6. **Install Dependencies** - Runs `npm ci` for clean installation
7. **Copy Environment Config** - Copies `.env.staging` to `.env`
8. **Build Frontend** - Runs `npm run frontend:build`
9. **Restart PM2 Processes** - Restarts both staging processes
10. **Save PM2 Config** - Persists process configuration
11. **Verify Deployment** - Checks process status

### Manual Workflow Trigger

You can also trigger the deployment manually:

1. Go to GitHub repository → Actions
2. Select "Deploy to Staging" workflow
3. Click "Run workflow"
4. Select `main` branch
5. Click "Run workflow"

## Manual Deployment (Without GitHub Actions)

If you need to deploy manually on the VPS:

```bash
# Navigate to staging directory
cd /var/www/Appofa-staging

# Stop PM2 processes
pm2 stop newsapp-staging-backend newsapp-staging-frontend

# Pull latest changes
git fetch --all
git checkout main
git pull origin main

# Clean build
rm -rf .next

# Install dependencies
npm ci

# Copy staging config
cp .env.staging .env

# Build frontend
npm run frontend:build

# Restart processes
pm2 restart newsapp-staging-backend newsapp-staging-frontend
pm2 save

# Verify
pm2 status | grep staging
```

## Port Configuration Summary

| Environment | Backend Port | Frontend Port | Domain |
|------------|--------------|---------------|---------|
| Production | 3000 | 3001 | appofasi.gr |
| Staging | 3002 | 3003 | staging.appofasi.gr |

## Database Sharing

**Important:** Per user request, staging and production share the same PostgreSQL database:

- **Database:** newsapp
- **User:** newsapp_user
- **Shared Tables:** All data is shared between environments

**Implications:**
- Changes made in staging (articles, users, etc.) will appear in production
- Use caution when testing data modifications
- Consider creating test users/articles with clear "STAGING" markers
- Database migrations affect both environments

## Troubleshooting

### Deployment Fails

1. **Check SSH Connection:**
   ```bash
   ssh -i ~/.ssh/github_actions_staging user@your-vps-ip
   ```

2. **Verify PM2 Processes:**
   ```bash
   pm2 status
   pm2 logs newsapp-staging-backend
   pm2 logs newsapp-staging-frontend
   ```

3. **Check Nginx Configuration:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### 404 Errors for Static Assets

If you see 404 errors for `/_next/static/*` files:

1. **Verify frontend is running on port 3003:**
   ```bash
   pm2 status newsapp-staging-frontend
   curl http://localhost:3003
   ```

2. **Check nginx routing:**
   ```bash
   sudo nginx -t
   cat /etc/nginx/sites-available/newsapp-staging | grep "_next"
   ```

### Database Connection Issues

Since staging uses production database:

1. **Verify credentials match production:**
   ```bash
   cd /var/www/Appofa-staging
   grep DB_ .env.staging
   ```

2. **Test database connection:**
   ```bash
   sudo -u postgres psql -d newsapp -c "SELECT current_database();"
   ```

### GitHub Actions Workflow Fails

1. **Check workflow logs in GitHub Actions tab**
2. **Verify secrets are configured correctly**
3. **Test SSH connection manually:**
   ```bash
   ssh -i path/to/private/key user@vps-ip
   ```

## Environment Variables Reference

See `.env.staging.example` for the complete list of required environment variables.

**Key differences from production:**

- `NODE_ENV=staging` (marks as non-production)
- `PORT=3002` (backend on different port)
- `NEXT_PUBLIC_API_URL=https://staging.appofasi.gr/api`
- `API_URL=http://localhost:3002`
- Separate GitHub OAuth credentials

## Security Considerations

1. **Non-Production Environment:** Staging is clearly marked as `NODE_ENV=staging`
2. **Shared Database:** Exercise caution with data modifications
3. **Separate OAuth App:** Use dedicated GitHub OAuth credentials
4. **SSL/TLS:** Always use HTTPS in staging (via Let's Encrypt)
5. **Access Control:** Consider restricting staging access via nginx auth_basic or firewall rules

## Next Steps

After staging is deployed:

1. ✅ Test the deployment at https://staging.appofasi.gr
2. ✅ Verify all functionality works correctly
3. ✅ Test GitHub Actions workflow with a commit to main
4. ✅ Monitor PM2 logs for any issues
5. ✅ Set up monitoring/alerting if needed

## Related Documentation

- [VPS Deployment Guide](VPS_DEPLOYMENT.md) - Production deployment
- [Production Architecture](ARCHITECTURE.md) - System architecture
- [API Testing](API_TESTING.md) - API endpoint testing
- [Troubleshooting](TROUBLESHOOTING.md) - General troubleshooting

## Support

For issues or questions about staging deployment:

1. Check this documentation
2. Review VPS_DEPLOYMENT.md for production setup reference
3. Check GitHub Actions logs for deployment failures
4. Review PM2 logs: `pm2 logs newsapp-staging-backend` and `pm2 logs newsapp-staging-frontend`
