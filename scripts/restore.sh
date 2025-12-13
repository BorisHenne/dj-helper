#!/bin/sh
# Restore script for DJ Rotation database

BACKUP_DIR="/app/backups"
DB_PATH="/app/database/data/dj-rotation.db"

# List available backups
if [ "$1" = "list" ] || [ -z "$1" ]; then
  echo "📦 Available backups:"
  ls -lh "$BACKUP_DIR"/dj-rotation_*.db 2>/dev/null || echo "No backups found"
  echo ""
  echo "Usage: restore.sh <backup_file>"
  echo "Example: restore.sh dj-rotation_2025-01-15_03-00-00.db"
  exit 0
fi

BACKUP_FILE="$BACKUP_DIR/$1"

# Check if backup exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Create a safety backup before restore
SAFETY_BACKUP="$BACKUP_DIR/pre-restore_$(date +%Y-%m-%d_%H-%M-%S).db"
if [ -f "$DB_PATH" ]; then
  echo "🔒 Creating safety backup: $SAFETY_BACKUP"
  cp "$DB_PATH" "$SAFETY_BACKUP"
fi

# Restore from backup
echo "🔄 Restoring from: $BACKUP_FILE"
cp "$BACKUP_FILE" "$DB_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Database restored successfully"
  echo "⚠️  Restart the container for changes to take effect"
else
  echo "❌ Restore failed"
  exit 1
fi
