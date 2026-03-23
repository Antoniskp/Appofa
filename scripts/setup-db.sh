#!/bin/bash

# Database Setup Script for News Application

echo "==================================="
echo "Database Setup for News Application"
echo "==================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first"
    exit 1
fi

echo "PostgreSQL found!"
echo ""

# Set default values
DB_NAME=${DB_NAME:-newsapp}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "Database Configuration:"
echo "  Database Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Check if database exists
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null)

if [ "$DB_EXISTS" = "1" ]; then
    echo "Database '$DB_NAME' already exists."
    echo "Do you want to drop and recreate it? (y/N): "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Dropping database '$DB_NAME'..."
        PGPASSWORD=$DB_PASSWORD dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        echo "Creating database '$DB_NAME'..."
        PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        echo "Database created successfully!"
    else
        echo "Using existing database."
    fi
else
    echo "Creating database '$DB_NAME'..."
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    if [ $? -eq 0 ]; then
        echo "Database created successfully!"
    else
        echo "Error creating database. Please check your PostgreSQL credentials."
        exit 1
    fi
fi

echo ""
echo "Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the database credentials"
echo "2. Run 'npm start' or 'npm run dev' to start the server"
echo "3. The application will automatically create the necessary tables"
echo ""
