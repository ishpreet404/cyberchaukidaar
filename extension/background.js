// Cyber Chaukidaar - Background Service Worker
// Handles ad/tracker blocking, site safety checks, password management, and USB sync

let stats = {
	adsBlocked: 0,
	trackersBlocked: 0,
	sitesScanned: 0,
	passwordsSaved: 0,
	lastSync: null,
};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
	console.log("Cyber Chaukidaar Extension Installed");

	// Load stats from storage
	chrome.storage.local.get(["stats"], (result) => {
		if (result.stats) {
			stats = result.stats;
		}
	});

	// Initialize filter lists
	initializeFilterLists();

	// Ensure dynamic blocking rules are applied
	ensureDynamicBlockingRules();

	// Set up webRequest listener for blocking stats
	setupBlockingListeners();
});

chrome.runtime.onStartup.addListener(() => {
	// Re-apply dynamic rules on browser start
	ensureDynamicBlockingRules();
});

// Ensure dynamic blocking rules are active
async function ensureDynamicBlockingRules() {
	if (!chrome.declarativeNetRequest) {
		return;
	}

	const adDomains = [
		"doubleclick.net",
		"googlesyndication.com",
		"googleadservices.com",
		"advertising.com",
		"adnxs.com",
		"adsrvr.org",
		"criteo.com",
		"outbrain.com",
		"taboola.com",
		"pubmatic.com",
		"quantserve.com",
		"revcontent.com",
		"pagead2.googlesyndication.com",
		"adservice.google",
		"amazon-adsystem.com",
		"media.net",
		"googletagservices.com",
		"googlesyndication.com",
		"ads.yahoo.com",
		"ads.twitter.com",
		"ads.linkedin.com",
		"ads.pubmatic.com",
		"adsafeprotected.com",
		"adform.net",
		"adservice.google.com",
		"doubleclick.com",
		"g.doubleclick.net",
		"adservice.google.co.in",
		"adservice.google.co.uk",
	];

	const trackerDomains = [
		"google-analytics.com",
		"googletagmanager.com",
		"facebook.net",
		"connect.facebook.net",
		"scorecardresearch.com",
		"hotjar.com",
		"mouseflow.com",
		"fullstory.com",
		"mixpanel.com",
		"segment.com",
		"amplitude.com",
		"heap.io",
		"intercom.io",
		"clarity.ms",
		"bat.bing.com",
		"stats.g.doubleclick.net",
		"analytics.google.com",
		"api.segment.io",
		"cdn.segment.com",
	];

	const resourceTypes = [
		"script",
		"xmlhttprequest",
		"image",
		"sub_frame",
		"stylesheet",
		"media",
		"font",
		"ping",
		"other",
	];

	const baseId = 1000;
	let id = baseId;
	const rules = [];

	adDomains.forEach((domain) => {
		rules.push({
			id: id++,
			priority: 1,
			action: { type: "block" },
			condition: {
				urlFilter: domain,
				resourceTypes,
			},
		});
	});

	trackerDomains.forEach((domain) => {
		rules.push({
			id: id++,
			priority: 1,
			action: { type: "block" },
			condition: {
				urlFilter: domain,
				resourceTypes,
			},
		});
	});

	try {
		const existing = await chrome.declarativeNetRequest.getDynamicRules();
		const removeIds = existing
			.map((rule) => rule.id)
			.filter((ruleId) => ruleId >= baseId && ruleId < baseId + 5000);

		await chrome.declarativeNetRequest.updateDynamicRules({
			removeRuleIds: removeIds,
			addRules: rules,
		});
		console.log(
			"Cyber Chaukidaar: Dynamic blocking rules applied",
			rules.length,
		);
	} catch (error) {
		console.error("Cyber Chaukidaar: Failed to apply dynamic rules", error);
	}
}

// Setup webRequest listeners to track blocks
function setupBlockingListeners() {
	// List of ad/tracker domains
	const adDomains = [
		"doubleclick.net",
		"googlesyndication.com",
		"googleadservices.com",
		"advertising.com",
		"adnxs.com",
		"adsrvr.org",
		"criteo.com",
		"outbrain.com",
		"taboola.com",
		"pubmatic.com",
		"quantserve.com",
		"revcontent.com",
		"pagead2.googlesyndication.com",
		"adservice.google",
		"amazon-adsystem.com",
		"media.net",
	];

	const trackerDomains = [
		"google-analytics.com",
		"googletagmanager.com",
		"facebook.net",
		"connect.facebook.net",
		"scorecardresearch.com",
		"hotjar.com",
		"mouseflow.com",
		"fullstory.com",
		"mixpanel.com",
		"segment.com",
		"amplitude.com",
		"heap.io",
		"intercom.io",
	];

	// Monitor requests and increment counters
	chrome.webRequest.onBeforeRequest.addListener(
		(details) => {
			const url = details.url.toLowerCase();

			// Check if it's an ad
			if (adDomains.some((domain) => url.includes(domain))) {
				stats.adsBlocked++;
				saveStats();
				broadcastStats();
			}
			// Check if it's a tracker
			else if (trackerDomains.some((domain) => url.includes(domain))) {
				stats.trackersBlocked++;
				saveStats();
				broadcastStats();
			}

			// Let declarativeNetRequest handle actual blocking
		},
		{ urls: ["<all_urls>"] },
	);
}

// Track blocked requests using declarativeNetRequest (if available)
if (
	chrome.declarativeNetRequest &&
	chrome.declarativeNetRequest.onRuleMatchedDebug
) {
	chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
		if (details.rule.rulesetId === "ads_ruleset") {
			stats.adsBlocked++;
		} else if (details.rule.rulesetId === "trackers_ruleset") {
			stats.trackersBlocked++;
		}

		saveStats();
		broadcastStats();
	});
}

// Site safety checker - runs on every navigation
chrome.webNavigation.onCommitted.addListener(async (details) => {
	if (details.frameId === 0) {
		// Main frame only
		const url = new URL(details.url);

		// Skip internal pages and unsupported schemes
		if (
			url.protocol === "chrome:" ||
			url.protocol === "chrome-extension:" ||
			(url.protocol !== "http:" && url.protocol !== "https:")
		) {
			console.log("Cyber Chaukidaar: Skipping internal page:", url.href);
			return;
		}

		console.log("Cyber Chaukidaar: Scanning site:", url.hostname);
		stats.sitesScanned++;
		saveStats();

		// Check site safety
		const safetyResult = await checkSiteSafety(url.hostname, url.href);
		console.log("Cyber Chaukidaar: Safety check result:", safetyResult);

		// Send to content script for overlay
		chrome.tabs.sendMessage(
			details.tabId,
			{
				type: "SITE_SAFETY_CHECK",
				result: safetyResult,
				url: url.hostname,
			},
			() => {
				if (chrome.runtime.lastError) {
					// No content script on this page (e.g., file:// or restricted pages)
					return;
				}
				console.log(
					"Cyber Chaukidaar: Safety result sent to tab",
					details.tabId,
				);
			},
		);
	}
});

// Comprehensive site safety checker
async function checkSiteSafety(hostname, fullUrl) {
	const indicators = {
		suspicious: false,
		reasons: [],
		score: 100,
	};

	// Check for suspicious TLDs (high-risk extensions)
	const suspiciousTLDs = [
		".tk",
		".ml",
		".ga",
		".cf",
		".gq",
		".cn",
		".pw",
		".cc",
		".top",
		".xyz",
		".loan",
		".click",
	];
	if (suspiciousTLDs.some((tld) => hostname.endsWith(tld))) {
		indicators.suspicious = true;
		indicators.reasons.push("High-risk domain extension");
		indicators.score -= 30;
	}

	// Check for excessive hyphens or numbers (obfuscation)
	const hyphenCount = (hostname.match(/-/g) || []).length;
	const numberCount = (hostname.match(/\d/g) || []).length;
	if (hyphenCount > 2) {
		indicators.suspicious = true;
		indicators.reasons.push("Excessive hyphens in domain");
		indicators.score -= 15;
	}
	if (numberCount > 4) {
		indicators.suspicious = true;
		indicators.reasons.push("Excessive numbers in domain");
		indicators.score -= 15;
	}

	// Check for phishing keywords (brand impersonation)
	const phishingKeywords = [
		"verify",
		"account",
		"secure",
		"login",
		"banking",
		"paypal",
		"amazon",
		"update",
		"confirm",
		"suspended",
		"locked",
		"urgent",
		"security",
		"wallet",
		"crypto",
		"signin",
		"authenticate",
		"validation",
		"credential",
	];
	const domainLower = hostname.toLowerCase();
	const matchedKeywords = phishingKeywords.filter((kw) =>
		domainLower.includes(kw),
	);
	if (matchedKeywords.length >= 2) {
		indicators.suspicious = true;
		indicators.reasons.push(
			`Contains suspicious keywords: ${matchedKeywords.join(", ")}`,
		);
		indicators.score -= 25;
	}

	// Check for IDN homograph attacks (lookalike characters)
	if (/[^\x00-\x7F]/.test(hostname)) {
		indicators.suspicious = true;
		indicators.reasons.push("Contains unicode characters (possible spoofing)");
		indicators.score -= 40;
	}

	// Check for IP address as domain (often used by attackers)
	if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
		indicators.suspicious = true;
		indicators.reasons.push("Direct IP address instead of domain");
		indicators.score -= 20;
	}

	// Check for subdomain stacking (sign of phishing)
	const parts = hostname.split(".");
	if (parts.length > 4) {
		indicators.suspicious = true;
		indicators.reasons.push("Excessive subdomains (possible phishing)");
		indicators.score -= 20;
	}

	// Check domain length
	if (hostname.length < 4) {
		indicators.suspicious = true;
		indicators.reasons.push("Suspiciously short domain");
		indicators.score -= 10;
	} else if (hostname.length > 50) {
		indicators.suspicious = true;
		indicators.reasons.push("Unusually long domain");
		indicators.score -= 10;
	}

	// Check for HTTPS (block plain HTTP unless localhost)
	let isHttp = false;
	const localhostAllowlist = new Set(["localhost", "127.0.0.1", "::1"]);
	if (fullUrl.startsWith("http://") && !localhostAllowlist.has(hostname)) {
		isHttp = true;
		indicators.suspicious = true;
		indicators.reasons.push("🚫 Insecure HTTP (blocked)");
		indicators.score -= 50;
	} else if (
		fullUrl.startsWith("http://") &&
		localhostAllowlist.has(hostname)
	) {
		indicators.reasons.push("ℹ️ HTTP allowed for localhost");
	}

	// Check against local blacklist
	const blacklist = await getBlacklist();
	if (blacklist.includes(hostname)) {
		indicators.suspicious = true;
		indicators.reasons.push("🚨 Domain in known malicious list");
		indicators.score -= 60;
	}

	// Check for common typosquatting (e.g., googel.com, paypa1.com)
	const legitimateBrands = [
		"google",
		"facebook",
		"amazon",
		"paypal",
		"microsoft",
		"apple",
		"netflix",
	];
	for (const brand of legitimateBrands) {
		if (domainLower.includes(brand) && !hostname.endsWith(`${brand}.com`)) {
			indicators.suspicious = true;
			indicators.reasons.push(`Possible typosquatting of ${brand}`);
			indicators.score -= 35;
		}
	}

	// Determine threat level
	let threat = "SAFE";
	if (isHttp || indicators.score < 40) {
		threat = "DANGEROUS";
	} else if (indicators.score < 70) {
		threat = "SUSPICIOUS";
	}

	return {
		safe: !indicators.suspicious,
		threat: threat,
		score: Math.max(0, indicators.score),
		reasons: indicators.reasons,
		hostname: hostname,
		block: isHttp,
		allowlist: localhostAllowlist.has(hostname),
	};
}

// Password management functions
async function savePassword(data) {
	return new Promise((resolve) => {
		chrome.storage.local.get(["passwords"], (result) => {
			const passwords = result.passwords || {};

			if (!passwords[data.domain]) {
				passwords[data.domain] = [];
			}

			// Check if password already exists
			const existingIndex = passwords[data.domain].findIndex(
				(p) => p.username === data.username,
			);

			if (existingIndex >= 0) {
				// Update existing
				passwords[data.domain][existingIndex] = {
					...passwords[data.domain][existingIndex],
					password: data.password,
					strength: calculatePasswordStrength(data.password),
					lastUpdated: Date.now(),
					lastUsed: Date.now(),
				};
				console.log(`✓ Updated password for ${data.username}@${data.domain}`);
			} else {
				// Add new
				passwords[data.domain].push({
					username: data.username,
					password: data.password,
					strength: calculatePasswordStrength(data.password),
					createdAt: Date.now(),
					lastUsed: Date.now(),
				});
				console.log(`✓ Saved new password for ${data.username}@${data.domain}`);
			}

			chrome.storage.local.set({ passwords }, () => {
				stats.passwordsSaved = Object.values(passwords).reduce(
					(sum, arr) => sum + arr.length,
					0,
				);
				saveStats();
				broadcastStats(); // Broadcast immediately after save
				console.log(`Total passwords saved: ${stats.passwordsSaved}`);
				resolve(true);
			});
		});
	});
}

async function getPasswords(domain) {
	return new Promise((resolve) => {
		chrome.storage.local.get(["passwords"], (result) => {
			const passwords = result.passwords || {};
			resolve(passwords[domain] || []);
		});
	});
}

async function getAllPasswords() {
	return new Promise((resolve) => {
		chrome.storage.local.get(["passwords"], (result) => {
			resolve(result.passwords || {});
		});
	});
}

// Password strength calculator (comprehensive)
function calculatePasswordStrength(password) {
	let score = 0;
	let feedback = [];

	// Length scoring
	if (password.length >= 8) score += 20;
	if (password.length >= 12) score += 10;
	if (password.length >= 16) score += 10;
	if (password.length < 8) feedback.push("Too short (min 8 characters)");

	// Character variety
	if (/[a-z]/.test(password)) score += 10;
	else feedback.push("Add lowercase letters");

	if (/[A-Z]/.test(password)) score += 10;
	else feedback.push("Add uppercase letters");

	if (/\d/.test(password)) score += 10;
	else feedback.push("Add numbers");

	if (/[^a-zA-Z0-9]/.test(password)) score += 15;
	else feedback.push("Add special characters");

	// Pattern checks (deduct points)
	if (/(.)\1{2,}/.test(password)) {
		score -= 10;
		feedback.push("Avoid repeated characters");
	}

	if (/^[a-zA-Z]+$/.test(password)) {
		score -= 10;
		feedback.push("Too simple (only letters)");
	}

	if (/^[0-9]+$/.test(password)) {
		score -= 20;
		feedback.push("Too simple (only numbers)");
	}

	// Sequential patterns
	if (/(?:abc|bcd|cde|123|234|345|456|567|678|789)/i.test(password)) {
		score -= 15;
		feedback.push("Avoid sequential patterns");
	}

	// Common weak passwords
	const commonPatterns = [
		"password",
		"admin",
		"qwerty",
		"letmein",
		"welcome",
		"123456",
		"password123",
		"admin123",
		"qwerty123",
	];
	if (commonPatterns.some((p) => password.toLowerCase().includes(p))) {
		score -= 20;
		feedback.push("Avoid common passwords");
	}

	// Keyboard patterns
	if (/(?:qwe|asd|zxc|qaz|wsx)/i.test(password)) {
		score -= 10;
		feedback.push("Avoid keyboard patterns");
	}

	// Calculate final score
	score = Math.max(0, Math.min(100, score));

	let rating = "WEAK";
	let color = "#ff0000";
	if (score >= 60) {
		rating = "STRONG";
		color = "#33ff00";
	} else if (score >= 35) {
		rating = "MEDIUM";
		color = "#ffaa00";
	}

	return {
		score: score,
		rating: rating,
		color: color,
		feedback: feedback,
	};
}

// USB Vault sync functionality
async function syncWithUSB() {
	try {
		// Get all passwords from extension
		const extensionPasswords = await getAllPasswords();

		// Find Cyber Chaukidaar tabs
		const tabs = await chrome.tabs.query({});
		const cyberguardTabs = tabs.filter(
			(tab) =>
				tab.url &&
				(tab.url.includes("localhost") ||
					tab.url.includes("cyberguard") ||
					tab.url.includes("cyberchaukidaar")),
		);

		if (cyberguardTabs.length === 0) {
			return {
				success: false,
				error: "Open Cyber Chaukidaar website to sync with USB Vault",
			};
		}

		// Request sync from website
		const response = await chrome.tabs.sendMessage(cyberguardTabs[0].id, {
			type: "USB_SYNC_REQUEST",
			passwords: extensionPasswords,
			stats: stats,
		});

		if (response && response.success) {
			stats.lastSync = Date.now();
			saveStats();
			return {
				success: true,
				timestamp: stats.lastSync,
				message: "Synced with USB Vault",
			};
		}

		return { success: false, error: "Sync failed" };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

// Blacklist management
async function getBlacklist() {
	return new Promise((resolve) => {
		chrome.storage.local.get(["blacklist"], (result) => {
			resolve(result.blacklist || []);
		});
	});
}

async function addToBlacklist(domain) {
	return new Promise((resolve) => {
		chrome.storage.local.get(["blacklist"], (result) => {
			const blacklist = result.blacklist || [];
			if (!blacklist.includes(domain)) {
				blacklist.push(domain);
				chrome.storage.local.set({ blacklist }, () => resolve(true));
			} else {
				resolve(false);
			}
		});
	});
}

// Initialize filter lists (uBlock Origin style)
function initializeFilterLists() {
	// Common ad/tracker domains (sample - real implementation would use full lists)
	const adDomains = [
		"doubleclick.net",
		"googlesyndication.com",
		"googleadservices.com",
		"advertising.com",
		"adnxs.com",
		"adsrvr.org",
		"criteo.com",
		"pubmatic.com",
		"outbrain.com",
		"taboola.com",
		"quantserve.com",
		"revcontent.com",
	];

	const trackerDomains = [
		"google-analytics.com",
		"googletagmanager.com",
		"facebook.net",
		"connect.facebook.net",
		"scorecardresearch.com",
		"hotjar.com",
		"mouseflow.com",
		"fullstory.com",
		"mixpanel.com",
		"segment.com",
		"amplitude.com",
		"heap.io",
		"intercom.io",
	];

	chrome.storage.local.set({
		adDomains: adDomains,
		trackerDomains: trackerDomains,
		initialized: true,
	});
}

// Save stats to storage
function saveStats() {
	chrome.storage.local.set({ stats: stats });
}

// Broadcast stats to all tabs
function broadcastStats() {
	chrome.tabs.query({}, (tabs) => {
		tabs.forEach((tab) => {
			chrome.tabs
				.sendMessage(tab.id, {
					type: "STATS_UPDATE",
					stats: stats,
				})
				.catch(() => {});
		});
	});
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === "GET_STATS") {
		sendResponse({ stats: stats });
	} else if (request.type === "SAVE_PASSWORD") {
		savePassword(request.data).then((success) => {
			sendResponse({ success });
			// Auto-sync with USB vault after saving password
			syncWithUSB().then((result) => {
				if (result.success) {
					console.log('\u2713 Auto-synced password with USB vault');
				}
			}).catch(() => {
				// Silently ignore if vault is not open
			});
		});
		return true; // Async
	} else if (request.type === "GET_PASSWORDS") {
		getPasswords(request.domain).then((passwords) => {
			sendResponse({ passwords });
		});
		return true;
	} else if (request.type === "GET_ALL_PASSWORDS") {
		getAllPasswords().then((passwords) => {
			sendResponse({ passwords });
		});
		return true;
	} else if (request.type === "SYNC_WITH_USB") {
		syncWithUSB().then((result) => {
			sendResponse(result);
		});
		return true;
	} else if (request.type === "ADD_TO_BLACKLIST") {
		addToBlacklist(request.domain).then((success) => {
			sendResponse({ success });
		});
		return true;
	} else if (request.type === "CHECK_PASSWORD_STRENGTH") {
		const strength = calculatePasswordStrength(request.password);
		sendResponse({ strength });
	} else if (request.type === "DELETE_PASSWORD") {
		deletePassword(request.domain, request.username).then((success) => {
			sendResponse({ success });
		});
		return true;
	}
});

async function deletePassword(domain, username) {
	return new Promise((resolve) => {
		chrome.storage.local.get(["passwords"], (result) => {
			const passwords = result.passwords || {};

			if (passwords[domain]) {
				passwords[domain] = passwords[domain].filter(
					(p) => p.username !== username,
				);
				if (passwords[domain].length === 0) {
					delete passwords[domain];
				}

				chrome.storage.local.set({ passwords }, () => {
					stats.passwordsSaved = Object.values(passwords).reduce(
						(sum, arr) => sum + arr.length,
						0,
					);
					saveStats();
					resolve(true);
				});
			} else {
				resolve(false);
			}
		});
	});
}

// Periodic stats broadcast (for dashboard sync)
setInterval(() => {
	broadcastStats();
}, 5000); // Every 5 seconds
