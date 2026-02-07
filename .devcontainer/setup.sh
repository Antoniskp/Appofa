#!/bin/bash

echo "🚀 Setting up Appofa development environment..."

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
sudo service postgresql start

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -p 5432 -U postgres; do
  sleep 1
done

# Create database
echo "🗄️ Creating database..."
sudo -u postgres psql -c "CREATE DATABASE newsapp;" || echo "Database already exists"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Run migrations
echo "🔄 Running database migrations..."
npm run migrate:up

# Seed the database (optional - comment out if you don't want initial data)
echo "🌱 Seeding database..."
npm run seed || echo "Seeding skipped or failed"

echo "✅ Setup complete!"
echo ""
echo "🎉 Your development environment is ready!"
echo ""
echo "To start the app, run:"
echo "  - Backend API: npm run dev (port 3000)"
echo "  - Frontend: npm run frontend (port 3001)"
echo ""
echo "Or run both in separate terminals!"