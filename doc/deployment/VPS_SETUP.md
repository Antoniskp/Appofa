# VPS Deployment Guide

A comprehensive guide for deploying the Appofa News Application on a Virtual Private Server running Ubuntu or Debian Linux.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Important Variables to Change](#important-variables-to-change)
- [Initial VPS Setup](#initial-vps-setup)
  - [SSH Configuration](#ssh-configuration)
- [Application Installation](#application-installation)
- [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Post-Deployment Verification](#post-deployment-verification)
- [Updating the Application](#updating-the-application)
  - [Standard Update Workflow](#standard-update-workflow)
  - [Clean Update Workflow](#clean-update-workflow)
  - [Upgrading from Old Single-Process Deployment](#upgrading-from-old-single-process-deployment)
  - [Fix Duplicate PM2 Processes](#fix-duplicate-pm2-processes)

---

## Overview

The Appofa News Application uses a split architecture:
- **Backend**: Express.js API server (Node.js) on port 3000
- **Frontend**: Next.js application on port 3001
- **Database**: PostgreSQL

Both components must be running for the application to function correctly.

---

## Prerequisites

### System Requirements
- Ubuntu/Debian Linux server (Ubuntu 20.04+ or Debian 11+ recommended)
- Root or sudo access
- At least 2GB RAM (4GB recommended)
- At least 20GB disk space
- Domain name (optional but recommended for HTTPS)

### Software Requirements
- PostgreSQL v12 or higher
- Node.js v22 or higher (required for Next.js 16.x)
- npm v10.x or higher
- Git
- PM2 for process management
- Nginx for reverse proxy
- Certbot (for SSL/HTTPS)

---

## Important Variables to Change

Before deployment, prepare these values:

| Variable | Location | Example |
|----------|----------|---------|
| Database password | `/var/www/Appofa/.env` | `strong_password_123` |
| Database user | `/var/www/Appofa/.env` | `newsapp_user` |
| API URL | `/var/www/Appofa/.env` | `http://185.92.192.81` or `https://your-domain.com` |
| Server name | `/etc/nginx/sites-available/newsapp` | `your-domain.com` |
| Server IP | `/etc/nginx/sites-available/newsapp` | `185.92.192.81` |

---

## Initial VPS Setup

### SSH Configuration

#### 1. Fix SSH Runtime Directory

The SSH daemon requires a runtime directory for proper operation:

```bash
# Create SSH runtime directory
sudo mkdir -p /run/sshd

# Set proper permissions
sudo chmod 755 /run/sshd

# Create systemd tmpfiles configuration to persist across reboots
sudo tee /etc/tmpfiles.d/sshd.conf > /dev/null << 'EOF'
d /run/sshd 0755 root root -
EOF

# Apply the tmpfiles configuration
sudo systemd-tmpfiles --create

# Restart SSH service
sudo systemctl restart ssh
```

**Why this is needed:**
- `/run/sshd` is required by the SSH daemon for privilege separation
- The directory is typically on a tmpfs filesystem that gets cleared on reboot
- The tmpfiles.d configuration ensures it's recreated automatically on boot

#### 2. Configure SSH Keepalive

Maintain stable SSH connections:

```bash
# Append keepalive settings to SSH daemon configuration
sudo tee -a /etc/ssh/sshd_config > /dev/null << 'EOF'

# Keepalive settings
ClientAliveInterval 300
ClientAliveCountMax 5
TCPKeepAlive yes
EOF

# Restart SSH service to apply changes
sudo systemctl restart ssh
```

**What these settings do:**
- `ClientAliveInterval 300`: Server sends keepalive message every 300 seconds (5 minutes)
- `ClientAliveCountMax 5`: Server disconnects after 5 unanswered keepalive messages (25 minutes total)
- `TCPKeepAlive yes`: Enables TCP-level keepalive probes to detect dead connections

---

## Application Installation

### 1. Install System Dependencies

```bash
# Disable Virtuozzo/OpenVZ repo if present (avoids harmless Translation-en 404s)
grep -RIn "repo.virtuozzo.com/ctpreset" /etc/apt/sources.list /etc/apt/sources.list.d || true
sudo sh -c 'grep -RIl "repo.virtuozzo.com/ctpreset" /etc/apt/sources.list /etc/apt/sources.list.d | while read -r f; do mv "$f" "$f.disabled"; done' || true

# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y curl ca-certificates gnupg nano git

# Install Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v  # Should show v22.x.x
npm -v   # Should show v10.x.x or higher

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

**Upgrading from Node 20?** See `doc/NODE_UPGRADE_VPS.md` for step-by-step instructions.

### 2. Set Up PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE newsapp;
CREATE USER newsapp_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE newsapp TO newsapp_user;
\q
```

### 3. Clone and Configure Application

```bash
# Create application directory
cd /var/www

# Clone repository
git clone https://github.com/Antoniskp/Appofa.git
cd Appofa

# Install all dependencies
npm ci
```

**Note:** The project uses npm overrides to force newer versions:
- `glob@11.0.0` (requires Node 22+)
- `rimraf@6.0.1` (requires Node 22+)
- `tar@7.5.7` (security updates)

### 4. Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Edit with your production credentials:

```env
# Database Configuration
DB_NAME=newsapp
DB_USER=newsapp_user
DB_PASSWORD=strong_password  # CHANGE THIS!
DB_HOST=localhost
DB_PORT=5432

# API Configuration (use your domain or server IP)
NEXT_PUBLIC_API_URL=http://185.92.192.81

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_secret  # CHANGE THIS!

# Environment
NODE_ENV=production
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

### 5. Build the Frontend

```bash
npm run frontend:build
```

This creates optimized production assets in the `.next` directory.

### 6. Start with PM2

The application requires **two separate PM2 processes**:

```bash
# Start Express backend (API server) on port 3000
pm2 start src/index.js --name newsapp-backend

# Start Next.js frontend on port 3001
pm2 start npm --name newsapp-frontend -- run frontend:start

# Save PM2 process list
pm2 save

# Enable PM2 to start on system boot
pm2 startup
# Follow the instructions shown by PM2 (usually requires sudo)
```

**Important:** Both processes must be running for the application to work properly.

**Verify processes are running:**
```bash
pm2 status
# Both newsapp-backend and newsapp-frontend should show "online"
```

---

## Nginx Reverse Proxy Setup

### 1. Install Nginx

```bash
# Install nginx
sudo apt install -y nginx

# Remove default nginx site to avoid server_name conflicts
sudo rm -f /etc/nginx/sites-enabled/default
```

### 2. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/newsapp
```

Add the following configuration (replace `your-domain.com` and `YOUR_SERVER_IP`):

```nginx
server {
    listen 80;
    # Include both domain and IP to handle requests to either
    # Only ONE server block should claim the IP to avoid conflicts
    server_name your-domain.com YOUR_SERVER_IP;

    # Route API requests to Express backend on port 3000
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Route Next.js static assets to frontend on port 3001
    # This includes JavaScript chunks, CSS, images, and other static files
    location /_next/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Route all other requests (pages, etc.) to Next.js frontend on port 3001
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Why This Routing is Critical:**

This nginx configuration is designed for a **split frontend/backend deployment** where:
- Express backend runs on `localhost:3000` (handles `/api/*`)
- Next.js frontend runs on `localhost:3001` (handles `/_next/*` and all other routes)

**⚠️ Common Issue: 404 Errors for `/_next/static` Chunks**

If nginx routing is incorrect, you'll see 404 errors for Next.js static assets:
- `/_next/static/chunks/*.js` - JavaScript bundles
- `/_next/static/css/*.css` - Stylesheets  
- `/_next/static/media/*` - Images and fonts

These 404 errors break signup/sign-in pages because the browser cannot load required JavaScript and CSS files.

**What this configuration ensures:**
1. API calls (`/api/*`) route to Express backend
2. Next.js static assets (`/_next/*`) route to frontend server
3. All other paths (pages like `/`, `/login`, `/register`) route to Next.js for server-side rendering

### 3. Enable the Nginx Configuration

```bash
# Check if symlink already exists and remove it to avoid "File exists" error
if [ -L /etc/nginx/sites-enabled/newsapp ]; then
    sudo rm /etc/nginx/sites-enabled/newsapp
fi

# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/newsapp /etc/nginx/sites-enabled/

# Test nginx configuration for syntax errors
sudo nginx -t

# Restart nginx to apply changes
sudo systemctl restart nginx
```

### 4. DNS Configuration (for domain access)

Before accessing via domain, ensure DNS is configured:

**DNS Checklist:**
- Create an `A` record for `your-domain.com` pointing to `YOUR_SERVER_IP`
- (Optional) Create a `CNAME` record for `www` pointing to `your-domain.com`
- DNS propagation can take time (up to 48 hours, usually much faster)

**Verify DNS resolution from VPS:**
```bash
# Install DNS tools if missing
sudo apt install -y dnsutils

# Verify DNS resolves to your VPS IP
dig +short your-domain.com
dig +short www.your-domain.com
# Should return YOUR_SERVER_IP
```

**Quick HTTP validation (before HTTPS):**
```bash
# Confirm the domain works over HTTP
curl -I http://your-domain.com
curl -I http://www.your-domain.com
```

### 5. Troubleshooting: Apache Welcome Page Still Showing

If you see the Apache welcome page instead of your application:

```bash
# Check what is listening on port 80
sudo ss -tulpn | grep :80

# Stop and disable Apache
sudo systemctl stop apache2
sudo systemctl disable apache2

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify port 80 is now owned by Nginx
sudo ss -tulpn | grep :80
# Should show "nginx" in the output, not "apache2"
```

---

## SSL/HTTPS Configuration

Use Let's Encrypt for free SSL certificates. **Run this only after DNS resolves correctly and HTTP works.**

### 1. Install Certbot

```bash
# Install certbot with nginx plugin
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Request SSL Certificate

```bash
# Request certificates for both apex domain and www
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will:
- Automatically obtain SSL certificates
- Modify your nginx configuration to enable HTTPS
- Set up automatic renewal

### 3. Verify HTTPS is Working

```bash
curl -I https://your-domain.com
```

**If HTTPS fails but HTTP works:**
- Double-check that DNS resolves to your VPS IP
- Ensure the `server_name` in nginx config contains your domain(s)
- Re-run `sudo nginx -t` and `sudo systemctl reload nginx` after edits

### 4. Test Automatic Renewal

```bash
# Dry-run renewal test
sudo certbot renew --dry-run
```

Certbot automatically sets up a systemd timer for renewals. Check status:
```bash
sudo systemctl status certbot.timer
```

---

## Post-Deployment Verification

After deployment, verify everything is working correctly.

### 1. Check Node Version
```bash
node -v  # Should be v22.x.x
npm -v   # Should be v10.x.x or higher
```

### 2. Check PM2 Status
```bash
pm2 status
# Both newsapp-backend and newsapp-frontend should show "online"
```

### 3. Check for Errors
```bash
# Check for any errors in the logs
pm2 logs --err --lines 50

# Should NOT see:
# - ValidationError: trust proxy
# - Module not found errors
# - Database connection errors
```

### 4. Test Endpoints
```bash
# Test backend (API health check)
curl http://localhost:3000/api/health || curl http://localhost:3000

# Test frontend
curl http://localhost:3001

# Test from external IP (replace with your IP)
curl http://YOUR_SERVER_IP:3000
curl http://YOUR_SERVER_IP:3001

# Test via domain (if configured)
curl http://your-domain.com
curl https://your-domain.com
```

### 5. Check npm audit
```bash
cd /var/www/Appofa
npm audit
# Should show 0 vulnerabilities
```

### 6. Express Trust Proxy Configuration

The application uses `app.set('trust proxy', 1)` to properly handle rate limiting behind nginx.

**What this means:**
- Express trusts the first proxy (nginx) to set the `X-Forwarded-For` header
- Rate limiting works correctly based on real client IPs
- Security is maintained - only nginx can set the forwarded IP

**⚠️ DO NOT** change this to `true` as it creates a security vulnerability where attackers can bypass rate limiting.

See: https://expressjs.com/en/guide/behind-proxies.html

---

## Updating the Application

### Standard Update Workflow

For regular updates after pulling changes from GitHub:

```bash
cd /var/www/Appofa

# Fetch and pull latest changes
git fetch --all
git checkout main
git pull origin main

# Install/update dependencies
npm ci

# Update environment variables if needed
nano .env

# Restart services
pm2 restart newsapp-backend newsapp-frontend
pm2 save
```

### Clean Update Workflow

For major updates, dependency changes, or when troubleshooting issues:

**Step 1: Stop running services**
```bash
cd /var/www/Appofa
pm2 stop newsapp-backend newsapp-frontend
```

**Step 2: Fetch and pull latest changes**
```bash
git fetch --all
git checkout main
git pull origin main
```

**Step 3: Run database migrations**
```bash
npm run migrate
```

**Step 4: Remove build artifacts**
```bash
# Remove Next.js build output for a fresh build
rm -rf .next
```

**Step 5: Clean dependency reinstallation**
```bash
# Clean install all dependencies
npm ci
```

**Step 6: Build the frontend**
```bash
npm run frontend:build
```

**Step 7: Restart services**
```bash
pm2 restart newsapp-backend newsapp-frontend
pm2 save
```

**Step 8: Reload nginx (if configuration changed)**
```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx if config is valid
sudo systemctl reload nginx
```

#### Complete Clean Update Script

For copy-paste convenience:

```bash
# Navigate to application directory
cd /var/www/Appofa

# Stop running services
pm2 stop newsapp-backend newsapp-frontend

# Fetch and pull latest changes
git fetch --all
git checkout main
git pull origin main

# Run migrations
npm run migrate

# Remove build artifacts
rm -rf .next

# Clean install dependencies
npm ci

# Build frontend
npm run frontend:build

# Restart services
pm2 restart newsapp-backend newsapp-frontend
pm2 save

# Reload nginx (only if config changed)
# sudo nginx -t && sudo systemctl reload nginx
```

#### When to Use Clean Update Workflow

Use the clean update workflow when:
- Major version updates have been made
- Dependencies have been added, removed, or updated
- You're experiencing issues with stale build artifacts
- You want to ensure a completely fresh deployment
- Troubleshooting deployment issues

For simple code changes without dependency or configuration updates, the standard update workflow is sufficient.

### Upgrading from Old Single-Process Deployment

If you're upgrading from an old deployment that used a single PM2 process:

```bash
cd /var/www/Appofa

# Stop and delete old single process
pm2 stop newsapp
pm2 delete newsapp

# Fetch and pull latest changes
git fetch --all
git checkout main
git pull origin main

# Remove build artifacts
rm -rf .next

# Clean install dependencies
npm ci

# Build frontend
npm run frontend:build

# Start both new processes
pm2 start src/index.js --name newsapp-backend
pm2 start npm --name newsapp-frontend -- run frontend:start
pm2 save

# Update nginx configuration with split routing (see Nginx section above)
# sudo nano /etc/nginx/sites-available/newsapp
# sudo nginx -t && sudo systemctl reload nginx
```

### Fix Duplicate PM2 Processes

If you encounter duplicate PM2 processes:

```bash
# Stop all running 'newsapp-frontend' processes
pm2 stop newsapp-frontend

# Delete all 'newsapp-frontend' processes
pm2 delete newsapp-frontend

# Restart the frontend with a clean configuration
pm2 start npm --name newsapp-frontend -- run frontend:start

# Check status
pm2 status

# Clean stale PM2 state (if issues persist)
pm2 unstartup
pm2 kill
pm2 startup
pm2 save
```

---

## Additional Resources

- [Main Deployment Guide](DEPLOYMENT_GUIDE.md) - Overview of all deployment options
- [Node.js Upgrade Guide](NODE_UPGRADE_VPS.md) - Upgrading from Node 20 to Node 22
- [Troubleshooting Guide](DEPLOYMENT_GUIDE.md#troubleshooting) - Common issues and solutions

## Support

For issues or questions:
- Check the [Troubleshooting section](DEPLOYMENT_GUIDE.md#troubleshooting)
- Review PM2 logs: `pm2 logs`
- Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Open an issue on [GitHub](https://github.com/Antoniskp/Appofa/issues)
