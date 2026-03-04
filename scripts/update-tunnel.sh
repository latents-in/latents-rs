#!/bin/bash

# Update Cloudflare tunnel configuration for latents.obybuy.com
# Verifies the tunnel entry exists in /etc/cloudflared/config.yml
# If missing, adds it before the catch-all rule

set -e

CONFIG_FILE="/etc/cloudflared/config.yml"
DOMAIN="latents.obybuy.com"
PORT="5000"

echo "Checking Cloudflare tunnel configuration..."

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: $CONFIG_FILE not found"
    exit 1
fi

# Check if domain entry already exists
if grep -q "^  - hostname: $DOMAIN" "$CONFIG_FILE"; then
    echo "✓ Tunnel entry for $DOMAIN already configured"
else
    echo "Adding tunnel entry for $DOMAIN..."

    # Backup the config file
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup-$(date +%Y%m%d_%H%M%S)"
    echo "Backed up config to $CONFIG_FILE.backup-*"

    # Add the domain entry before the catch-all rule
    # This assumes the catch-all (ingress rule without hostname) is at the end
    sed -i "/^  - service:/i\\  - hostname: $DOMAIN\n    service: http:\/\/localhost:$PORT\n    originRequest:\n      disableChunkedEncoding: true\n      connectTimeout: 30s" "$CONFIG_FILE"

    echo "✓ Added tunnel entry for $DOMAIN"
fi

# Reload cloudflared to apply changes
echo "Reloading cloudflared..."
sudo systemctl reload cloudflared || sudo systemctl restart cloudflared

echo "✓ Tunnel configuration updated"
