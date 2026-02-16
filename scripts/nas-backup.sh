#!/bin/bash
# ===========================================
# DJ Rotation - NAS Backup Script
# ===========================================
# This script should be added to Synology Task Scheduler
# to run daily backups of the DJ Rotation database.
#
# Setup in DSM:
# 1. Go to Control Panel > Task Scheduler
# 2. Create > Scheduled Task > User-defined script
# 3. Set schedule (e.g., daily at 3:00 AM)
# 4. In Task Settings, paste this script path or content
# ===========================================

CONTAINER_NAME="dj-rotation"
LOG_FILE="/var/log/dj-rotation-backup.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting DJ Rotation backup..." >> "$LOG_FILE"

# Check if container is running
if ! docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" -q | grep -q .; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: Container $CONTAINER_NAME is not running" >> "$LOG_FILE"
  exit 1
fi

# Run backup inside container
docker exec "$CONTAINER_NAME" /app/scripts/backup.sh >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup completed successfully" >> "$LOG_FILE"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: Backup failed" >> "$LOG_FILE"
  exit 1
fi
