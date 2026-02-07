#!/bin/bash

echo "🐘 Installing PostgreSQL 16..."
echo ""

# Fix Homebrew permissions if needed
echo "Fixing Homebrew permissions..."
sudo chown -R $(whoami) /opt/homebrew/Cellar
sudo chown -R $(whoami) /opt/homebrew/Library
sudo chown -R $(whoami) /opt/homebrew/var

# Update Homebrew
echo ""
echo "Updating Homebrew..."
brew update

# Install PostgreSQL 16
echo ""
echo "Installing PostgreSQL 16..."
brew install postgresql@16

# Start PostgreSQL service
echo ""
echo "Starting PostgreSQL service..."
brew services start postgresql@16

# Wait for PostgreSQL to start
echo ""
echo "Waiting for PostgreSQL to initialize..."
sleep 5

# Create database
echo ""
echo "Creating 'clawdsales' database..."
createdb clawdsales

# Test connection
echo ""
echo "Testing database connection..."
psql clawdsales -c "SELECT version();"

echo ""
echo "✅ PostgreSQL installation complete!"
echo ""
echo "🔧 Now updating your .env file..."

# Get username
USERNAME=$(whoami)

# Update .env file with correct DATABASE_URL
cd /Users/dani/Desktop/SALG
sed -i '' "s|DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/clawdsales?schema=public\"|DATABASE_URL=\"postgresql://$USERNAME@localhost:5432/clawdsales?schema=public\"|g" .env

echo "✅ .env file updated!"
echo ""
echo "🚀 Next steps:"
echo "   cd /Users/dani/Desktop/SALG"
echo "   npm run db:generate"
echo "   npm run db:push"
echo "   npm run db:seed"
echo "   npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
