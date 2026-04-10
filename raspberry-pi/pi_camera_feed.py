#!/usr/bin/env python3
"""
Raspberry Pi camera feed server (no AI).
Use this when detection/alerts run on a laptop and Pi only provides video.
"""

from __future__ import annotations

import argparse
import time
from typing import Optional

import cv2
from flask import Flask, Response, jsonify


class CameraFeed:
    def __init__(self, source: str, jpeg_quality: int = 80) -> None:
        src = int(source) if source.isdigit() else source
        self.cap = cv2.VideoCapture(src)
        self.jpeg_quality = jpeg_quality
        self.last_frame_ts: Optional[float] = None

    def read_frame(self):
        ok, frame = self.cap.read()
        if not ok or frame is None:
            return None
        self.last_frame_ts = time.time()
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

    @app.get('/health')
    def health():
        return jsonify(
            {
                'ok': True,
                'service': 'pi-camera-feed',
                'lastFrameTime': feed.last_frame_ts,
            }
        )

    @app.get('/stream.mjpg')
    def stream_mjpeg():
        return Response(
            feed.stream_generator(),
            mimetype='multipart/x-mixed-replace; boundary=frame',
        )

    return app


def parse_args():
    parser = argparse.ArgumentParser(description='Raspberry Pi camera MJPEG feed server')
    parser.add_argument('--camera-source', default='0', help='Camera index or URL (default: 0)')
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
