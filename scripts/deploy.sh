#!/bin/bash

# Deployment script for Appofa News Application
# This script updates the application to the latest version from Git

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Configuration
APP_DIR="${APP_DIR:-/var/www/Appofa}"
BRANCH="${BRANCH:-main}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"
RUN_SEEDS="${RUN_SEEDS:-0}"
FAST_STARTUP="${FAST_STARTUP:-0}"
LOCK_HASH_FILE=".last-package-lock.sha256"

# Fallback for development/container environments
if [ ! -d "$APP_DIR" ]; then
	APP_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

# Navigate to application directory
cd "$APP_DIR"

echo "📦 Stopping running services..."
if command -v pm2 >/dev/null 2>&1; then
	pm2 stop newsapp-backend newsapp-frontend || true
else
	echo "ℹ️  PM2 not installed; skipping stop"
fi

if [ "$SKIP_GIT_PULL" != "1" ]; then
	echo "📥 Fetching latest changes from Git..."
	git fetch --all
	git checkout "$BRANCH"
	git pull origin "$BRANCH"
else
	echo "⏭️  Skipping Git fetch/pull (SKIP_GIT_PULL=1)"
fi

NEEDS_NPM_CI=1
if [ "$FAST_STARTUP" = "1" ] && [ -d node_modules ] && [ -f package-lock.json ]; then
	CURRENT_LOCK_HASH="$(sha256sum package-lock.json | awk '{print $1}')"
	SAVED_LOCK_HASH=""

	if [ -f "$LOCK_HASH_FILE" ]; then
		SAVED_LOCK_HASH="$(cat "$LOCK_HASH_FILE")"
	fi

	if [ "$CURRENT_LOCK_HASH" = "$SAVED_LOCK_HASH" ]; then
		NEEDS_NPM_CI=0
		echo "⏭️  Skipping npm ci (FAST_STARTUP=1 and package-lock.json unchanged)"
	else
		echo "🔄 package-lock.json changed (or hash missing); running npm ci"
	fi
fi

if [ "$NEEDS_NPM_CI" = "1" ]; then
	echo "📦 Installing dependencies..."
	npm ci
fi

if [ -f package-lock.json ]; then
	sha256sum package-lock.json | awk '{print $1}' > "$LOCK_HASH_FILE"
fi

echo "🔄 Running database migrations..."
npm run migrate

if [ "$RUN_SEEDS" = "1" ]; then
	echo "🌱 Running database seeds..."
	npm run seed:locations
	npm run seed
fi

echo "🧹 Cleaning build artifacts..."
rm -rf .next

echo "🏗️  Building frontend..."
NODE_ENV=production npm run frontend:build

# Record the git commit that was built so start-frontend.js can detect future code changes.
git rev-parse HEAD > .next/BUILD_GIT_REF 2>/dev/null || true

echo "♻️  Restarting services with PM2..."
if command -v pm2 >/dev/null 2>&1; then
	if pm2 describe newsapp-backend >/dev/null 2>&1; then
		pm2 restart newsapp-backend
	else
		pm2 start src/index.js --name newsapp-backend
	fi

	if pm2 describe newsapp-frontend >/dev/null 2>&1; then
		pm2 restart newsapp-frontend
	else
		pm2 start npm --name newsapp-frontend -- run frontend:start
	fi

	pm2 save
else
	echo "⚠️  PM2 not installed; backend/frontend were not started"
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "Application status:"
if command -v pm2 >/dev/null 2>&1; then
	pm2 status
else
	echo "PM2 not installed"
fi

# Uncomment if nginx config changed
# echo "🔄 Reloading nginx..."
# sudo nginx -t && sudo systemctl reload nginx
