#!/bin/sh
set -e

echo "🚀 Starting DJ Rotation..."

# Ensure data directories exist
mkdir -p /app/database/data
mkdir -p /app/backups

# Run database migrations (creates tables if they don't exist)
echo "📋 Running database migrations..."
npx drizzle-kit push

# Run date migration if needed (safe to run multiple times)
echo "📅 Running date format migration..."
npx tsx database/migrate-dates.ts

# Check if database needs seeding (only on first run)
echo "🔍 Checking database state..."
if npx tsx database/init.ts; then
  echo "✅ Database already has data - skipping seed"
else
  echo "🌱 First run detected - seeding database..."
  npx tsx database/seed.ts
fi

# Create initial backup if none exists
if [ ! "$(ls -A /app/backups/*.db 2>/dev/null)" ]; then
  echo "📦 Creating initial backup..."
  /app/scripts/backup.sh || echo "⚠️  Initial backup skipped (will retry later)"
fi

echo "✅ Initialization complete"
echo "🎵 Starting Next.js server..."

# Start the application
exec node server.js
