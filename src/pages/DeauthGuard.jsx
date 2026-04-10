import React, { useEffect, useMemo, useState } from 'react';
import { RadioTower, ShieldAlert, Wifi, Activity } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const STORAGE_DEAUTH_BASE_URL = 'deauthAlertBaseUrl';
const DEFAULT_ALERT_BASE_URL = 'http://localhost:8787';

function normalizeBaseUrl(raw) {
  const value = (raw || '').trim();
  if (!value) return DEFAULT_ALERT_BASE_URL;
  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch {
    return value.replace(/\/+$/, '');
  }
}

function withPath(base, path) {
  return `${base.replace(/\/+$/, '')}${path}`;
}

const DeauthGuard = () => {
  const [alertBaseUrl, setAlertBaseUrl] = useState(DEFAULT_ALERT_BASE_URL);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [statusText, setStatusText] = useState('IDLE');
  const [events, setEvents] = useState([]);
  const [sensorProfile, setSensorProfile] = useState('unknown');
  const [sensorThresholds, setSensorThresholds] = useState('n/a');
  const [sensorAdaptive, setSensorAdaptive] = useState('n/a');

  const eventsUrl = useMemo(
    () => withPath(normalizeBaseUrl(alertBaseUrl), '/api/deauth/events'),
    [alertBaseUrl]
  );
  const streamUrl = useMemo(
    () => withPath(normalizeBaseUrl(alertBaseUrl), '/api/deauth/stream'),
    [alertBaseUrl]
  );
  const testUrl = useMemo(
    () => withPath(normalizeBaseUrl(alertBaseUrl), '/api/deauth/test'),
    [alertBaseUrl]
  );
  const statusUrl = useMemo(
    () => withPath(normalizeBaseUrl(alertBaseUrl), '/api/deauth/status'),
    [alertBaseUrl]
  );

  const seenIdsRef = React.useRef(new Set());
  const pollRef = React.useRef(null);
  const sseRef = React.useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_DEAUTH_BASE_URL) || DEFAULT_ALERT_BASE_URL;
    setAlertBaseUrl(saved);
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;

    const upsertEvent = (evt) => {
      const id = evt.id || evt.time || JSON.stringify(evt);
      if (seenIdsRef.current.has(id)) return;
      seenIdsRef.current.add(id);

      const normalized = {
        id,
        type: evt.type || 'DEAUTH',
        message: evt.message || 'Potential deauth activity detected',
        source: evt.source || 'raspberry-pi-deauth',
        severity: evt.severity || 'medium',
        bssidMasked: evt.bssidMasked || 'unknown',
        bssidHash: evt.bssidHash || '',
        clientMacMasked: evt.clientMacMasked || 'unknown',
        deauthCount: Number(evt.deauthCount) || 0,
        disassocCount: Number(evt.disassocCount) || 0,
        effectiveThresholdDeauth: Number(evt.effectiveThresholdDeauth) || 0,
        effectiveThresholdDisassoc: Number(evt.effectiveThresholdDisassoc) || 0,
        confidence: typeof evt.confidence === 'number' ? evt.confidence : null,
        time: evt.time ? new Date(evt.time).toLocaleString() : new Date().toLocaleString(),
      };

      setEvents((prev) => [normalized, ...prev].slice(0, 40));

      if (Notification.permission === 'granted') {
        new Notification('Cyber Chaukidaar Deauth Alert', {
          body: `${normalized.severity.toUpperCase()}: ${normalized.message}`,
        });
      }
    };

    const poll = async () => {
      try {
        const [eventsResponse, statusResponse] = await Promise.all([
          fetch(eventsUrl, { cache: 'no-store' }),
          fetch(statusUrl, { cache: 'no-store' }),
        ]);
        if (!eventsResponse.ok || !statusResponse.ok) return;

        const data = await eventsResponse.json();
        const status = await statusResponse.json();
        const list = Array.isArray(data.events) ? data.events : [];
        list.slice(0, 20).reverse().forEach(upsertEvent);
        setSensorProfile(status.profile || 'unknown');
        setSensorThresholds(
          `${status.configuredThresholdDeauth ?? 'n/a'}/${status.configuredThresholdDisassoc ?? 'n/a'} -> ${status.effectiveThresholdDeauth ?? 'n/a'}/${status.effectiveThresholdDisassoc ?? 'n/a'}`
        );
        setSensorAdaptive(status.adaptiveThresholds === null ? 'n/a' : status.adaptiveThresholds ? 'ON' : 'OFF');
        setStatusText('MONITORING (POLL)');
      } catch {
        setStatusText('MONITORING (OFFLINE)');
      }
    };

    if (typeof EventSource !== 'undefined') {
      try {
        sseRef.current = new EventSource(streamUrl);
        sseRef.current.onmessage = () => {};
        sseRef.current.addEventListener('deauth', (event) => {
          try {
            const payload = JSON.parse(event.data);
            upsertEvent(payload);
            setStatusText('MONITORING (LIVE)');
          } catch {
            // Ignore malformed event payload
          }
        });
        sseRef.current.onerror = () => setStatusText('MONITORING (RETRYING)');
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
  }, [eventsUrl, isMonitoring, statusUrl, streamUrl]);

  const saveSettings = () => {
    localStorage.setItem(STORAGE_DEAUTH_BASE_URL, normalizeBaseUrl(alertBaseUrl));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const sendTestAlert = async () => {
    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Test deauth alert failed');
      setStatusText('TEST ALERT SENT');
    } catch {
      setStatusText('TEST ALERT FAILED');
    }
  };

  const counts24h = events.reduce(
    (acc, event) => {
      acc.deauth += event.deauthCount;
      acc.disassoc += event.disassocCount;
      return acc;
    },
    { deauth: 0, disassoc: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <RadioTower className="w-8 h-8 text-terminal-green" />
        <div>
          <h1 className="text-2xl font-bold text-terminal-green mb-1">DEAUTH GUARD</h1>
          <p className="text-terminal-muted text-sm">Detect Wi-Fi deauth/disassociation burst attacks in real-time</p>
        </div>
      </div>

      <Card title="▸ SENSOR BRIDGE SETTINGS">
        <div className="space-y-3 text-sm text-terminal-muted">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-terminal-green" />
            <span>DEAUTH ALERT BRIDGE BASE URL</span>
          </div>
          <input
            value={alertBaseUrl}
            onChange={(event) => setAlertBaseUrl(event.target.value)}
            placeholder={DEFAULT_ALERT_BASE_URL}
            className="terminal-input w-full"
          />
          <div className="flex flex-col md:flex-row gap-2">
            <Button className="w-full md:w-auto" onClick={saveSettings}>SAVE SETTINGS</Button>
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
            <Button className="w-full md:w-auto" variant="warning" onClick={sendTestAlert}>
              SEND TEST ALERT
            </Button>
          </div>
          <div className="text-xs text-terminal-muted">
            STATUS: <span className="text-terminal-green">{statusText}</span>
          </div>
          <div className="text-xs text-terminal-muted">
            PROFILE: <span className="text-terminal-green">{String(sensorProfile).toUpperCase()}</span>
          </div>
          <div className="text-xs text-terminal-muted">
            THRESHOLDS cfg-&gt;eff: <span className="text-terminal-green">{sensorThresholds}</span> | adaptive: <span className="text-terminal-green">{sensorAdaptive}</span>
          </div>
          <div className="text-xs text-terminal-muted">
            Raspberry Pi sensor should POST to <span className="text-terminal-green">{withPath(normalizeBaseUrl(alertBaseUrl), '/api/deauth/event')}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center space-y-2">
            <ShieldAlert className="w-7 h-7 mx-auto text-terminal-red" />
            <div className="text-2xl font-bold text-terminal-green">{events.length}</div>
            <div className="text-xs text-terminal-muted">ALERTS (CURRENT SESSION)</div>
          </div>
        </Card>
        <Card>
          <div className="text-center space-y-2">
            <Activity className="w-7 h-7 mx-auto text-terminal-amber" />
            <div className="text-2xl font-bold text-terminal-green">{counts24h.deauth}</div>
            <div className="text-xs text-terminal-muted">DEAUTH FRAMES OBSERVED</div>
          </div>
        </Card>
        <Card>
          <div className="text-center space-y-2">
            <Wifi className="w-7 h-7 mx-auto text-terminal-green" />
            <div className="text-2xl font-bold text-terminal-green">{counts24h.disassoc}</div>
            <div className="text-xs text-terminal-muted">DISASSOC FRAMES OBSERVED</div>
          </div>
        </Card>
      </div>

      <Card title="▸ DEAUTH INCIDENT LOG">
        <div className="space-y-2 text-sm font-mono">
          {events.length === 0 && <div className="text-terminal-muted">No deauth alerts yet.</div>}
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-2 border-l-2 border-terminal-red hover:bg-terminal-bg transition-all"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-terminal-red font-bold">[{event.severity.toUpperCase()}]</span>
                <span className="text-terminal-muted flex-1 truncate">{event.message}</span>
              </div>
              <div className="text-terminal-muted text-xs text-right min-w-[260px]">
                <div>{event.time}</div>
                <div>
                  {event.bssidMasked} | deauth={event.deauthCount} | disassoc={event.disassocCount}
                  {event.confidence !== null ? ` | ${(event.confidence * 100).toFixed(1)}%` : ''}
                </div>
                <div>
                  client={event.clientMacMasked} | th={event.effectiveThresholdDeauth}/{event.effectiveThresholdDisassoc}
                  {event.bssidHash ? ` | id=${event.bssidHash}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-terminal-bg border-terminal-amber text-terminal-amber">
        <div className="text-sm space-y-1">
          <div className="font-bold">$ HARDENING TIP</div>
          <div>Enable WPA3/WPA2-AES and Protected Management Frames (802.11w) on your router to reduce deauth attack impact.</div>
        </div>
      </Card>
    </div>
  );
};

export default DeauthGuard;
