#!/bin/bash
# This script requires the following environment variables to be set:
# 
# - BACKUP_DIR: The directory where backups will be stored
# - SOURCE_DB: The path to the SQLite database file to backup
# - STORAGE_DIR: The directory of assets to sync to the backup directory

# Load environment variables from .env file
set -o allexport
source "$(dirname "$0")/.env"
set +o allexport

# Ensure the backup directory exists
mkdir -p "$BACKUP_DIR"

# Backup the SQLite file with a timestamp
cp "$SOURCE_DB" "$BACKUP_DIR/your_database_$(date +'%Y%m%d%H%M%S').sqlite"

# Sync new files from STORAGE_DIR to BACKUP_DIR (ignoring existing files)
rsync -a --ignore-existing "$STORAGE_DIR/" "$BACKUP_DIR/storage/"

# Remove old SQLite backups, keeping only the most recent $MAX_BACKUPS
ls -1t "$BACKUP_DIR"/*.sqlite | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f