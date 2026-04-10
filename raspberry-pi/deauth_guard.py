#!/usr/bin/env python3
"""
Cyber Chaukidaar Raspberry Pi Wi-Fi Deauth Guard.
- Sniffs 802.11 management frames for deauth/disassociation bursts
- Scores suspicious activity with a sliding time window
- Posts alerts to the bridge endpoint (/api/deauth/event)
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import signal
import threading
import time
from collections import deque
from dataclasses import dataclass, asdict
from typing import Deque, List, Optional

import requests
from flask import Flask, jsonify
from scapy.all import Dot11, Dot11Deauth, Dot11Disas, sniff


@dataclass
class GuardConfig:
    profile: str
    interface: str
    source: str
    bssid_filter: str
    window_seconds: int
    threshold_deauth: int
    threshold_disassoc: int
    adaptive_thresholds: bool
    adaptive_multiplier: float
    cooldown_seconds: int
    bridge_url: str
    alert_secret: str
    bind_host: str
    bind_port: int


class DeauthGuard:
    def __init__(self, config: GuardConfig) -> None:
        self.config = config
        self._stop = threading.Event()
        self._lock = threading.Lock()

        self._events: List[dict] = []
        self._deauth_times: Deque[float] = deque()
        self._disassoc_times: Deque[float] = deque()
        self._last_alert_at = 0.0
        self._baseline_deauth_rate = 0.0
        self._baseline_disassoc_rate = 0.0

    def start(self) -> None:
        thread = threading.Thread(target=self._sniff_loop, daemon=True)
        thread.start()

    def stop(self) -> None:
        self._stop.set()

    def status(self) -> dict:
        with self._lock:
            event_count = len(self._events)
            last_event = self._events[0] if self._events else None

        return {
            "running": not self._stop.is_set(),
            "profile": self.config.profile,
            "source": self.config.source,
            "interface": self.config.interface,
            "window_seconds": self.config.window_seconds,
            "threshold_deauth": self.config.threshold_deauth,
            "threshold_disassoc": self.config.threshold_disassoc,
            "adaptive_thresholds": self.config.adaptive_thresholds,
            "adaptive_multiplier": self.config.adaptive_multiplier,
            "effective_threshold_deauth": self._effective_threshold(self.config.threshold_deauth, self._baseline_deauth_rate),
            "effective_threshold_disassoc": self._effective_threshold(self.config.threshold_disassoc, self._baseline_disassoc_rate),
            "events_count": event_count,
            "last_event_time": last_event["time"] if last_event else None,
        }

    def recent_events(self, limit: int = 30) -> List[dict]:
        with self._lock:
            return self._events[:limit]

    def create_test_event(self) -> dict:
        event = {
            "id": str(int(time.time() * 1000)),
            "type": "DEAUTH",
            "message": "Manual test deauth alert from Raspberry Pi guard",
            "source": self.config.source,
            "profile": self.config.profile,
            "bssid": self.config.bssid_filter or "AA:BB:CC:DD:EE:FF",
            "channel": "unknown",
            "severity": "high",
            "deauthCount": self.config.threshold_deauth + 4,
            "disassocCount": self.config.threshold_disassoc + 2,
            "configuredThresholdDeauth": self.config.threshold_deauth,
            "configuredThresholdDisassoc": self.config.threshold_disassoc,
            "effectiveThresholdDeauth": self.config.threshold_deauth,
            "effectiveThresholdDisassoc": self.config.threshold_disassoc,
            "adaptiveThresholds": self.config.adaptive_thresholds,
            "adaptiveMultiplier": self.config.adaptive_multiplier,
            "confidence": 0.9,
            "time": dt.datetime.utcnow().isoformat() + "Z",
        }
        self._add_event(event)
        self._post_event_async(event)
        return event

    def _sniff_loop(self) -> None:
        print(f"[deauth-guard] sniffing on interface: {self.config.interface}")

        def handle_packet(packet) -> None:
            if self._stop.is_set():
                return
            self._process_packet(packet)

        while not self._stop.is_set():
            try:
                sniff(
                    iface=self.config.interface,
                    prn=handle_packet,
                    store=False,
                    timeout=2,
                )
            except Exception as exc:
                print(f"[deauth-guard] sniff error: {exc}")
                time.sleep(1)

    def _process_packet(self, packet) -> None:
        if not packet.haslayer(Dot11):
            return

        dot11 = packet.getlayer(Dot11)
        bssid = (getattr(dot11, "addr3", "") or "").lower()
        client_mac = (getattr(dot11, "addr1", "") or "").lower()
        if self.config.bssid_filter and bssid != self.config.bssid_filter:
            return

        now = time.time()
        event_type = None

        if packet.haslayer(Dot11Deauth):
            self._deauth_times.append(now)
            event_type = "deauth"
        elif packet.haslayer(Dot11Disas):
            self._disassoc_times.append(now)
            event_type = "disassoc"

        if event_type is None:
            return

        self._trim_windows(now)

        deauth_count = len(self._deauth_times)
        disassoc_count = len(self._disassoc_times)
        self._update_baselines(deauth_count, disassoc_count)

        threshold_deauth = self._effective_threshold(self.config.threshold_deauth, self._baseline_deauth_rate)
        threshold_disassoc = self._effective_threshold(self.config.threshold_disassoc, self._baseline_disassoc_rate)

        if not self._is_suspicious(deauth_count, disassoc_count, threshold_deauth, threshold_disassoc):
            return

        if (now - self._last_alert_at) < self.config.cooldown_seconds:
            return

        severity = self._severity(deauth_count, disassoc_count)
        confidence = self._confidence(deauth_count, disassoc_count)

        event = {
            "id": str(int(now * 1000)),
            "type": "DEAUTH",
            "message": (
                "Suspicious Wi-Fi management-frame burst detected "
                f"(deauth={deauth_count}, disassoc={disassoc_count})"
            ),
            "source": self.config.source,
            "profile": self.config.profile,
            "bssid": bssid or "unknown",
            "clientMac": client_mac or "unknown",
            "channel": "unknown",
            "severity": severity,
            "deauthCount": deauth_count,
            "disassocCount": disassoc_count,
            "configuredThresholdDeauth": self.config.threshold_deauth,
            "configuredThresholdDisassoc": self.config.threshold_disassoc,
            "confidence": confidence,
            "effectiveThresholdDeauth": threshold_deauth,
            "effectiveThresholdDisassoc": threshold_disassoc,
            "adaptiveThresholds": self.config.adaptive_thresholds,
            "adaptiveMultiplier": self.config.adaptive_multiplier,
            "time": dt.datetime.utcnow().isoformat() + "Z",
        }

        self._add_event(event)
        self._post_event_async(event)
        self._last_alert_at = now

    def _trim_windows(self, now: float) -> None:
        cutoff = now - self.config.window_seconds
        while self._deauth_times and self._deauth_times[0] < cutoff:
            self._deauth_times.popleft()
        while self._disassoc_times and self._disassoc_times[0] < cutoff:
            self._disassoc_times.popleft()

    def _is_suspicious(self, deauth_count: int, disassoc_count: int, threshold_deauth: int, threshold_disassoc: int) -> bool:
        return (
            deauth_count >= threshold_deauth
            or disassoc_count >= threshold_disassoc
        )

    def _update_baselines(self, deauth_count: int, disassoc_count: int) -> None:
        # Exponential moving average to adapt to naturally noisy environments.
        alpha = 0.08
        per_second_deauth = deauth_count / max(1, self.config.window_seconds)
        per_second_disassoc = disassoc_count / max(1, self.config.window_seconds)
        self._baseline_deauth_rate = (1 - alpha) * self._baseline_deauth_rate + alpha * per_second_deauth
        self._baseline_disassoc_rate = (1 - alpha) * self._baseline_disassoc_rate + alpha * per_second_disassoc

    def _effective_threshold(self, static_threshold: int, baseline_rate: float) -> int:
        if not self.config.adaptive_thresholds:
            return static_threshold

        adaptive_count = int(round(baseline_rate * self.config.window_seconds * self.config.adaptive_multiplier))
        return max(static_threshold, adaptive_count)

    def _severity(self, deauth_count: int, disassoc_count: int) -> str:
        high_deauth = self.config.threshold_deauth * 2
        high_disassoc = self.config.threshold_disassoc * 2
        if deauth_count >= high_deauth or disassoc_count >= high_disassoc:
            return "high"
        if deauth_count >= self.config.threshold_deauth or disassoc_count >= self.config.threshold_disassoc:
            return "medium"
        return "low"

    def _confidence(self, deauth_count: int, disassoc_count: int) -> float:
        score = 0.5
        if self.config.threshold_deauth > 0:
            score += min(0.35, (deauth_count / self.config.threshold_deauth) * 0.2)
        if self.config.threshold_disassoc > 0:
            score += min(0.25, (disassoc_count / self.config.threshold_disassoc) * 0.15)
        return round(min(score, 0.99), 4)

    def _add_event(self, event: dict) -> None:
        with self._lock:
            self._events.insert(0, event)
            del self._events[100:]

    def _post_event_async(self, event: dict) -> None:
        thread = threading.Thread(target=self._post_event, args=(event,), daemon=True)
        thread.start()

    def _post_event(self, event: dict) -> None:
        headers = {"Content-Type": "application/json"}
        if self.config.alert_secret:
            headers["x-alert-secret"] = self.config.alert_secret

        try:
            response = requests.post(
                self.config.bridge_url,
                headers=headers,
                data=json.dumps(event),
                timeout=5,
            )
            if not response.ok:
                print(f"[deauth-guard] bridge error {response.status_code}: {response.text[:180]}")
            else:
                print(f"[deauth-guard] alert sent: {event['id']}")
        except Exception as exc:
            print(f"[deauth-guard] failed to send alert: {exc}")


def parse_args() -> GuardConfig:
    parser = argparse.ArgumentParser(description="Wi-Fi deauth/disassoc detector for Raspberry Pi")
    parser.add_argument("--profile", choices=["lab", "production"], default="lab", help="Preset profile: lab (easy trigger) or production (stricter)")
    parser.add_argument("--interface", default="wlan0mon", help="Monitor mode interface (default: wlan0mon)")
    parser.add_argument("--source", default="raspberry-pi-deauth", help="Sensor source identifier")
    parser.add_argument("--bssid-filter", default="", help="Optional AP BSSID filter (aa:bb:cc:dd:ee:ff)")
    parser.add_argument("--window-seconds", type=int, default=10, help="Sliding window size in seconds")
    parser.add_argument("--threshold-deauth", type=int, default=None, help="Deauth threshold inside window")
    parser.add_argument("--threshold-disassoc", type=int, default=None, help="Disassoc threshold inside window")
    adaptive_group = parser.add_mutually_exclusive_group()
    adaptive_group.add_argument("--adaptive-thresholds", action="store_true", dest="adaptive_thresholds", default=None, help="Enable adaptive thresholds based on baseline frame rates")
    adaptive_group.add_argument("--no-adaptive-thresholds", action="store_false", dest="adaptive_thresholds", help="Disable adaptive thresholds")
    parser.add_argument("--adaptive-multiplier", type=float, default=3.0, help="Adaptive threshold multiplier over baseline")
    parser.add_argument("--cooldown-seconds", type=int, default=None, help="Minimum seconds between alerts")
    parser.add_argument("--bridge-url", default="http://localhost:8787/api/deauth/event", help="Bridge endpoint URL")
    parser.add_argument("--alert-secret", default="", help="Optional secret for x-alert-secret")
    parser.add_argument("--bind-host", default="0.0.0.0", help="Host for local status API")
    parser.add_argument("--bind-port", type=int, default=8091, help="Port for local status API")

    args = parser.parse_args()

    if args.profile == "production":
        threshold_deauth = args.threshold_deauth if args.threshold_deauth is not None else 12
        threshold_disassoc = args.threshold_disassoc if args.threshold_disassoc is not None else 6
        cooldown_seconds = args.cooldown_seconds if args.cooldown_seconds is not None else 30
        adaptive_thresholds = args.adaptive_thresholds if args.adaptive_thresholds is not None else True
    else:
        threshold_deauth = args.threshold_deauth if args.threshold_deauth is not None else 2
        threshold_disassoc = args.threshold_disassoc if args.threshold_disassoc is not None else 1
        cooldown_seconds = args.cooldown_seconds if args.cooldown_seconds is not None else 5
        adaptive_thresholds = args.adaptive_thresholds if args.adaptive_thresholds is not None else False

    return GuardConfig(
        profile=args.profile,
        interface=args.interface,
        source=args.source,
        bssid_filter=(args.bssid_filter or "").strip().lower(),
        window_seconds=args.window_seconds,
        threshold_deauth=threshold_deauth,
        threshold_disassoc=threshold_disassoc,
        adaptive_thresholds=adaptive_thresholds,
        adaptive_multiplier=args.adaptive_multiplier,
        cooldown_seconds=cooldown_seconds,
        bridge_url=args.bridge_url,
        alert_secret=args.alert_secret,
        bind_host=args.bind_host,
        bind_port=args.bind_port,
    )


def create_app(guard: DeauthGuard) -> Flask:
    app = Flask(__name__)

    @app.get('/health')
    def health():
        return jsonify(guard.status())

    @app.get('/events')
    def events():
        return jsonify({"events": guard.recent_events(40)})

    @app.post('/test-alert')
    def test_alert():
        event = guard.create_test_event()
        return jsonify({"ok": True, "event": event})

    return app


def main() -> None:
    config = parse_args()
    guard = DeauthGuard(config)
    app = create_app(guard)

    def shutdown_handler(*_args):
        print("\n[deauth-guard] shutting down...")
        guard.stop()

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    print('[deauth-guard] starting with config:')
    print(json.dumps(asdict(config), indent=2))
    print('[deauth-guard] note: interface must be in monitor mode for reliable detection')

    guard.start()
    app.run(host=config.bind_host, port=config.bind_port, debug=False, threaded=True)


if __name__ == '__main__':
    main()
