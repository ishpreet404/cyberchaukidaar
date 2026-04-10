#!/usr/bin/env python3
"""
Cyber Chaukidaar Raspberry Pi AI theft detector.
- Runs YOLOv8n person detection from camera stream
- Serves MJPEG stream for website UI
- Sends theft alerts to the alert bridge (/api/ai-theft/event)
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import signal
import threading
import time
from dataclasses import dataclass, asdict
from typing import List, Optional

import cv2
import requests
from flask import Flask, Response, jsonify
from ultralytics import YOLO


@dataclass
class DetectorConfig:
    camera_source: str
    camera_id: str
    model_path: str
    confidence: float
    detection_log_interval_seconds: int
    min_streak_frames: int
    cooldown_seconds: int
    bridge_url: str
    alert_secret: str
    stream_host: str
    stream_port: int
    jpeg_quality: int


class TheftDetector:
    def __init__(self, config: DetectorConfig) -> None:
        self.config = config
        self.model = YOLO(config.model_path)

        self._stop = threading.Event()
        self._lock = threading.Lock()

        self._frame_jpeg: Optional[bytes] = None
        self._last_frame_ts: Optional[float] = None
        self._events: List[dict] = []

        self._detection_streak = 0
        self._last_detection_log_ts = 0.0
        self._last_alert_ts = 0.0

        source: int | str
        source = int(config.camera_source) if config.camera_source.isdigit() else config.camera_source
        self.cap = cv2.VideoCapture(source)

    def start(self) -> None:
        t = threading.Thread(target=self._loop, daemon=True)
        t.start()

    def stop(self) -> None:
        self._stop.set()
        try:
            self.cap.release()
        except Exception:
            pass

    def status(self) -> dict:
        with self._lock:
            last = self._last_frame_ts
            events_count = len(self._events)
        return {
            "running": not self._stop.is_set(),
            "camera_id": self.config.camera_id,
            "last_frame_time": dt.datetime.fromtimestamp(last).isoformat() if last else None,
            "events_count": events_count,
            "config": {
                "camera_source": self.config.camera_source,
                "model_path": self.config.model_path,
                "confidence": self.config.confidence,
                "detection_log_interval_seconds": self.config.detection_log_interval_seconds,
                "min_streak_frames": self.config.min_streak_frames,
                "cooldown_seconds": self.config.cooldown_seconds,
                "bridge_url": self.config.bridge_url,
                "stream_host": self.config.stream_host,
                "stream_port": self.config.stream_port,
            },
        }

    def latest_event(self) -> Optional[dict]:
        with self._lock:
            return self._events[0] if self._events else None

    def recent_events(self, limit: int = 20) -> List[dict]:
        with self._lock:
            return self._events[:limit]

    def stream_generator(self):
        while not self._stop.is_set():
            with self._lock:
                payload = self._frame_jpeg
            if payload is None:
                time.sleep(0.05)
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + payload + b"\r\n"
            )
            time.sleep(0.03)

    def create_test_event(self) -> dict:
        event = {
            "id": str(int(time.time() * 1000)),
            "type": "TEST",
            "message": "Manual test alert from Raspberry Pi detector",
            "cameraId": self.config.camera_id,
            "confidence": 0.95,
            "time": dt.datetime.utcnow().isoformat() + "Z",
            "snapshotUrl": "",
        }
        self._add_event(event)
        self._post_event_async(event)
        return event

    def _loop(self) -> None:
        while not self._stop.is_set():
            ok, frame = self.cap.read()
            if not ok or frame is None:
                time.sleep(0.2)
                continue

            try:
                # class 0 = person in COCO
                result = self.model.predict(
                    source=frame,
                    conf=self.config.confidence,
                    classes=[0],
                    verbose=False,
                )[0]

                boxes = result.boxes
                person_count = int(len(boxes)) if boxes is not None else 0
                max_conf = 0.0
                if boxes is not None and getattr(boxes, "conf", None) is not None and len(boxes.conf) > 0:
                    max_conf = float(boxes.conf.max().item())

                if person_count > 0:
                    self._detection_streak += 1
                else:
                    self._detection_streak = 0

                now = time.time()
                if (
                    person_count > 0
                    and (now - self._last_detection_log_ts) >= self.config.detection_log_interval_seconds
                ):
                    detection_event = {
                        "id": str(int(now * 1000)),
                        "type": "DETECTION",
                        "message": f"Person detected (count={person_count})",
                        "cameraId": self.config.camera_id,
                        "confidence": round(max_conf, 4),
                        "time": dt.datetime.utcnow().isoformat() + "Z",
                        "snapshotUrl": "",
                    }
                    self._add_event(detection_event)
                    self._post_event_async(detection_event)
                    self._last_detection_log_ts = now

                if (
                    self._detection_streak >= self.config.min_streak_frames
                    and (now - self._last_alert_ts) >= self.config.cooldown_seconds
                ):
                    event = {
                        "id": str(int(now * 1000)),
                        "type": "THEFT",
                        "message": f"Person detected in restricted zone (count={person_count})",
                        "cameraId": self.config.camera_id,
                        "confidence": round(max_conf, 4),
                        "time": dt.datetime.utcnow().isoformat() + "Z",
                        "snapshotUrl": "",
                    }
                    self._add_event(event)
                    self._post_event_async(event)
                    self._last_alert_ts = now
                    self._detection_streak = 0

                annotated = result.plot()
                self._overlay_status(annotated, person_count)
                self._update_jpeg(annotated)
            except Exception as exc:
                print(f"[detector] inference error: {exc}")
                self._update_jpeg(frame)

    def _overlay_status(self, frame, person_count: int) -> None:
        status = f"Cyber Chaukidaar | Camera: {self.config.camera_id} | Persons: {person_count}"
        cv2.rectangle(frame, (8, 8), (min(980, frame.shape[1] - 8), 44), (0, 0, 0), -1)
        cv2.putText(
            frame,
            status,
            (14, 34),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (58, 155, 58),
            2,
            cv2.LINE_AA,
        )

    def _update_jpeg(self, frame) -> None:
        ok, buf = cv2.imencode(
            ".jpg",
            frame,
            [int(cv2.IMWRITE_JPEG_QUALITY), self.config.jpeg_quality],
        )
        if not ok:
            return
        with self._lock:
            self._frame_jpeg = buf.tobytes()
            self._last_frame_ts = time.time()

    def _add_event(self, event: dict) -> None:
        with self._lock:
            self._events.insert(0, event)
            del self._events[50:]

    def _post_event_async(self, event: dict) -> None:
        thread = threading.Thread(target=self._post_event, args=(event,), daemon=True)
        thread.start()

    def _post_event(self, event: dict) -> None:
        headers = {"Content-Type": "application/json"}
        if self.config.alert_secret:
            headers["x-alert-secret"] = self.config.alert_secret

        try:
            res = requests.post(
                self.config.bridge_url,
                headers=headers,
                data=json.dumps(event),
                timeout=5,
            )
            if not res.ok:
                print(f"[detector] bridge error {res.status_code}: {res.text[:180]}")
            else:
                print(f"[detector] alert sent: {event['id']}")
        except Exception as exc:
            print(f"[detector] failed to send alert: {exc}")


def parse_args() -> DetectorConfig:
    parser = argparse.ArgumentParser(description="YOLOv8n theft detector for Raspberry Pi")
    parser.add_argument("--camera-source", default="0", help="Camera index or URL (default: 0)")
    parser.add_argument("--camera-id", default="pi-cam-1", help="Camera identifier")
    parser.add_argument("--model", default="yolov8n.pt", help="YOLO model path")
    parser.add_argument("--confidence", type=float, default=0.45, help="Detection confidence threshold")
    parser.add_argument("--detection-log-interval-seconds", type=int, default=3, help="Seconds between DETECTION log events")
    parser.add_argument("--min-streak-frames", type=int, default=10, help="Frames with person before alert")
    parser.add_argument("--cooldown-seconds", type=int, default=20, help="Alert cooldown period")
    parser.add_argument("--bridge-url", default="http://localhost:8787/api/ai-theft/event", help="Alert bridge endpoint URL")
    parser.add_argument("--alert-secret", default="", help="Optional secret for x-alert-secret")
    parser.add_argument("--stream-host", default="0.0.0.0", help="Host for MJPEG server")
    parser.add_argument("--stream-port", type=int, default=8080, help="Port for MJPEG server")
    parser.add_argument("--jpeg-quality", type=int, default=80, help="JPEG quality for stream")

    args = parser.parse_args()
    return DetectorConfig(
        camera_source=str(args.camera_source),
        camera_id=args.camera_id,
        model_path=args.model,
        confidence=args.confidence,
        detection_log_interval_seconds=args.detection_log_interval_seconds,
        min_streak_frames=args.min_streak_frames,
        cooldown_seconds=args.cooldown_seconds,
        bridge_url=args.bridge_url,
        alert_secret=args.alert_secret,
        stream_host=args.stream_host,
        stream_port=args.stream_port,
        jpeg_quality=args.jpeg_quality,
    )


def create_app(detector: TheftDetector) -> Flask:
    app = Flask(__name__)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, x-alert-secret"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return response

    @app.get('/health')
    def health():
        return jsonify(detector.status())

    @app.get('/events')
    def events():
        return jsonify({"events": detector.recent_events(30)})

    @app.get('/latest')
    def latest():
        return jsonify({"event": detector.latest_event()})

    @app.post('/test-alert')
    def test_alert():
        evt = detector.create_test_event()
        return jsonify({"ok": True, "event": evt})

    @app.get('/stream.mjpg')
    def stream_mjpeg():
        return Response(
            detector.stream_generator(),
            mimetype='multipart/x-mixed-replace; boundary=frame',
        )

    return app


def main() -> None:
    config = parse_args()
    detector = TheftDetector(config)
    app = create_app(detector)

    def shutdown_handler(*_args):
        print('\n[detector] shutting down...')
        detector.stop()

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    print('[detector] starting with config:')
    print(json.dumps(asdict(config), indent=2))
    print(f"[detector] stream URL: http://{config.stream_host}:{config.stream_port}/stream.mjpg")
    print(f"[detector] events URL: http://{config.stream_host}:{config.stream_port}/events")

    detector.start()
    app.run(host=config.stream_host, port=config.stream_port, debug=False, threaded=True)


if __name__ == '__main__':
    main()
