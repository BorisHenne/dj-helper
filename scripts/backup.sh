#!/bin/sh
# Daily backup script for DJ Rotation database

BACKUP_DIR="/app/backups"
DB_PATH="/app/database/data/dj-rotation.db"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/dj-rotation_$DATE.db"
MAX_BACKUPS=7  # Keep last 7 days of backups

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo "❌ Database file not found at $DB_PATH"
  exit 1
fi

# Create backup using SQLite's backup command for consistency
echo "📦 Creating backup: $BACKUP_FILE"
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

if [ $? -eq 0 ]; then
  echo "✅ Backup created successfully"
  
  # Remove old backups (keep only last MAX_BACKUPS)
  BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/dj-rotation_*.db 2>/dev/null | wc -l)
  if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    echo "🗑️  Cleaning old backups (keeping last $MAX_BACKUPS)..."
    ls -1t "$BACKUP_DIR"/dj-rotation_*.db | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
  fi
  
  echo "📊 Current backups:"
  ls -lh "$BACKUP_DIR"/dj-rotation_*.db 2>/dev/null
else
  echo "❌ Backup failed"
  exit 1
fi
