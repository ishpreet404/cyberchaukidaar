# Raspberry Pi YOLOv8n Theft Detection

This folder provides the Pi-side runtime for Cyber Chaukidaar AI Theft Detection.

It does three jobs:
1. Runs YOLOv8n person detection from a Pi camera.
2. Serves an MJPEG stream for the website (`/stream.mjpg`).
3. Sends theft alerts to the web alert bridge (`/api/ai-theft/event`) which then powers website alerts and Telegram alerts.

## 1) Install on Raspberry Pi

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip libatlas-base-dev libopenblas-dev

cd ~/hacktivate/raspberry-pi
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Notes:
- `ultralytics` will download `yolov8n.pt` on first run.
- If OpenCV camera read fails, verify camera support (`libcamera-hello`).

## 2) Start detector on Pi

```bash
source .venv/bin/activate
python yolov8n_theft_detector.py \
  --camera-source 0 \
  --camera-id pi-cam-1 \
  --bridge-url http://<YOUR_WEB_OR_BRIDGE_HOST>:8787/api/ai-theft/event
```

Optional secret:
```bash
python yolov8n_theft_detector.py \
  --bridge-url http://<HOST>:8787/api/ai-theft/event \
  --alert-secret "your-shared-secret"
```

## 3) Connect website page

In `AI Theft Detection` page:
- Stream URL: `http://<PI_IP>:8080/stream.mjpg`
- Alert Bridge Base URL: `http://<YOUR_WEB_OR_BRIDGE_HOST>:8787`

The page already subscribes to `/api/ai-theft/stream` and falls back to polling `/api/ai-theft/events`.

## 4) Telegram alerts

Run bridge with Telegram env vars (on the machine where `server/ai-theft-bridge.js` runs):

```bash
TELEGRAM_BOT_TOKEN=<token> TELEGRAM_CHAT_ID=<chat_id> node server/ai-theft-bridge.js
```

## 5) Test end-to-end

From Pi:
```bash
curl -X POST http://127.0.0.1:8080/test-alert
```

From bridge host:
```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/api/ai-theft/events
```

## 6) Auto-start on boot (optional)

Edit `cyberchaukidaar-ai-theft.service` and replace `<BRIDGE_HOST>`.

```bash
chmod +x install_service.sh
./install_service.sh
```

Check logs:

```bash
sudo journalctl -u cyberchaukidaar-ai-theft.service -f
```

## Endpoint summary

Pi detector server:
- `GET /stream.mjpg`
- `GET /events`
- `GET /latest`
- `GET /health`
- `POST /test-alert`

Bridge server:
- `GET /api/ai-theft/stream`
- `GET /api/ai-theft/events`
- `POST /api/ai-theft/event`
- `POST /api/ai-theft/test`
- `GET /health`

---

# Raspberry Pi Wi-Fi Deauth Guard

This folder also includes a Wi-Fi deauthentication/disassociation detector:

- `deauth_guard.py`
- Posts alerts to bridge endpoint: `/api/deauth/event`
- Exposes local health and test endpoints on Pi

## 1) Prepare monitor mode interface

Use a compatible Wi-Fi adapter and place it in monitor mode.

Example:

```bash
sudo ip link set wlan0 down
sudo iw wlan0 set monitor control
sudo ip link set wlan0 up
```

If your distro creates a separate interface (e.g. `wlan0mon`), use that interface in the command below.

## 2) Start deauth guard

Lab profile (recommended for first validation):

```bash
source .venv/bin/activate
python deauth_guard.py \
  --profile lab \
  --interface wlan0mon \
  --source raspberry-pi-deauth \
  --bridge-url http://<YOUR_WEB_OR_BRIDGE_HOST>:8787/api/deauth/event \
  --window-seconds 10 \
  --cooldown-seconds 5
```

Production profile (stricter defaults):

```bash
python deauth_guard.py \
  --profile production \
  --interface wlan0mon \
  --source raspberry-pi-deauth \
  --bridge-url http://<YOUR_WEB_OR_BRIDGE_HOST>:8787/api/deauth/event \
  --window-seconds 10
```

Optional manual overrides:

```bash
python deauth_guard.py \
  --profile production \
  --interface wlan0mon \
  --bssid-filter aa:bb:cc:dd:ee:ff \
  --threshold-deauth 12 \
  --threshold-disassoc 6 \
  --adaptive-multiplier 3.0 \
  --window-seconds 10 \
  --cooldown-seconds 30 \
  --adaptive-thresholds \
  --alert-secret "your-shared-secret"
```

Notes:
- Lab profile defaults: `deauth=2`, `disassoc=1`, `cooldown=5`, adaptive `off`.
- Production profile defaults: `deauth=12`, `disassoc=6`, `cooldown=30`, adaptive `on`.
- The bridge stores masked/hashed MAC metadata (`bssidMasked`, `bssidHash`) instead of raw addresses.

## 4) Install as systemd service

Install lab service:

```bash
./install_service.sh cyberchaukidaar-deauth-guard.service
```

Install production service:

```bash
./install_service.sh cyberchaukidaar-deauth-guard-prod.service
```

## 3) Test endpoints

From Pi:

```bash
curl http://127.0.0.1:8091/health
curl http://127.0.0.1:8091/events
curl -X POST http://127.0.0.1:8091/test-alert
```

From bridge host:

```bash
curl http://127.0.0.1:8787/api/deauth/events
curl -X POST http://127.0.0.1:8787/api/deauth/test
```
