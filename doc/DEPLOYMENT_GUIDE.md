# Deployment Guide

A comprehensive guide for deploying the Appofa News Application across different environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [VPS Deployment](#vps-deployment)
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

## VPS Deployment

For detailed instructions on deploying to a Virtual Private Server (Ubuntu/Debian), see the **[VPS Setup Guide](VPS_SETUP.md)**.

The VPS Setup Guide is a comprehensive standalone document that covers:

- **Initial VPS Setup**: SSH configuration and server preparation
- **Application Installation**: Node.js, PostgreSQL, PM2 setup
- **Nginx Configuration**: Reverse proxy setup with proper routing for split frontend/backend
- **SSL/HTTPS**: Let's Encrypt certificate installation
- **Post-Deployment Verification**: Testing and validation steps
- **Update Workflows**: Standard and clean update procedures

This guide has been separated from the main deployment documentation for easier reference and maintenance. It provides step-by-step instructions specifically tailored for VPS deployments.

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
