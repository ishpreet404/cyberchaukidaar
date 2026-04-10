import { createServer } from 'http';
import { URL } from 'url';

const PORT = Number(process.env.ALERT_SERVER_PORT || 8787);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const ALERT_SHARED_SECRET = process.env.ALERT_SHARED_SECRET || '';

const clients = new Set();
const events = [];
const MAX_EVENTS = 200;

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-alert-secret',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(body);
}

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  };
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function normalizeEvent(payload = {}) {
  return {
    id: payload.id || String(Date.now()),
    type: payload.type || 'THEFT',
    message: payload.message || 'Suspicious activity detected',
    cameraId: payload.cameraId || 'pi-cam-1',
    confidence: typeof payload.confidence === 'number' ? payload.confidence : null,
    snapshotUrl: payload.snapshotUrl || '',
    time: payload.time || new Date().toISOString(),
  };
}

function pushEvent(event) {
  events.unshift(event);
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }
}

function broadcastEvent(event) {
  const packet = `event: theft\ndata: ${JSON.stringify(event)}\n\n`;
  clients.forEach((res) => {
    try {
      res.write(packet);
    } catch (error) {
      clients.delete(res);
    }
  });
}

async function sendTelegramAlert(event) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { sent: false, reason: 'telegram-not-configured' };
  }

  const textLines = [
    '🚨 *Cyber Chaukidaar AI Theft Alert*',
    `Type: ${event.type}`,
    `Camera: ${event.cameraId}`,
    `Time: ${event.time}`,
    `Message: ${event.message}`,
  ];

  if (typeof event.confidence === 'number') {
    textLines.push(`Confidence: ${(event.confidence * 100).toFixed(1)}%`);
  }

  if (event.snapshotUrl) {
    textLines.push(`Snapshot: ${event.snapshotUrl}`);
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: textLines.join('\n'),
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    return { sent: false, reason: details || `status-${response.status}` };
  }

  return { sent: true };
}

const server = createServer(async (req, res) => {
  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-alert-secret',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/health') {
    json(res, 200, {
      ok: true,
      service: 'ai-theft-bridge',
      telegramEnabled: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
      eventCount: events.length,
    });
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/ai-theft/events') {
    json(res, 200, {
      events,
      telegramEnabled: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
    });
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/ai-theft/stream') {
    res.writeHead(200, sseHeaders());
    res.write('retry: 4000\n\n');
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  if (req.method === 'POST' && (reqUrl.pathname === '/api/ai-theft/event' || reqUrl.pathname === '/api/ai-theft/test')) {
    if (ALERT_SHARED_SECRET) {
      const provided = req.headers['x-alert-secret'];
      if (provided !== ALERT_SHARED_SECRET) {
        json(res, 401, { ok: false, error: 'unauthorized' });
        return;
      }
    }

    try {
      const body = reqUrl.pathname === '/api/ai-theft/test'
        ? {
            type: 'TEST',
            message: 'Test theft alert generated from dashboard',
            cameraId: 'pi-cam-1',
            confidence: 0.92,
            time: new Date().toISOString(),
          }
        : await readJsonBody(req);

      const event = normalizeEvent(body);
      pushEvent(event);
      broadcastEvent(event);

      const telegram = await sendTelegramAlert(event);
      json(res, 200, { ok: true, event, telegram });
    } catch (error) {
      json(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  json(res, 404, { ok: false, error: 'not-found' });
});

server.listen(PORT, () => {
  console.log(`[ai-theft-bridge] listening on http://localhost:${PORT}`);
  console.log(`[ai-theft-bridge] telegram enabled: ${Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)}`);
});
