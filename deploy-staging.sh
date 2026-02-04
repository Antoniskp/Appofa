#!/bin/bash
# Staging Deployment Script
# This script deploys the latest changes to the staging environment
# 
# Usage: ./deploy-staging.sh
# Must be run from /var/www/Appofa-staging on the VPS

set -e  # Exit on any error

echo "========================================="
echo "Staging Deployment Script"
echo "NON-PRODUCTION ENVIRONMENT"
echo "========================================="

# Verify we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo "Error: Must be run from the Appofa-staging directory"
    exit 1
fi

# Step 1: Stop PM2 processes
echo ""
echo "Step 1: Stopping PM2 processes..."
pm2 stop newsapp-staging-backend newsapp-staging-frontend || true

# Step 2: Pull latest changes
echo ""
echo "Step 2: Fetching latest changes from GitHub..."
git fetch --all
git checkout main
git pull origin main

# Step 3: Clean build artifacts
echo ""
echo "Step 3: Removing old build artifacts..."
rm -rf .next

# Step 4: Install dependencies
echo ""
echo "Step 4: Installing dependencies..."
npm ci

# Step 5: Copy staging environment config
echo ""
echo "Step 5: Copying staging environment configuration..."
if [ -f ".env.staging" ]; then
    cp .env.staging .env
    echo "✓ Staging config copied to .env"
else
    echo "Warning: .env.staging not found. Using existing .env"
fi

# Step 6: Build frontend
echo ""
echo "Step 6: Building frontend..."
npm run frontend:build

# Step 7: Restart PM2 processes
echo ""
echo "Step 7: Restarting PM2 processes..."
# Backend on port 3002 (configured in .env)
pm2 restart newsapp-staging-backend 2>/dev/null || pm2 start src/index.js --name newsapp-staging-backend
# Frontend on port 3003
pm2 restart newsapp-staging-frontend 2>/dev/null || pm2 start npm --name newsapp-staging-frontend -- run frontend:start -- -p 3003

# Step 8: Save PM2 configuration
echo ""
echo "Step 8: Saving PM2 configuration..."
pm2 save

# Step 9: Display status
echo ""
echo "Step 9: Checking process status..."
pm2 status | grep -E "staging|Status" || pm2 status

echo ""
echo "========================================="
echo "Staging Deployment Complete!"
echo ""
echo "Environment: STAGING (Non-Production)"
echo "URL: https://staging.appofasi.gr"
echo ""
echo "Backend: newsapp-staging-backend (port 3002)"
echo "Frontend: newsapp-staging-frontend (port 3003)"
echo "========================================="
echo ""
echo "To view logs:"
echo "  pm2 logs newsapp-staging-backend"
echo "  pm2 logs newsapp-staging-frontend"
echo ""
