#!/bin/bash
# Initial Staging Environment Setup Script
# This script sets up the staging environment on the VPS for the first time
# 
# Usage: Run this script on the VPS as a user with sudo privileges
# Example: curl -fsSL https://raw.githubusercontent.com/Antoniskp/Appofa/main/scripts/setup-staging.sh | bash

set -e  # Exit on any error

echo "========================================="
echo "Initial Staging Environment Setup"
echo "NON-PRODUCTION ENVIRONMENT"
echo "========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    echo "Note: Running as root"
    SUDO=""
else
    echo "Note: Running as regular user (will use sudo when needed)"
    SUDO="sudo"
fi

# Step 1: Clone repository
echo "Step 1: Cloning repository to /var/www/Appofa-staging..."
if ! cd /var/www 2>/dev/null; then
    echo "Error: Cannot access /var/www directory. Please ensure it exists and you have permission."
    exit 1
fi

if [ -d "Appofa-staging" ]; then
    echo "Warning: Appofa-staging directory already exists. Skipping clone."
    cd Appofa-staging
else
    $SUDO git clone https://github.com/Antoniskp/Appofa.git Appofa-staging
    cd Appofa-staging
    echo "✓ Repository cloned"
fi

# Step 2: Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
npm ci
echo "✓ Dependencies installed"

# Step 3: Create staging environment file
echo ""
echo "Step 3: Creating staging environment configuration..."
if [ -f ".env.staging" ]; then
    echo "Warning: .env.staging already exists. Skipping creation."
else
    cp .env.staging.example .env.staging
    echo "✓ Created .env.staging from template"
    echo ""
    echo "IMPORTANT: You must edit .env.staging with your actual credentials:"
    echo "  nano .env.staging"
    echo ""
    echo "Required changes:"
    echo "  - DB_PASSWORD: Set to production database password"
    echo "  - JWT_SECRET: Set to your JWT secret"
    echo "  - GITHUB_CLIENT_ID: Set to staging GitHub OAuth client ID"
    echo "  - GITHUB_CLIENT_SECRET: Set to staging GitHub OAuth client secret"
fi

# Step 4: Copy staging config to .env
echo ""
echo "Step 4: Copying staging config to .env..."
cp .env.staging .env
echo "✓ Staging config copied to .env"

# Step 5: Build frontend
echo ""
echo "Step 5: Building frontend..."
npm run frontend:build
echo "✓ Frontend built successfully"

# Step 6: Configure nginx
echo ""
echo "Step 6: Configuring nginx for staging..."
if [ -f "/etc/nginx/sites-available/newsapp-staging" ]; then
    echo "Warning: Nginx staging config already exists. Skipping."
else
    $SUDO cp config/nginx/staging.conf /etc/nginx/sites-available/newsapp-staging
    
    # Enable the site
    if [ -L "/etc/nginx/sites-enabled/newsapp-staging" ]; then
        $SUDO rm /etc/nginx/sites-enabled/newsapp-staging
    fi
    $SUDO ln -s /etc/nginx/sites-available/newsapp-staging /etc/nginx/sites-enabled/
    
    # Test configuration
    $SUDO nginx -t
    
    echo "✓ Nginx configured for staging"
fi

# Step 7: Start PM2 processes
echo ""
echo "Step 7: Starting PM2 processes..."

# Check if processes already exist
if pm2 describe newsapp-staging-backend > /dev/null 2>&1; then
    echo "Restarting existing newsapp-staging-backend process..."
    pm2 restart newsapp-staging-backend
else
    echo "Starting newsapp-staging-backend process..."
    pm2 start src/index.js --name newsapp-staging-backend
fi

if pm2 describe newsapp-staging-frontend > /dev/null 2>&1; then
    echo "Restarting existing newsapp-staging-frontend process..."
    pm2 restart newsapp-staging-frontend
else
    echo "Starting newsapp-staging-frontend process..."
    pm2 start npm --name newsapp-staging-frontend -- run frontend:start -- -p 3003
fi

pm2 save
echo "✓ PM2 processes started and saved"

# Step 8: Reload nginx
echo ""
echo "Step 8: Reloading nginx..."
$SUDO systemctl reload nginx
echo "✓ Nginx reloaded"

# Step 9: Display summary
echo ""
echo "========================================="
echo "Staging Environment Setup Complete!"
echo "========================================="
echo ""
echo "Environment: STAGING (Non-Production)"
echo "Installation Directory: /var/www/Appofa-staging"
echo ""
echo "Services Status:"
pm2 status | grep -E "staging|Status" || pm2 status
echo ""
echo "========================================="
echo "NEXT STEPS:"
echo "========================================="
echo ""
echo "1. Configure DNS:"
echo "   Add an A record for staging.appofasi.gr pointing to your VPS IP"
echo ""
echo "2. Edit staging configuration:"
echo "   nano /var/www/Appofa-staging/.env.staging"
echo "   Update: DB_PASSWORD, JWT_SECRET, GitHub OAuth credentials"
echo ""
echo "3. Set up SSL certificate:"
echo "   sudo certbot --nginx -d staging.appofasi.gr"
echo ""
echo "4. Verify deployment:"
echo "   curl https://staging.appofasi.gr"
echo ""
echo "5. Configure GitHub Actions secrets (for automated deployments):"
echo "   - VPS_HOST: Your VPS IP address"
echo "   - VPS_USERNAME: SSH username"
echo "   - VPS_SSH_KEY: Private SSH key"
echo ""
echo "For more details, see: doc/STAGING_DEPLOYMENT.md"
echo ""
