#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="cyberchaukidaar-ai-theft.service"

if [ ! -f "$SERVICE_NAME" ]; then
  echo "Service file not found: $SERVICE_NAME"
  exit 1
fi

sudo cp "$SERVICE_NAME" /etc/systemd/system/"$SERVICE_NAME"
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager
