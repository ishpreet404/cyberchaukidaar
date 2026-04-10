# Raspberry Pi YOLOv8n Theft Detection

This folder provides the Pi-side runtime for Cyber Chaukidaar AI Theft Detection.

It does three jobs:
1. Runs YOLOv8n person detection from a Pi camera.
2. Serves an MJPEG stream for the website (`/stream.mjpg`).
3. Sends theft alerts to the web alert bridge (`/api/ai-theft/event`) which then powers website alerts and Telegram alerts.

## 1) Install on Raspberry Pi

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip

cd ~/hacktivate/raspberry-pi
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Notes:
- `requirements.txt` is intentionally lightweight for feed-only mode.
- Install `requirements-detector.txt` only on machines running YOLO detection.
- If OpenCV camera read fails, verify camera support (`libcamera-hello`).

## 2) Start detector on Pi

```bash
source .venv/bin/activate
pip install -r requirements-detector.txt
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

## 7) Laptop-first mode (Pi streams, laptop does AI + alerts)

Use this mode when you want everything except raw camera capture to run on your laptop.

### 7.1 Start Pi camera stream only

On Raspberry Pi:

```bash
cd ~/cyberchaukidaar/raspberry-pi
source .venv/bin/activate
python pi_camera_feed.py --camera-source 0 --host 0.0.0.0 --port 8081
```

Pi stream URL:

```text
http://<PI_IP>:8081/stream.mjpg
```

### 7.2 Run bridge + website on laptop

On laptop (Windows PowerShell):

```powershell
cd D:\hacktivate
npm install
npm run ai-alerts
```

Open second terminal:

```powershell
cd D:\hacktivate
npm run dev
```

Your laptop bridge host on current Wi-Fi is:

```text
10.13.110.236
```

### 7.3 Run YOLO detector on laptop using Pi stream as input

On laptop (Windows PowerShell):

```powershell
cd D:\hacktivate
python -m venv .venv
.\.venv\Scripts\activate
pip install -r raspberry-pi/requirements-detector.txt
python raspberry-pi/yolov8n_theft_detector.py --camera-source http://<PI_IP>:8081/stream.mjpg --camera-id pi-cam-1 --bridge-url http://127.0.0.1:8787/api/ai-theft/event --stream-host 0.0.0.0 --stream-port 8080
```

### 7.4 Website AI Theft page values

- Stream URL: `http://127.0.0.1:8080/stream.mjpg`
- Alert Bridge Base URL: `http://127.0.0.1:8787`

This means:
- Pi only sends video frames.
- Laptop runs YOLOv8n, event generation, bridge, Telegram alerts, and web dashboard.

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
