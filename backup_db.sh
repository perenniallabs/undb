#!/bin/bash
# Backs up an SQLite database file with a timestamp
# This script requires the following environment variables to be set:
# 
# - DB_BACKUP_DIR: The directory where backups will be stored
# - DB_PATH: The path to the SQLite database file to backup
# - DB_MAX_BACKUPS: The maximum number of backups to keep in the directory

# Load environment variables from .env file
set -o allexport
source "$(dirname "$0")/.env"
set +o allexport

# Ensure the backup directory exists
mkdir -p "$DB_BACKUP_DIR"

# Backup the SQLite file with a timestamp
cp "$DB_PATH" "$DB_BACKUP_DIR/undb_$(date +'%Y%m%d%H%M%S').sqlite"

# Remove old SQLite backups, keeping only the most recent $DB_MAX_BACKUPS
ls -1t "$DB_BACKUP_DIR"/*.sqlite | tail -n +$((DB_MAX_BACKUPS + 1)) | xargs rm -f