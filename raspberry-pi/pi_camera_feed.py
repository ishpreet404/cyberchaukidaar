#!/usr/bin/env python3
"""
Raspberry Pi camera feed server (no AI).
Use this when detection/alerts run on a laptop and Pi only provides video.
"""

from __future__ import annotations

import argparse
import os
import time
from typing import Optional

import cv2
from flask import Flask, Response, jsonify

PICAMERA2_IMPORT_ERROR = ''

try:
    from picamera2 import Picamera2  # type: ignore
except Exception as exc:
    Picamera2 = None
    PICAMERA2_IMPORT_ERROR = str(exc)


class CameraFeed:
    def __init__(self, source: str, jpeg_quality: int = 80) -> None:
        self.source = source
        self.jpeg_quality = jpeg_quality
        self.last_frame_ts: Optional[float] = None
        self.frames_produced = 0
        self.last_error = ''
        self.backend = 'opencv'

        self.cap = None
        self.picam2 = None

        self._init_camera(source)

    @property
    def camera_open(self) -> bool:
        if self.backend == 'picamera2':
            return self.picam2 is not None
        return self.cap is not None and self.cap.isOpened()

    def _init_camera(self, source: str) -> None:
        src_lower = source.strip().lower()

        # Prefer native Pi camera stack for CSI cameras when available.
        if src_lower in {'picamera2', 'libcamera', 'pi-cam', 'csi', '0'} and Picamera2 is None:
            self.backend = 'picamera2-unavailable'
            self.last_error = (
                'picamera2 module is not available in this Python environment. '
                'If using a venv, recreate it with --system-site-packages, or run with system python3. '
                f'Import error: {PICAMERA2_IMPORT_ERROR or "unknown"}'
            )
            print(f'[pi-feed] camera init failed: {self.last_error}')
            return

        if src_lower in {'picamera2', 'libcamera', 'pi-cam', 'csi', '0'} and Picamera2 is not None:
            try:
                self.picam2 = Picamera2()
                config = self.picam2.create_video_configuration(
                    main={'size': (1280, 720), 'format': 'RGB888'}
                )
                self.picam2.configure(config)
                self.picam2.start()
                self.backend = 'picamera2'
                print('[pi-feed] camera backend: picamera2')
                return
            except Exception as exc:
                self.last_error = f'picamera2 init failed: {exc}'
                self.picam2 = None

        src = int(source) if source.isdigit() else source
        self.cap = cv2.VideoCapture(src)
        self.backend = 'opencv'
        if self.cap.isOpened():
            print('[pi-feed] camera backend: opencv')
        else:
            self.last_error = (
                self.last_error
                or f'failed to open camera source: {source}'
            )
            print(f'[pi-feed] camera open failed: {self.last_error}')

    def read_frame(self):
        if self.backend == 'picamera2' and self.picam2 is not None:
            try:
                rgb_frame = self.picam2.capture_array('main')
                frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
                self.last_frame_ts = time.time()
                self.frames_produced += 1
                return frame
            except Exception as exc:
                self.last_error = f'picamera2 capture failed: {exc}'
                return None

        if self.cap is None:
            return None

        ok, frame = self.cap.read()
        if not ok or frame is None:
            self.last_error = f'opencv capture failed from source: {self.source}'
            return None
        self.last_frame_ts = time.time()
        self.frames_produced += 1
        return frame

    def stream_generator(self):
        while True:
            frame = self.read_frame()
            if frame is None:
                time.sleep(0.15)
                continue

            ok, buf = cv2.imencode(
                '.jpg',
                frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), self.jpeg_quality],
            )
            if not ok:
                continue

            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n'
            )


def create_app(feed: CameraFeed) -> Flask:
    app = Flask(__name__)

    @app.get('/')
    def index():
        return jsonify(
            {
                'ok': feed.camera_open,
                'service': 'pi-camera-feed',
                'cameraOpen': feed.camera_open,
                'cameraBackend': feed.backend,
                'cameraSource': feed.source,
                'picamera2Available': Picamera2 is not None,
                'pythonExecutable': os.environ.get('VIRTUAL_ENV') or 'system-python',
                'streamUrl': '/stream.mjpg',
                'healthUrl': '/health',
                'lastError': feed.last_error or None,
            }
        )

    @app.get('/health')
    def health():
        return jsonify(
            {
                'ok': feed.camera_open,
                'service': 'pi-camera-feed',
                'cameraOpen': feed.camera_open,
                'cameraBackend': feed.backend,
                'cameraSource': feed.source,
                'picamera2Available': Picamera2 is not None,
                'pythonExecutable': os.environ.get('VIRTUAL_ENV') or 'system-python',
                'lastFrameTime': feed.last_frame_ts,
                'framesProduced': feed.frames_produced,
                'lastError': feed.last_error or None,
            }
        )

    @app.get('/stream.mjpg')
    def stream_mjpeg():
        if not feed.camera_open:
            return (
                jsonify(
                    {
                        'ok': False,
                        'error': 'camera-not-open',
                        'cameraSource': feed.source,
                        'cameraBackend': feed.backend,
                        'lastError': feed.last_error or None,
                    }
                ),
                503,
            )
        return Response(
            feed.stream_generator(),
            mimetype='multipart/x-mixed-replace; boundary=frame',
        )

    return app


def parse_args():
    parser = argparse.ArgumentParser(description='Raspberry Pi camera MJPEG feed server')
    parser.add_argument(
        '--camera-source',
        default='0',
        help='Camera index/URL or picamera2/libcamera for CSI camera (default: 0)',
    )
    parser.add_argument('--host', default='0.0.0.0', help='Bind host')
    parser.add_argument('--port', type=int, default=8081, help='Bind port (default: 8081)')
    parser.add_argument('--jpeg-quality', type=int, default=80, help='JPEG quality (default: 80)')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    feed = CameraFeed(args.camera_source, args.jpeg_quality)
    app = create_app(feed)

    print(f"[pi-feed] serving on http://{args.host}:{args.port}/stream.mjpg")
    app.run(host=args.host, port=args.port, debug=False, threaded=True)


if __name__ == '__main__':
    main()
