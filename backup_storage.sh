#!/bin/bash
# Syncs new files from a directory to a backup directory
# This script requires the following environment variables to be set:
# 
# - STORAGE_BACKUP_DIR: The directory where backups will be stored
# - STORAGE_DIR: The directory of assets to sync to the backup directory

# Load environment variables from .env file
set -o allexport
source "$(dirname "$0")/.env"
set +o allexport

# Ensure the backup directory exists
mkdir -p "$STORAGE_BACKUP_DIR"

# Sync new files from STORAGE_DIR to BACKUP_DIR (ignoring existing files)
rsync -a --ignore-existing "$STORAGE_DIR/" "$STORAGE_BACKUP_DIR/"
