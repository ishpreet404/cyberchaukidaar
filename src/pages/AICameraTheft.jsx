import React, { useEffect, useMemo, useState } from 'react';
import { Camera, ShieldAlert, Activity, Link as LinkIcon } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const STORAGE_STREAM_URL = 'aiTheftStreamUrl';
const STORAGE_ALERT_BASE_URL = 'aiTheftAlertBaseUrl';
const PI_DEFAULT_STREAM_URL = 'http://raspberrypi.local:8080/stream.mjpg';
const DEFAULT_ALERT_BASE_URL = 'http://localhost:8787';
const LOCAL_YOLO_OVERLAY_STREAM_URL = 'http://127.0.0.1:8080/stream.mjpg';

function normalizeBaseUrl(raw) {
  const value = (raw || '').trim();
  if (!value) return DEFAULT_ALERT_BASE_URL;
  try {
    const u = new URL(value);
    return `${u.origin}`;
  } catch {
    return value.replace(/\/+$/, '');
  }
}

function withPath(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

function inferDetectorEventsUrl(streamValue) {
  const value = (streamValue || '').trim();
  if (!value) return '';
  try {
    const u = new URL(value);
    if (u.pathname.endsWith('/stream.mjpg')) {
      return `${u.origin}/events`;
    }
  } catch {
    return '';
  }
  return '';
}

function eventTypeStyle(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'THEFT') return 'text-terminal-red border-terminal-red';
  if (t === 'TEST') return 'text-terminal-amber border-terminal-amber';
  return 'text-terminal-green border-terminal-green';
}

const AICameraTheft = () => {
  const [streamUrl, setStreamUrl] = useState('');
  const [alertBaseUrl, setAlertBaseUrl] = useState(DEFAULT_ALERT_BASE_URL);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastFrameAt, setLastFrameAt] = useState(null);
  const [events, setEvents] = useState([]);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [statusText, setStatusText] = useState('IDLE');
  const [liveAlert, setLiveAlert] = useState(null);

  const isVideoStream = useMemo(() => {
    const lower = streamUrl.toLowerCase();
    return lower.endsWith('.m3u8') || lower.endsWith('.mp4') || lower.endsWith('.webm');
  }, [streamUrl]);

  const eventsUrl = useMemo(() => withPath(normalizeBaseUrl(alertBaseUrl), '/api/ai-theft/events'), [alertBaseUrl]);
  const streamEventsUrl = useMemo(() => withPath(normalizeBaseUrl(alertBaseUrl), '/api/ai-theft/stream'), [alertBaseUrl]);
  const testUrl = useMemo(() => withPath(normalizeBaseUrl(alertBaseUrl), '/api/ai-theft/test'), [alertBaseUrl]);

  const seenIdsRef = React.useRef(new Set());
  const pollRef = React.useRef(null);
  const sseRef = React.useRef(null);

  useEffect(() => {
    const savedStream = localStorage.getItem(STORAGE_STREAM_URL) || '';
    const savedAlertBase = localStorage.getItem(STORAGE_ALERT_BASE_URL) || DEFAULT_ALERT_BASE_URL;
    setStreamUrl(savedStream);
    setAlertBaseUrl(savedAlertBase);
  }, []);

  useEffect(() => {
    if (!liveAlert) return;
    const t = setTimeout(() => {
      setLiveAlert(null);
    }, 7000);
    return () => clearTimeout(t);
  }, [liveAlert]);

  useEffect(() => {
    if (!isMonitoring) return;
    const detectorEventsUrl = inferDetectorEventsUrl(streamUrl);

    const upsertEvent = (evt, source = 'bridge') => {
      const id = evt.id || evt.timestamp || evt.time || JSON.stringify(evt);
      if (seenIdsRef.current.has(id)) return;
      seenIdsRef.current.add(id);

      const normalized = {
        id,
        type: evt.type || 'THEFT',
        message: evt.message || 'Suspicious movement detected',
        time: evt.time ? new Date(evt.time).toLocaleString() : new Date().toLocaleString(),
        cameraId: evt.cameraId || 'pi-cam-1',
        confidence: typeof evt.confidence === 'number' ? evt.confidence : null,
        source,
      };

      setEvents((prev) => [normalized, ...prev].slice(0, 30));
      setLiveAlert(normalized);

      const typeUpper = String(normalized.type || '').toUpperCase();
      const shouldNotifyBrowser = typeUpper === 'THEFT' || typeUpper === 'TEST';
      if (shouldNotifyBrowser && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Cyber Chaukidaar Theft Alert', {
          body: `${normalized.type}: ${normalized.message}`,
        });
      }

      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch {
        // Ignore audio errors
      }
    };

    const poll = async () => {
      let bridgeOk = false;
      let detectorOk = !detectorEventsUrl;

      try {
        const response = await fetch(eventsUrl, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setTelegramEnabled(Boolean(data.telegramEnabled));
          const list = Array.isArray(data.events) ? data.events : [];
          list.slice(0, 20).reverse().forEach((evt) => upsertEvent(evt, 'bridge-poll'));
          bridgeOk = true;
        }
      } catch {
        bridgeOk = false;
      }

      if (detectorEventsUrl) {
        try {
          const response = await fetch(detectorEventsUrl, { cache: 'no-store' });
          if (response.ok) {
            const data = await response.json();
            const list = Array.isArray(data.events) ? data.events : [];
            list.slice(0, 20).reverse().forEach((evt) => upsertEvent(evt, 'detector-poll'));
            detectorOk = true;
          }
        } catch {
          detectorOk = false;
        }
      }

      if (bridgeOk) {
        setStatusText('MONITORING (LIVE BRIDGE)');
      } else if (detectorOk) {
        setStatusText('MONITORING (DETECTOR ONLY)');
      } else {
        setStatusText('MONITORING (OFFLINE)');
      }
    };

    if (typeof EventSource !== 'undefined') {
      try {
        sseRef.current = new EventSource(streamEventsUrl);
        const handleSseEvent = (e, sourceTag) => {
          try {
            const evt = JSON.parse(e.data);
            upsertEvent(evt, sourceTag);
            setStatusText('MONITORING (LIVE)');
          } catch {
            // Ignore malformed packets
          }
        };

        sseRef.current.onmessage = (e) => handleSseEvent(e, 'bridge-sse');
        ['theft', 'detection', 'test', 'ai-theft'].forEach((eventType) => {
          sseRef.current.addEventListener(eventType, (e) => handleSseEvent(e, `bridge-sse:${eventType}`));
        });
        sseRef.current.onerror = () => {
          setStatusText('MONITORING (RETRYING)');
        };
      } catch {
        setStatusText('MONITORING (POLL)');
      }
    }

    poll();
    pollRef.current = setInterval(poll, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      if (sseRef.current) sseRef.current.close();
      sseRef.current = null;
      setStatusText('IDLE');
    };
  }, [eventsUrl, isMonitoring, streamEventsUrl, streamUrl]);

  useEffect(() => {
    if (!lastFrameAt) return;
    const interval = setInterval(() => {
      // Triggers re-render for status display
      setLastFrameAt((prev) => prev);
    }, 3000);
    return () => clearInterval(interval);
  }, [lastFrameAt]);

  const streamStatus = (() => {
    if (!streamUrl) return 'NO STREAM URL';
    if (!lastFrameAt) return 'CONNECTING...';
    const age = Date.now() - lastFrameAt.getTime();
    return age < 8000 ? 'LIVE' : 'STALE';
  })();

  const saveSettings = () => {
    localStorage.setItem(STORAGE_STREAM_URL, streamUrl);
    localStorage.setItem(STORAGE_ALERT_BASE_URL, normalizeBaseUrl(alertBaseUrl));
  };

  const sendTestAlert = async () => {
    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Test alert failed');
      setStatusText('TEST ALERT SENT');
    } catch {
      setStatusText('TEST ALERT FAILED');
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="w-8 h-8 text-terminal-green" />
        <div>
          <h1 className="text-2xl font-bold text-terminal-green mb-1">AI THEFT DETECTION</h1>
          <p className="text-terminal-muted text-sm">Live stream from Raspberry Pi with AI alerts</p>
        </div>
      </div>

      {liveAlert && (
        <Card title="▸ LIVE WEBSITE ALERT">
          <div className="space-y-2 text-sm">
            <div className={`inline-block px-2 py-1 border ${eventTypeStyle(liveAlert.type)}`}>
              [{liveAlert.type}] {liveAlert.message}
            </div>
            <div className="text-xs text-terminal-muted">
              {liveAlert.time} | {liveAlert.cameraId}
              {liveAlert.confidence !== null ? ` | ${(liveAlert.confidence * 100).toFixed(1)}%` : ''}
            </div>
          </div>
        </Card>
      )}

      <Card title="▸ STREAM SETTINGS">
        <div className="space-y-3 text-sm text-terminal-muted">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-terminal-green" />
            <span>STREAM URL (MJPEG/MP4/HLS)</span>
          </div>
          <input
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            placeholder={PI_DEFAULT_STREAM_URL}
            className="terminal-input w-full"
          />
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-terminal-amber" />
            <span>ALERTS ENDPOINT (optional)</span>
          </div>
          <input
            value={alertBaseUrl}
            onChange={(e) => setAlertBaseUrl(e.target.value)}
            placeholder={DEFAULT_ALERT_BASE_URL}
            className="terminal-input w-full"
          />
          <div className="flex flex-col md:flex-row gap-2">
            <Button className="w-full md:w-auto" onClick={saveSettings}>SAVE SETTINGS</Button>
            <Button
              className="w-full md:w-auto"
              onClick={() => {
                setStreamUrl(PI_DEFAULT_STREAM_URL);
                setAlertBaseUrl(DEFAULT_ALERT_BASE_URL);
              }}
            >
              USE PI DEFAULTS
            </Button>
            <Button
              className="w-full md:w-auto"
              onClick={() => {
                setStreamUrl(LOCAL_YOLO_OVERLAY_STREAM_URL);
              }}
            >
              USE YOLO OVERLAY STREAM
            </Button>
            <Button
              className="w-full md:w-auto"
              variant={isMonitoring ? 'warning' : 'default'}
              onClick={async () => {
                await requestNotificationPermission();
                setIsMonitoring((prev) => !prev);
              }}
            >
              {isMonitoring ? 'STOP MONITORING' : 'START MONITORING'}
            </Button>
            <Button className="w-full md:w-auto" onClick={requestNotificationPermission}>
              ENABLE BROWSER ALERTS
            </Button>
            <Button className="w-full md:w-auto" variant="warning" onClick={sendTestAlert}>
              SEND TEST ALERT
            </Button>
          </div>
          <div className="text-xs text-terminal-muted">
            BRIDGE STATUS: <span className="text-terminal-green">{statusText}</span> | TELEGRAM: <span className={telegramEnabled ? 'text-terminal-green' : 'text-terminal-amber'}>{telegramEnabled ? 'ENABLED' : 'DISABLED'}</span>
          </div>
          <div className="text-xs text-terminal-muted">
            DETECTION LOGS: <span className="text-terminal-green">{events.length}</span> EVENTS
          </div>
          <div className="text-xs text-terminal-muted">
            Raspberry Pi should POST alerts to <span className="text-terminal-green">{withPath(normalizeBaseUrl(alertBaseUrl), '/api/ai-theft/event')}</span>
          </div>
          <div className="text-xs text-terminal-muted">
            Recommended Pi stream URL: <span className="text-terminal-green">{PI_DEFAULT_STREAM_URL}</span>
          </div>
          <div className="text-xs text-terminal-muted">
            For YOLO bounding-box overlay, use detector output stream: <span className="text-terminal-green">{LOCAL_YOLO_OVERLAY_STREAM_URL}</span>
          </div>
        </div>
      </Card>

      <Card title="▸ LIVE CAMERA FEED">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-terminal-muted">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-terminal-green" />
              <span>STATUS:</span>
              <span className={streamStatus === 'LIVE' ? 'text-terminal-green' : 'text-terminal-amber'}>
                {streamStatus}
              </span>
            </div>
            {lastFrameAt && (
              <div>LAST FRAME: {lastFrameAt.toLocaleTimeString()}</div>
            )}
          </div>

          <div className="border border-terminal-green p-2">
            {!streamUrl && (
              <div className="text-terminal-muted text-sm">Add a stream URL to begin.</div>
            )}
            {streamUrl && isVideoStream && (
              <video
                src={streamUrl}
                controls
                autoPlay
                muted
                playsInline
                className="w-full"
                onCanPlay={() => setLastFrameAt(new Date())}
                onTimeUpdate={() => setLastFrameAt(new Date())}
              />
            )}
            {streamUrl && !isVideoStream && (
              <img
                src={streamUrl}
                alt="Live stream"
                className="w-full"
                onLoad={() => setLastFrameAt(new Date())}
              />
            )}
          </div>
        </div>
      </Card>

      <Card title="▸ DETECTION LOG">
        <div className="space-y-2 text-sm font-mono">
          {events.length === 0 && (
            <div className="text-terminal-muted">No alerts yet.</div>
          )}
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`flex items-center justify-between p-2 border-l-2 hover:bg-terminal-bg transition-all ${eventTypeStyle(evt.type)}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="font-bold">[{evt.type}]</span>
                <span className="text-terminal-muted flex-1 truncate">{evt.message}</span>
              </div>
              <div className="text-terminal-muted text-xs text-right min-w-[180px]">
                <div>{evt.time}</div>
                <div>
                  {evt.cameraId}
                  {evt.confidence !== null ? ` | ${(evt.confidence * 100).toFixed(1)}%` : ''}
                  {evt.source ? ` | ${evt.source}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AICameraTheft;
