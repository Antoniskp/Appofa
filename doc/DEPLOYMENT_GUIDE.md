# Deployment Guide

A comprehensive guide for deploying the Appofa News Application across different environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [VPS Deployment (Ubuntu/Debian)](#vps-deployment-ubuntudebian)
  - [Initial VPS Setup](#initial-vps-setup)
  - [SSH Configuration](#ssh-configuration)
  - [Application Installation](#application-installation)
  - [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
  - [SSL/HTTPS Configuration](#sslhttps-configuration)
  - [Post-Deployment Verification](#post-deployment-verification)
  - [Updating the Application](#updating-the-application)
- [Cloud Platform Deployments](#cloud-platform-deployments)
  - [Heroku](#heroku)
  - [AWS (EC2 + RDS)](#aws-ec2--rds)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Performance Optimization](#performance-optimization)

---

## Overview

The Appofa News Application uses a split architecture:
- **Backend**: Express.js API server (Node.js) on port 3000
- **Frontend**: Next.js application on port 3001
- **Database**: PostgreSQL

Both components must be running for the application to function correctly.

---

## Prerequisites

### All Deployments
- PostgreSQL v12 or higher
- Git

### Local Development
- Node.js v22 or higher (required for Next.js 16.x)
- npm v10.x or higher

### Docker Deployment
- Docker
- Docker Compose

### VPS Deployment
- Ubuntu/Debian Linux server
- Root or sudo access
- Domain name (optional but recommended for HTTPS)

---

## Local Development

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Antoniskp/Appofa.git
   cd Appofa
   ```

2. **Install Node.js 22 LTS**
   
   The project requires Node.js 22+ for:
   - Next.js 16.x compatibility (requires >=20.9.0)
   - npm overrides for `glob@11` and `rimraf@6`
   - Long-term support until April 2027
   
   **macOS (using Homebrew):**
   ```bash
   brew install node@22
   ```
   
   **Ubuntu/Debian:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
   
   **Windows:**
   Download from [nodejs.org](https://nodejs.org/)
   
   **Verify installation:**
   ```bash
   node -v  # Should show v22.x.x
   npm -v   # Should show v10.x.x or higher
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up PostgreSQL database**
   
   **Option A: Using the setup script**
   ```bash
   ./setup-db.sh
   ```
   
   **Option B: Manual setup**
   ```bash
   # Create database
   createdb newsapp
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE newsapp;
   \q
   ```

5. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```
   
   Example `.env` for local development:
   ```env
   # Database Configuration
   DB_NAME=newsapp
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000
   
   # JWT Secret (generate with: openssl rand -base64 32)
   JWT_SECRET=your_jwt_secret
   
   # Environment
   NODE_ENV=development
   ```

6. **Run the application**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Or run backend and frontend separately
   npm run backend          # Starts Express API on port 3000
   npm run frontend         # Starts Next.js dev server on port 3001
   ```

7. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

---

## Docker Deployment

Docker provides a containerized environment with all dependencies included.

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Antoniskp/Appofa.git
   cd Appofa
   ```

2. **Configure environment variables**
   
   Edit `docker-compose.yml` to customize:
   ```yaml
   environment:
     - DB_NAME=newsapp
     - DB_USER=newsapp_user
     - DB_PASSWORD=your_strong_password  # CHANGE IN PRODUCTION!
     - JWT_SECRET=your_jwt_secret        # CHANGE IN PRODUCTION!
     - PORT=3000
     - NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Build and start containers**
   ```bash
   docker-compose up -d
   ```
   
   This will:
   - Create a PostgreSQL database container
   - Build and start the application container
   - Set up networking between containers
   - Expose the API on port 3000

4. **Check logs**
   ```bash
   # View all logs
   docker-compose logs -f
   
   # View app logs only
   docker-compose logs -f app
   ```

5. **Stop the application**
   ```bash
   # Stop containers (preserves data)
   docker-compose down
   
   # Stop and remove all data
   docker-compose down -v
   ```

### Docker Commands Reference

```bash
# Rebuild containers after code changes
docker-compose up -d --build

# Access database container
docker exec -it newsapp-db psql -U newsapp_user newsapp

# View running containers
docker-compose ps

# Restart specific service
docker-compose restart app
```

---

## VPS Deployment (Ubuntu/Debian)

Complete guide for deploying on a Virtual Private Server running Ubuntu or Debian Linux.

### Important Variables to Change

Before deployment, prepare these values:

| Variable | Location | Example |
|----------|----------|---------|
| Database password | `/var/www/Appofa/.env` | `strong_password_123` |
| Database user | `/var/www/Appofa/.env` | `newsapp_user` |
| API URL | `/var/www/Appofa/.env` | `http://185.92.192.81` or `https://your-domain.com` |
| Server name | `/etc/nginx/sites-available/newsapp` | `your-domain.com` |
| Server IP | `/etc/nginx/sites-available/newsapp` | `185.92.192.81` |

---

### Initial VPS Setup

#### SSH Configuration

**1. Fix SSH Runtime Directory**

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

**2. Configure SSH Keepalive**

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

### Application Installation

**1. Install System Dependencies**

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

**2. Set Up PostgreSQL**

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE newsapp;
CREATE USER newsapp_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE newsapp TO newsapp_user;
\q
```

**3. Clone and Configure Application**

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

**4. Configure Environment Variables**

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

**5. Build the Frontend**

```bash
npm run frontend:build
```

This creates optimized production assets in the `.next` directory.

**6. Start with PM2**

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

### Nginx Reverse Proxy Setup

**1. Install Nginx**

```bash
# Install nginx
sudo apt install -y nginx

# Remove default nginx site to avoid server_name conflicts
sudo rm -f /etc/nginx/sites-enabled/default
```

**2. Create Nginx Configuration**

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

**3. Enable the Nginx Configuration**

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

**4. DNS Configuration (for domain access)**

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

**5. Troubleshooting: Apache Welcome Page Still Showing**

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

### SSL/HTTPS Configuration

Use Let's Encrypt for free SSL certificates. **Run this only after DNS resolves correctly and HTTP works.**

**1. Install Certbot**

```bash
# Install certbot with nginx plugin
sudo apt install -y certbot python3-certbot-nginx
```

**2. Request SSL Certificate**

```bash
# Request certificates for both apex domain and www
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will:
- Automatically obtain SSL certificates
- Modify your nginx configuration to enable HTTPS
- Set up automatic renewal

**3. Verify HTTPS is Working**

```bash
curl -I https://your-domain.com
```

**If HTTPS fails but HTTP works:**
- Double-check that DNS resolves to your VPS IP
- Ensure the `server_name` in nginx config contains your domain(s)
- Re-run `sudo nginx -t` and `sudo systemctl reload nginx` after edits

**4. Test Automatic Renewal**

```bash
# Dry-run renewal test
sudo certbot renew --dry-run
```

Certbot automatically sets up a systemd timer for renewals. Check status:
```bash
sudo systemctl status certbot.timer
```

---

### Post-Deployment Verification

After deployment, verify everything is working correctly.

**1. Check Node Version**
```bash
node -v  # Should be v22.x.x
npm -v   # Should be v10.x.x or higher
```

**2. Check PM2 Status**
```bash
pm2 status
# Both newsapp-backend and newsapp-frontend should show "online"
```

**3. Check for Errors**
```bash
# Check for any errors in the logs
pm2 logs --err --lines 50

# Should NOT see:
# - ValidationError: trust proxy
# - Module not found errors
# - Database connection errors
```

**4. Test Endpoints**
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

**5. Check npm audit**
```bash
cd /var/www/Appofa
npm audit
# Should show 0 vulnerabilities
```

**6. Express Trust Proxy Configuration**

The application uses `app.set('trust proxy', 1)` to properly handle rate limiting behind nginx.

**What this means:**
- Express trusts the first proxy (nginx) to set the `X-Forwarded-For` header
- Rate limiting works correctly based on real client IPs
- Security is maintained - only nginx can set the forwarded IP

**⚠️ DO NOT** change this to `true` as it creates a security vulnerability where attackers can bypass rate limiting.

See: https://expressjs.com/en/guide/behind-proxies.html

---

### Updating the Application

#### Standard Update Workflow

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

#### Clean Update Workflow

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

#### Upgrading from Old Single-Process Deployment

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

#### When to Use Clean Update Workflow

Use the clean update workflow when:
- Major version updates have been made
- Dependencies have been added, removed, or updated
- You're experiencing issues with stale build artifacts
- You want to ensure a completely fresh deployment
- Troubleshooting deployment issues

For simple code changes without dependency or configuration updates, the standard update workflow is sufficient.

#### Fix Duplicate PM2 Processes

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

## Cloud Platform Deployments

### Heroku

**1. Install Heroku CLI**
```bash
npm install -g heroku
```

**2. Login and create app**
```bash
heroku login
heroku create your-app-name
```

**3. Add PostgreSQL addon**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

**4. Set environment variables**
```bash
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set NODE_ENV=production
```

**5. Deploy**
```bash
git push heroku main
```

**6. Open application**
```bash
heroku open
```

---

### AWS (EC2 + RDS)

**1. Create RDS PostgreSQL instance**
- Navigate to AWS RDS
- Create PostgreSQL database
- Note the endpoint and credentials

**2. Launch EC2 instance**
- Use Ubuntu/Amazon Linux AMI
- Configure security groups (allow ports 22, 80, 443)

**3. Connect and set up application**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git

# Clone and configure
git clone https://github.com/Antoniskp/Appofa.git
cd Appofa
npm install --production

# Configure .env with RDS credentials
cp .env.example .env
nano .env
```

**4. Set up PM2 and nginx**

Follow the same PM2 and nginx configuration steps as in the [VPS Deployment](#vps-deployment-ubuntudebian) section above.

---

## Monitoring and Maintenance

### View Application Logs

```bash
# PM2 logs
pm2 logs newsapp-backend
pm2 logs newsapp-frontend
pm2 logs --err  # Show only errors

# Docker logs
docker-compose logs -f app

# System logs
sudo journalctl -u nginx -f
```

### Database Backup

**Local PostgreSQL:**
```bash
# Backup
pg_dump -U postgres newsapp > backup.sql

# Restore
psql -U postgres newsapp < backup.sql
```

**VPS PostgreSQL:**
```bash
# Backup
sudo -u postgres pg_dump newsapp > backup_$(date +%Y%m%d).sql

# Restore
sudo -u postgres psql newsapp < backup_20240101.sql
```

**Docker:**
```bash
# Backup
docker exec newsapp-db pg_dump -U newsapp_user newsapp > backup.sql

# Restore
docker exec -i newsapp-db psql -U newsapp_user newsapp < backup.sql
```

### Monitor System Resources

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
# Or
top

# Disk usage
df -h

# Memory usage
free -h

# Check process resource usage
pm2 status
```

### Automated Backups

Create a backup script:

```bash
sudo nano /usr/local/bin/backup-newsapp.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/newsapp"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump newsapp > $BACKUP_DIR/newsapp_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "newsapp_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/newsapp_$DATE.sql"
```

Make it executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/backup-newsapp.sh

# Add to crontab (daily backup at 2 AM)
sudo crontab -e
# Add line: 0 2 * * * /usr/local/bin/backup-newsapp.sh >> /var/log/newsapp-backup.log 2>&1
```

---

## Troubleshooting

### Database Connection Issues

**Symptoms:**
- Application fails to start
- Error: "Connection refused" or "Authentication failed"

**Solutions:**

1. **Verify PostgreSQL is running**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Start if not running
   sudo systemctl start postgresql
   ```

2. **Check database credentials in `.env`**
   ```bash
   nano .env
   # Verify DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
   ```

3. **Ensure database exists**
   ```bash
   sudo -u postgres psql -l | grep newsapp
   ```

4. **Check firewall rules**
   ```bash
   sudo ufw status
   # Allow PostgreSQL if needed
   sudo ufw allow 5432/tcp
   ```

---

### Error: `sh: 1: next: not found`

**Symptoms:**
When running `npm run frontend`, `npm run frontend:build`, or `npm run frontend:start`:
```
sh: 1: next: not found
```

**Root Causes:**
1. Incomplete dependency installation
2. Using `--omit=dev` flag (affects binary linking)
3. Corrupted `node_modules`

**Solution:**

```bash
cd /var/www/Appofa

# Remove existing node_modules and lock file
rm -rf node_modules package-lock.json

# Clean npm cache (optional but recommended)
npm cache clean --force

# Fresh install with locked dependencies
npm ci

# Verify Next.js installation
ls -la node_modules/.bin/next
./node_modules/.bin/next --version

# Test frontend scripts
npm run frontend:build
npm run frontend:start
```

**Production Deployment Notes:**
- **Always use `npm ci`** instead of `npm install` for reproducible builds
- **Do NOT use `--omit=dev`** for this project - all frontend dependencies are in `dependencies`
- The `next` package is required at runtime for both building and serving

---

### Error: Node.js Version Requirement

**Symptoms:**
```
You are using Node.js 18.x.x. For Next.js, Node.js version ">=20.9.0" is required.
```

**Solution: Upgrade to Node.js 22 LTS**

```bash
# Remove old Node.js version
sudo apt remove -y nodejs
sudo apt autoremove -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v22.x.x
npm --version

# Reinstall dependencies with new Node.js version
cd /var/www/Appofa
rm -rf node_modules package-lock.json
npm ci

# Test frontend scripts
npm run frontend:build
npm run frontend:start
```

**Why Node.js 22 is required:**
- Next.js 16.x requires Node.js >=20.9.0
- npm overrides for `glob@11` and `rimraf@6` require Node 22+
- Initial deployment guide uses Node.js 22 LTS

---

### Backend Shows "ValidationError: trust proxy"

**Cause:** express-rate-limit update requires proper trust proxy configuration

**Solution:**
Ensure `src/index.js` has `app.set('trust proxy', 1);` not `true`

**Reference:** PR #153

---

### Frontend Shows "Could not find production build"

**Cause:** Missing `.next` build directory

**Solution:**
```bash
cd /var/www/Appofa
npm run frontend:build
pm2 restart newsapp-frontend
```

---

### Port Already in Use

**Symptoms:**
- Error: "EADDRINUSE: address already in use"
- Application fails to start

**Solution:**

```bash
# Find process using port 3000
lsof -i :3000
# Or
netstat -tulpn | grep 3000

# Kill specific process by PID
kill -9 <PID>

# For port 3001 (frontend)
lsof -i :3001
kill -9 <PID>
```

---

### Application Won't Start

**Checklist:**

1. **Check logs for errors**
   ```bash
   pm2 logs --err --lines 50
   ```

2. **Verify all environment variables are set**
   ```bash
   cat .env
   # Ensure JWT_SECRET, DB credentials, etc. are set
   ```

3. **Ensure database is accessible**
   ```bash
   psql -U newsapp_user -d newsapp -h localhost
   ```

4. **Check Node.js version compatibility**
   ```bash
   node -v  # Should be v22.x.x
   ```

5. **Verify both PM2 processes are running**
   ```bash
   pm2 status
   # Both newsapp-backend and newsapp-frontend should show "online"
   ```

---

### 404 Errors for Static Assets

**Symptoms:**
- Browser shows 404 errors for `/_next/static/chunks/*.js`
- Pages appear broken or don't function properly
- Sign-up/sign-in pages not working

**Cause:** Incorrect nginx routing

**Solution:**

1. **Verify nginx configuration** includes `/_next/` location block (see [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup))

2. **Ensure frontend PM2 process is running**
   ```bash
   pm2 status
   # newsapp-frontend should show "online"
   ```

3. **Test nginx configuration and reload**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### SSL Certificate Issues

**Certificate not auto-renewing:**

```bash
# Test renewal
sudo certbot renew --dry-run

# Check certbot timer
sudo systemctl status certbot.timer

# Enable if disabled
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

**Certificate expired:**
```bash
# Force renewal
sudo certbot renew --force-renewal

# Reload nginx
sudo systemctl reload nginx
```

---

## Security Best Practices

### Before Production Deployment

**1. Change Sensitive Credentials**

- Generate a strong JWT secret:
  ```bash
  openssl rand -base64 32
  ```
- Use a strong database password (at least 16 characters, mixed case, numbers, symbols)
- Never commit `.env` file to version control

**2. Update Environment Variables**

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
DB_PASSWORD=<strong-password>
```

**3. Enable HTTPS**

- Use a reverse proxy (nginx recommended)
- Obtain SSL certificate from Let's Encrypt (free)
- Force HTTPS redirects in nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

**4. Configure Firewall**

```bash
# Enable UFW firewall
sudo ufw enable

# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Deny direct access to application ports
sudo ufw deny 3000/tcp
sudo ufw deny 3001/tcp

# Check firewall status
sudo ufw status
```

**5. Secure PostgreSQL**

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/postgresql.conf

# Ensure it only listens on localhost
listen_addresses = 'localhost'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**6. Set Up Monitoring**

- Application logs: Use PM2 or centralized logging
- Database monitoring: PostgreSQL logs
- Error tracking: Consider services like Sentry
- Uptime monitoring: Consider services like UptimeRobot

**7. Regular Security Updates**

```bash
# Keep dependencies updated
npm audit fix

# Update system packages
sudo apt update && sudo apt upgrade -y

# Check for security vulnerabilities
npm audit
```

**8. Rate Limiting**

The application has rate limiting configured. Verify in `src/index.js`:
- Trust proxy is set to `1` (not `true`)
- Rate limit middleware is enabled

**9. Implement Proper Session Management**

- Use secure, httpOnly cookies
- Implement session timeout
- Rotate JWT tokens regularly

**10. Input Validation**

- Validate all user inputs
- Sanitize data before database queries
- Use parameterized queries (already implemented with Sequelize)

---

## Performance Optimization

### Application Level

**1. Enable Connection Pooling**
Already configured in Sequelize. Verify pool settings in database config:

```javascript
pool: {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000
}
```

**2. Use Caching**
Consider implementing Redis for:
- Session storage
- Token caching
- Frequently accessed data

**3. Enable Compression**
Already enabled in Express. Verify in `src/index.js`:
```javascript
app.use(compression());
```

**4. Database Indexing**
Add indexes for frequently queried fields:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_articles_created_at ON articles(created_at);
```

### Infrastructure Level

**1. Use a CDN**
For static assets, consider:
- Cloudflare (free tier available)
- AWS CloudFront
- Vercel Edge Network

**2. Optimize Nginx**

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

# Enable caching for static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**3. PM2 Cluster Mode**

For production environments with multiple CPU cores:

```bash
# Stop existing processes
pm2 stop newsapp-backend

# Start in cluster mode (uses all CPU cores)
pm2 start src/index.js --name newsapp-backend -i max

# Save configuration
pm2 save
```

**4. Load Balancing**

For high traffic, consider:
- Multiple application servers behind a load balancer
- Database read replicas
- Separate static asset server

**5. Monitor Performance**

```bash
# PM2 monitoring
pm2 monit

# Check slow queries in PostgreSQL
sudo -u postgres psql newsapp
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Database Optimization

**1. Regular VACUUM**
```bash
# Auto-vacuum is enabled by default
# Manual vacuum if needed
sudo -u postgres vacuumdb --analyze newsapp
```

**2. Monitor Connection Pool**
```bash
# Check active connections
sudo -u postgres psql newsapp
SELECT count(*) FROM pg_stat_activity;
```

**3. Optimize Queries**
- Use EXPLAIN ANALYZE to identify slow queries
- Add appropriate indexes
- Avoid N+1 query problems

---

## Additional Resources

- [Node.js VPS Upgrade Guide](./NODE_UPGRADE_VPS.md) - Step-by-step Node.js upgrade instructions
- [Upgrade Guide](./UPGRADE_GUIDE.md) - Application upgrade procedures
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute to the project
- [API Documentation](./API.md) - API endpoints and usage
- [Express.js Behind Proxies](https://expressjs.com/en/guide/behind-proxies.html) - Trust proxy documentation
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/) - SSL certificate management
- [PM2 Documentation](https://pm2.keymetrics.io/docs/) - Process management
- [Nginx Documentation](https://nginx.org/en/docs/) - Web server configuration

---

## Support

If you encounter issues not covered in this guide:

1. Check existing [GitHub Issues](https://github.com/Antoniskp/Appofa/issues)
2. Review [PR history](https://github.com/Antoniskp/Appofa/pulls) for recent changes
3. Create a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Relevant log outputs
   - Environment details (Node version, OS, etc.)

---

**Last Updated:** Based on VPS deployment procedures and Node.js 22 requirements

**Version:** 1.0.0 (Consolidated from DEPLOYMENT.md and VPS_DEPLOYMENT.md)
