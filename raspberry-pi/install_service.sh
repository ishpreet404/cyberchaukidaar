#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-cyberchaukidaar-ai-theft.service}"

if [ ! -f "$SERVICE_NAME" ]; then
  echo "Service file not found: $SERVICE_NAME"
  echo "Usage: ./install_service.sh [service-file]"
  echo "Example: ./install_service.sh cyberchaukidaar-deauth-guard.service"
  exit 1
fi

sudo cp "$SERVICE_NAME" /etc/systemd/system/"$SERVICE_NAME"
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager
