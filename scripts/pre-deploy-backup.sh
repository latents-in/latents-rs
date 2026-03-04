#!/bin/bash

# Pre-deploy binary backup script for latents-server
# Keeps last 5 backups

set -e

INSTALL_DIR="/opt/latents"
BINARY_NAME="latents-server"
BACKUP_DIR="$INSTALL_DIR/backups/pre-deploy"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup current binary if it exists
if [ -f "$INSTALL_DIR/bin/$BINARY_NAME" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/$BINARY_NAME-$TIMESTAMP"

    cp "$INSTALL_DIR/bin/$BINARY_NAME" "$BACKUP_FILE"
    echo "Backed up to $BACKUP_FILE"

    # Keep only last 5 backups
    find "$BACKUP_DIR" -type f -name "$BINARY_NAME-*" | sort -r | tail -n +6 | xargs -r rm
    echo "Cleaned old backups (keeping last 5)"
else
    echo "No existing binary to backup"
fi
