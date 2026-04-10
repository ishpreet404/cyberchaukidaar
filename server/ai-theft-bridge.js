import "dotenv/config";
import { createServer } from "http";
import { createHash } from "crypto";
import { URL } from "url";

const PORT = Number(process.env.ALERT_SERVER_PORT || 8787);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const ALERT_SHARED_SECRET = process.env.ALERT_SHARED_SECRET || "";
const BREACH_API_URL = process.env.BREACH_API_URL || "https://leakosintapi.com/";
const BREACH_API_TOKEN = process.env.BREACH_API_TOKEN || "";
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "arcee-ai/trinity-mini:free";

const clients = new Set();
const deauthClients = new Set();
const events = [];
const deauthEvents = [];
const MAX_EVENTS = 200;

function json(res, statusCode, payload) {
	const body = JSON.stringify(payload);
	res.writeHead(statusCode, {
		"Content-Type": "application/json; charset=utf-8",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type, x-alert-secret",
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	});
	res.end(body);
}

function sseHeaders() {
	return {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache, no-transform",
		Connection: "keep-alive",
		"Access-Control-Allow-Origin": "*",
	};
}

async function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let data = "";
		req.on("data", (chunk) => {
			data += chunk;
			if (data.length > 1024 * 1024) {
				reject(new Error("Payload too large"));
			}
		});
		req.on("end", () => {
			if (!data) return resolve({});
			try {
				resolve(JSON.parse(data));
			} catch {
				reject(new Error("Invalid JSON"));
			}
		});
		req.on("error", reject);
	});
}

function normalizeEvent(payload = {}) {
	const snapshotBase64 = typeof payload.snapshotBase64 === "string" ? payload.snapshotBase64 : "";

	return {
		id: payload.id || String(Date.now()),
		type: payload.type || "THEFT",
		message: payload.message || "Suspicious activity detected",
		cameraId: payload.cameraId || "pi-cam-1",
		confidence: typeof payload.confidence === "number" ? payload.confidence : null,
		snapshotUrl: payload.snapshotUrl || "",
		snapshotBase64,
		time: payload.time || new Date().toISOString(),
	};
}

function stripTransientEventFields(event) {
	const { snapshotBase64, ...sanitized } = event;
	return sanitized;
}

function isMac(value = "") {
	return /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(value);
}

function maskMac(raw = "") {
	if (!isMac(raw)) return "";
	const parts = raw.toLowerCase().split(":");
	return `${parts[0]}:${parts[1]}:${parts[2]}:xx:xx:xx`;
}

function hashMac(raw = "") {
	if (!isMac(raw)) return "";
	return createHash("sha256").update(raw.toLowerCase()).digest("hex").slice(0, 16);
}

function normalizeDeauthEvent(payload = {}) {
	const deauthCount = Number(payload.deauthCount);
	const disassocCount = Number(payload.disassocCount);
	const confidence = Number(payload.confidence);
	const configuredThresholdDeauth = Number(payload.configuredThresholdDeauth);
	const configuredThresholdDisassoc = Number(payload.configuredThresholdDisassoc);
	const effectiveThresholdDeauth = Number(payload.effectiveThresholdDeauth);
	const effectiveThresholdDisassoc = Number(payload.effectiveThresholdDisassoc);
	const adaptiveMultiplier = Number(payload.adaptiveMultiplier);

	const bssid = String(payload.bssid || "").toLowerCase().trim();
	const clientMac = String(payload.clientMac || "").toLowerCase().trim();

	return {
		id: payload.id || String(Date.now()),
		type: payload.type || "DEAUTH",
		message: payload.message || "Suspicious deauthentication activity detected",
		source: payload.source || "raspberry-pi-deauth",
		profile: payload.profile === "production" ? "production" : "lab",
		bssid: "",
		bssidMasked: maskMac(bssid),
		bssidHash: hashMac(bssid),
		clientMac: "",
		clientMacMasked: maskMac(clientMac),
		clientMacHash: hashMac(clientMac),
		channel: payload.channel || "",
		severity: payload.severity || "medium",
		deauthCount: Number.isFinite(deauthCount) ? deauthCount : 0,
		disassocCount: Number.isFinite(disassocCount) ? disassocCount : 0,
		configuredThresholdDeauth: Number.isFinite(configuredThresholdDeauth)
			? configuredThresholdDeauth
			: null,
		configuredThresholdDisassoc: Number.isFinite(configuredThresholdDisassoc)
			? configuredThresholdDisassoc
			: null,
		effectiveThresholdDeauth: Number.isFinite(effectiveThresholdDeauth)
			? effectiveThresholdDeauth
			: null,
		effectiveThresholdDisassoc: Number.isFinite(effectiveThresholdDisassoc)
			? effectiveThresholdDisassoc
			: null,
		adaptiveThresholds: Boolean(payload.adaptiveThresholds),
		adaptiveMultiplier: Number.isFinite(adaptiveMultiplier) ? adaptiveMultiplier : null,
		confidence: Number.isFinite(confidence) ? confidence : null,
		time: payload.time || new Date().toISOString(),
	};
}

function getDeauthStatusPayload() {
	const latest = deauthEvents[0] || null;
	return {
		online: Boolean(latest),
		monitorStatus: latest ? "active" : "idle",
		lastEventTime: latest?.time || null,
		profile: latest?.profile || null,
		configuredThresholdDeauth: latest?.configuredThresholdDeauth ?? null,
		configuredThresholdDisassoc: latest?.configuredThresholdDisassoc ?? null,
		effectiveThresholdDeauth: latest?.effectiveThresholdDeauth ?? null,
		effectiveThresholdDisassoc: latest?.effectiveThresholdDisassoc ?? null,
		adaptiveThresholds: latest?.adaptiveThresholds ?? null,
		adaptiveMultiplier: latest?.adaptiveMultiplier ?? null,
		source: latest?.source || null,
	};
}

function pushEvent(event) {
	events.unshift(event);
	if (events.length > MAX_EVENTS) {
		events.length = MAX_EVENTS;
	}
}

function pushDeauthEvent(event) {
	deauthEvents.unshift(event);
	if (deauthEvents.length > MAX_EVENTS) {
		deauthEvents.length = MAX_EVENTS;
	}
}

function broadcastEvent(event) {
	const encoded = JSON.stringify(event);
	const type = String(event.type || "THEFT").toLowerCase();
	const packets = [
		`event: ${type}\ndata: ${encoded}\n\n`,
		`event: ai-theft\ndata: ${encoded}\n\n`,
		`data: ${encoded}\n\n`,
	];

	clients.forEach((res) => {
		try {
			packets.forEach((packet) => res.write(packet));
		} catch {
			clients.delete(res);
		}
	});
}

function broadcastDeauthEvent(event) {
	const packet = `event: deauth\ndata: ${JSON.stringify(event)}\n\n`;
	deauthClients.forEach((res) => {
		try {
			res.write(packet);
		} catch {
			deauthClients.delete(res);
		}
	});
}

async function sendTelegramAlert(event) {
	if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
		return { sent: false, reason: "telegram-not-configured" };
	}

	const detectedAt = event.time || new Date().toISOString();
	const textLines = [
		"🚨 *Cyber Chaukidaar AI Theft Alert*",
		`Type: ${event.type}`,
		`Camera: ${event.cameraId}`,
		`Detected At: ${detectedAt}`,
		`Message: ${event.message}`,
	];

	if (typeof event.confidence === "number") {
		textLines.push(`Confidence: ${(event.confidence * 100).toFixed(1)}%`);
	}

	if (event.snapshotUrl) {
		textLines.push(`Snapshot: ${event.snapshotUrl}`);
	}

	let response;
	if (event.snapshotBase64) {
		try {
			const imageBuffer = Buffer.from(event.snapshotBase64, "base64");
			const form = new FormData();
			form.append("chat_id", TELEGRAM_CHAT_ID);
			form.append("caption", textLines.join("\n"));
			form.append("parse_mode", "Markdown");
			form.append(
				"photo",
				new Blob([imageBuffer], { type: "image/jpeg" }),
				`detection-${Date.now()}.jpg`,
			);

			response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
				method: "POST",
				body: form,
			});

			if (!response.ok) {
				const photoError = await response.text();
				response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						chat_id: TELEGRAM_CHAT_ID,
						text: `${textLines.join("\n")}\n(Snapshot upload failed: ${photoError.slice(0, 120)})`,
						parse_mode: "Markdown",
						disable_web_page_preview: true,
					}),
				});
			}
		} catch (error) {
			return { sent: false, reason: `snapshot-encode-failed: ${error.message}` };
		}
	} else {
		response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: TELEGRAM_CHAT_ID,
				text: textLines.join("\n"),
				parse_mode: "Markdown",
				disable_web_page_preview: true,
			}),
		});
	}

	if (!response.ok) {
		const details = await response.text();
		return { sent: false, reason: details || `status-${response.status}` };
	}

	return { sent: true };
}

const server = createServer(async (req, res) => {
	const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

	if (req.method === "OPTIONS") {
		res.writeHead(204, {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Content-Type, x-alert-secret",
			"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
		});
		res.end();
		return;
	}

	if (req.method === "GET" && reqUrl.pathname === "/health") {
		json(res, 200, {
			ok: true,
			service: "ai-theft-bridge",
			telegramEnabled: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
			breachApiConfigured: Boolean(BREACH_API_TOKEN),
			openRouterConfigured: Boolean(OPENROUTER_API_KEY),
			eventCount: events.length,
			deauthEventCount: deauthEvents.length,
		});
		return;
	}

	if (req.method === "POST" && reqUrl.pathname === "/api/breach-check") {
		if (!BREACH_API_TOKEN) {
			json(res, 500, { ok: false, error: "breach-api-token-not-configured" });
			return;
		}

		try {
			const body = await readJsonBody(req);
			const query = String(body.query || "").trim();
			if (!query) {
				json(res, 400, { ok: false, error: "query-required" });
				return;
			}

			const limitRaw = Number(body.limit);
			const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(1000, Math.floor(limitRaw))) : 100;
			const lang = typeof body.lang === "string" && body.lang.trim() ? body.lang.trim() : "en";

			const payload = {
				token: BREACH_API_TOKEN,
				request: query,
				limit,
				lang,
				type: "json",
			};

			const upstream = await fetch(BREACH_API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const raw = await upstream.text();
			let data;
			try {
				data = raw ? JSON.parse(raw) : {};
			} catch {
				json(res, 502, { ok: false, error: "invalid-json-from-breach-provider" });
				return;
			}

			json(res, upstream.ok ? 200 : upstream.status, data);
		} catch (error) {
			json(res, 400, { ok: false, error: error.message });
		}
		return;
	}

	if (req.method === "POST" && reqUrl.pathname === "/api/ai-coach/chat") {
		if (!OPENROUTER_API_KEY) {
			json(res, 500, { ok: false, error: "openrouter-api-key-not-configured" });
			return;
		}

		try {
			const body = await readJsonBody(req);
			const messages = Array.isArray(body.messages) ? body.messages : [];
			if (messages.length === 0) {
				json(res, 400, { ok: false, error: "messages-required" });
				return;
			}

			const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : OPENROUTER_MODEL;

			const payload = {
				model,
				messages,
				temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
				max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 1000,
				top_p: typeof body.top_p === "number" ? body.top_p : 1,
				frequency_penalty: typeof body.frequency_penalty === "number" ? body.frequency_penalty : 0,
				presence_penalty: typeof body.presence_penalty === "number" ? body.presence_penalty : 0,
			};

			const upstream = await fetch(OPENROUTER_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${OPENROUTER_API_KEY}`,
					"HTTP-Referer": typeof body.referer === "string" ? body.referer : "http://localhost",
					"X-Title": typeof body.title === "string" ? body.title : "Cyber Chaukidaar AI Coach",
				},
				body: JSON.stringify(payload),
			});

			const raw = await upstream.text();
			let data;
			try {
				data = raw ? JSON.parse(raw) : {};
			} catch {
				json(res, 502, { ok: false, error: "invalid-json-from-openrouter" });
				return;
			}

			json(res, upstream.ok ? 200 : upstream.status, data);
		} catch (error) {
			json(res, 400, { ok: false, error: error.message });
		}
		return;
	}

	if (req.method === "GET" && reqUrl.pathname === "/api/ai-theft/events") {
		json(res, 200, {
			events,
			telegramEnabled: Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
		});
		return;
	}

	if (req.method === "GET" && reqUrl.pathname === "/api/deauth/events") {
		json(res, 200, {
			events: deauthEvents,
			...getDeauthStatusPayload(),
		});
		return;
	}

	if (req.method === "GET" && reqUrl.pathname === "/api/deauth/status") {
		json(res, 200, getDeauthStatusPayload());
		return;
	}

	if (req.method === "GET" && reqUrl.pathname === "/api/ai-theft/stream") {
		res.writeHead(200, sseHeaders());
		res.write("retry: 4000\n\n");
		clients.add(res);

		req.on("close", () => {
			clients.delete(res);
		});
		return;
	}

	if (req.method === "GET" && reqUrl.pathname === "/api/deauth/stream") {
		res.writeHead(200, sseHeaders());
		res.write("retry: 4000\n\n");
		deauthClients.add(res);

		req.on("close", () => {
			deauthClients.delete(res);
		});
		return;
	}

	if (req.method === "POST" && (reqUrl.pathname === "/api/ai-theft/event" || reqUrl.pathname === "/api/ai-theft/test")) {
		if (ALERT_SHARED_SECRET) {
			const provided = req.headers["x-alert-secret"];
			if (provided !== ALERT_SHARED_SECRET) {
				json(res, 401, { ok: false, error: "unauthorized" });
				return;
			}
		}

		try {
			const body = reqUrl.pathname === "/api/ai-theft/test"
				? {
					type: "TEST",
					message: "Test theft alert generated from dashboard",
					cameraId: "pi-cam-1",
					confidence: 0.92,
					time: new Date().toISOString(),
				}
				: await readJsonBody(req);

			const event = normalizeEvent(body);
			const eventForStore = stripTransientEventFields(event);
			pushEvent(eventForStore);
			broadcastEvent(eventForStore);

			const eventType = String(event.type || "").toUpperCase();
			const shouldNotifyTelegram = eventType === "THEFT" || eventType === "TEST";
			const telegram = shouldNotifyTelegram
				? await sendTelegramAlert(event)
				: { sent: false, reason: "skipped-non-alert-type" };

			json(res, 200, { ok: true, event: eventForStore, telegram });
		} catch (error) {
			json(res, 400, { ok: false, error: error.message });
		}
		return;
	}

	if (req.method === "POST" && (reqUrl.pathname === "/api/deauth/event" || reqUrl.pathname === "/api/deauth/test")) {
		if (ALERT_SHARED_SECRET) {
			const provided = req.headers["x-alert-secret"];
			if (provided !== ALERT_SHARED_SECRET) {
				json(res, 401, { ok: false, error: "unauthorized" });
				return;
			}
		}

		try {
			const body = reqUrl.pathname === "/api/deauth/test"
				? {
					type: "DEAUTH",
					message: "Test deauthentication burst detected near monitored SSID",
					source: "deauth-guard-test",
					bssid: "AA:BB:CC:DD:EE:FF",
					channel: "6",
					severity: "high",
					deauthCount: 26,
					disassocCount: 8,
					profile: "lab",
					configuredThresholdDeauth: 2,
					configuredThresholdDisassoc: 1,
					effectiveThresholdDeauth: 2,
					effectiveThresholdDisassoc: 1,
					adaptiveThresholds: false,
					adaptiveMultiplier: 3,
					confidence: 0.93,
					time: new Date().toISOString(),
				}
				: await readJsonBody(req);

			const event = normalizeDeauthEvent(body);
			pushDeauthEvent(event);
			broadcastDeauthEvent(event);

			json(res, 200, { ok: true, event });
		} catch (error) {
			json(res, 400, { ok: false, error: error.message });
		}
		return;
	}

	json(res, 404, { ok: false, error: "not-found" });
});

server.listen(PORT, () => {
	console.log(`[ai-theft-bridge] listening on http://localhost:${PORT}`);
	console.log(`[ai-theft-bridge] telegram enabled: ${Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)}`);
});
