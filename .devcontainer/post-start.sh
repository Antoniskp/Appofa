#!/bin/bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="${DB_NAME:-newsapp}"
DB_PASSWORD="${DB_PASSWORD:-password}"

echo "🚀 Devcontainer startup automation"
cd "$APP_DIR"

echo "🐘 Starting PostgreSQL service..."
service postgresql start

echo "⏳ Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if su - postgres -c "pg_isready -h localhost -p 5432" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! su - postgres -c "pg_isready -h localhost -p 5432" >/dev/null 2>&1; then
  echo "❌ PostgreSQL did not become ready in time"
  exit 1
fi

echo "🔐 Ensuring postgres password is configured..."
su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"ALTER USER postgres WITH PASSWORD '${DB_PASSWORD}';\""

echo "🗄️  Ensuring database '${DB_NAME}' exists..."
if ! su - postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\"" | grep -q 1; then
  su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"CREATE DATABASE ${DB_NAME};\""
fi

if [ ! -f .env ] && [ -f .env.example ]; then
  echo "📄 Creating .env from .env.example"
  cp .env.example .env
fi

echo "📦 Deploying app (migrations + seeds + build + PM2 start/restart)..."
SKIP_GIT_PULL=1 RUN_SEEDS=1 FAST_STARTUP=1 APP_DIR="$APP_DIR" bash ./deploy.sh

echo "✅ Devcontainer startup complete"