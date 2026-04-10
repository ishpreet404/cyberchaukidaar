// Cyber Chaukidaar Popup Script
(function () {
	"use strict";

	let statsRefreshInterval = null;
	const STORAGE_DEAUTH_BRIDGE_BASE = "deauthBridgeBaseUrl";
	const DEFAULT_DEAUTH_BRIDGE_BASE = "http://localhost:8787";
	let deauthBridgeBaseUrl = DEFAULT_DEAUTH_BRIDGE_BASE;
	let masterUnlocked = false;
	let masterHash = null;

	document.addEventListener("DOMContentLoaded", async () => {
		initializeTabs();
			await loadDeauthBridgeSettings();
		await loadCurrentSite();
		await loadStats();
			await loadDeauthStatus();
		await loadMasterSettings();
		await loadPasswords();
		setupEventListeners();

		statsRefreshInterval = setInterval(async () => {
			await loadStats();
			await loadDeauthStatus();
		}, 2000);
	});

	function normalizeBridgeBaseUrl(raw) {
		const value = String(raw || "").trim();
		if (!value) return DEFAULT_DEAUTH_BRIDGE_BASE;
		try {
			const parsed = new URL(value);
			return parsed.origin;
		} catch (_error) {
			return value.replace(/\/+$/, "");
		}
	}

	function deauthEventsUrl() {
		return `${deauthBridgeBaseUrl.replace(/\/+$/, "")}/api/deauth/events`;
	}

	async function loadDeauthBridgeSettings() {
		const stored = await chrome.storage.local.get([STORAGE_DEAUTH_BRIDGE_BASE]);
		deauthBridgeBaseUrl = normalizeBridgeBaseUrl(stored[STORAGE_DEAUTH_BRIDGE_BASE]);

		const inputEl = document.getElementById("deauth-bridge-input");
		const statusEl = document.getElementById("deauth-bridge-status");
		if (inputEl) inputEl.value = deauthBridgeBaseUrl;
		if (statusEl) statusEl.textContent = `Current: ${deauthBridgeBaseUrl}`;
	}

	async function saveDeauthBridgeSettings(value) {
		deauthBridgeBaseUrl = normalizeBridgeBaseUrl(value);
		await chrome.storage.local.set({ [STORAGE_DEAUTH_BRIDGE_BASE]: deauthBridgeBaseUrl });

		const statusEl = document.getElementById("deauth-bridge-status");
		if (statusEl) statusEl.textContent = `Current: ${deauthBridgeBaseUrl}`;
	}

	window.addEventListener("beforeunload", () => {
		if (statsRefreshInterval) {
			clearInterval(statsRefreshInterval);
		}
	});

	function initializeTabs() {
		const tabs = document.querySelectorAll(".tab");
		const contents = document.querySelectorAll(".tab-content");

		tabs.forEach((tab) => {
			tab.addEventListener("click", () => {
				tabs.forEach((t) => t.classList.remove("active"));
				contents.forEach((c) => c.classList.remove("active"));
				tab.classList.add("active");
				const targetId = tab.dataset.tab;
				const targetContent = document.getElementById(targetId);
				if (targetContent) {
					targetContent.classList.add("active");
				}
				if (targetId === "passwords") {
					loadPasswords();
				}
			});
		});
	}

	async function loadMasterSettings() {
		const result = await chrome.storage.local.get(["masterHash"]);
		masterHash = result.masterHash || null;
		updateMasterStatus();
	}

	function updateMasterStatus() {
		const statusEl = document.getElementById("master-status");
		if (!statusEl) return;
		statusEl.textContent = masterHash
			? "Status: Enabled (Master password required)"
			: "Status: Not set";
	}

	async function sha256Base64(text) {
		const data = new TextEncoder().encode(text);
		const digest = await crypto.subtle.digest("SHA-256", data);
		const bytes = new Uint8Array(digest);
		let binary = "";
		bytes.forEach((b) => (binary += String.fromCharCode(b)));
		return btoa(binary);
	}

	async function setMasterPassword(password, confirm) {
		if (!password || password.length < 6) {
			alert("Master password must be at least 6 characters.");
			return;
		}
		if (password !== confirm) {
			alert("Passwords do not match.");
			return;
		}
		const hash = await sha256Base64(password);
		await chrome.storage.local.set({ masterHash: hash });
		masterHash = hash;
		masterUnlocked = false;
		updateMasterStatus();
		alert("Master password set.");
	}

	async function disableMasterPassword() {
		await chrome.storage.local.set({ masterHash: null });
		masterHash = null;
		masterUnlocked = false;
		updateMasterStatus();
		alert("Master password disabled.");
	}

	async function unlockWithMasterPassword(password) {
		if (!masterHash) {
			alert("Master password is not set.");
			return false;
		}
		const hash = await sha256Base64(password);
		if (hash === masterHash) {
			masterUnlocked = true;
			return true;
		}
		alert("Incorrect master password.");
		return false;
	}

	async function loadCurrentSite() {
		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			const siteUrlEl = document.getElementById("site-url");
			if (!siteUrlEl) return;

			if (!tab || !tab.url) {
				siteUrlEl.textContent = "No active tab";
				updateSiteStatus("UNKNOWN");
				return;
			}

			const url = new URL(tab.url);
			siteUrlEl.textContent = url.hostname;

			// Skip safety check for internal pages
			if (url.protocol === "chrome:" || url.protocol === "chrome-extension:" || url.protocol === "about:") {
				updateSiteStatus("UNKNOWN");
				return;
			}

			// Query background script for actual site safety status
			chrome.runtime.sendMessage(
				{ type: "GET_SITE_SAFETY", tabId: tab.id },
				(response) => {
					// Check for runtime errors first
					if (chrome.runtime.lastError) {
						console.log("Error getting site safety:", chrome.runtime.lastError.message);
						updateSiteStatus("UNKNOWN");
						return;
					}

					if (response && response.status) {
						// Update status with actual threat level
						updateSiteStatus(response.status.threat);
					} else {
						// No status available yet (page still loading or internal page)
						updateSiteStatus("UNKNOWN");
					}
				},
			);
		} catch (error) {
			const el = document.getElementById("site-url");
			if (el) el.textContent = "Error loading site";
			updateSiteStatus("UNKNOWN");
		}
	}

	function updateSiteStatus(status) {
		const badge = document.getElementById("site-status");
		if (!badge) return;

		badge.textContent = status;
		badge.className = "status-badge";

		if (status === "SAFE") {
			badge.classList.add("status-safe");
		} else if (status === "SUSPICIOUS") {
			badge.classList.add("status-suspicious");
		} else if (status === "DANGEROUS") {
			badge.classList.add("status-dangerous");
		} else {
			// UNKNOWN or any other status - neutral styling
			badge.classList.add("status-suspicious"); // Use suspicious styling as default
		}
	}

	async function loadStats() {
		try {
			const response = await chrome.runtime.sendMessage({ type: "GET_STATS" });

			if (response && response.stats) {
				const stats = response.stats;
				const elements = {
					"ads-blocked": stats.adsBlocked,
					"trackers-blocked": stats.trackersBlocked,
					"sites-scanned": stats.sitesScanned,
					"passwords-saved": stats.passwordsSaved,
				};

				for (const [id, value] of Object.entries(elements)) {
					const el = document.getElementById(id);
					if (el) el.textContent = value.toLocaleString();
				}

				const lastSyncEl = document.getElementById("last-sync");
				if (lastSyncEl) {
					if (stats.lastSync) {
						const date = new Date(stats.lastSync);
						lastSyncEl.textContent = date.toLocaleString();
					} else {
						lastSyncEl.textContent = "Never";
					}
				}
			}
		} catch (error) {
			console.error("Error loading stats:", error);
		}
	}

	async function loadDeauthStatus() {
		const statusEl = document.getElementById("deauth-status");
		const summaryEl = document.getElementById("deauth-summary");
		if (!statusEl || !summaryEl) return;

		try {
			const response = await fetch(deauthEventsUrl(), { cache: "no-store" });
			if (!response.ok) throw new Error("bridge unavailable");
			const data = await response.json();
			const list = Array.isArray(data.events) ? data.events : [];
			const latest = list[0] || null;

			statusEl.className = "status-badge";
			if (latest && latest.severity === "high") {
				statusEl.classList.add("status-dangerous");
				statusEl.textContent = "HIGH";
			} else if (latest) {
				statusEl.classList.add("status-suspicious");
				statusEl.textContent = String(latest.severity || "MEDIUM").toUpperCase();
			} else {
				statusEl.classList.add("status-safe");
				statusEl.textContent = "CLEAR";
			}

			if (latest) {
				summaryEl.textContent = `${latest.bssidMasked || "unknown"} | deauth=${latest.deauthCount || 0} | disassoc=${latest.disassocCount || 0}`;
			} else {
				summaryEl.textContent = "No deauth incidents detected";
			}
		} catch (_error) {
			statusEl.className = "status-badge status-suspicious";
			statusEl.textContent = "OFFLINE";
			summaryEl.textContent = "Bridge unavailable";
		}
	}

	async function loadPasswords() {
		const listElement = document.getElementById("password-list");
		const lockElement = document.getElementById("password-lock");
		if (!listElement) return;

		if (masterHash && !masterUnlocked) {
			if (lockElement) lockElement.style.display = "block";
			listElement.innerHTML =
				'<div class="empty-state">Locked. Use master password to unlock.</div>';
			return;
		}
		if (lockElement) lockElement.style.display = "none";

		try {
			const response = await chrome.runtime.sendMessage({
				type: "GET_ALL_PASSWORDS",
			});

			if (!response || !response.passwords) {
				listElement.innerHTML =
					'<div class="empty-state">No passwords saved yet</div>';
				return;
			}

			const passwords = response.passwords;
			const domains = Object.keys(passwords);

			if (domains.length === 0) {
				listElement.innerHTML =
					'<div class="empty-state">No passwords saved yet<br/><br/>Log in to websites to save passwords</div>';
				return;
			}

			let html = "";
			domains.forEach((domain) => {
				passwords[domain].forEach((pwd) => {
					const strengthClass =
						pwd.strength.rating === "STRONG"
							? "strength-strong"
							: pwd.strength.rating === "MEDIUM"
								? "strength-medium"
								: "strength-weak";

					html += `
          <div class="password-item">
            <div class="password-header">
              <div class="password-username">${escapeHtml(pwd.username)}</div>
              <div class="password-strength ${strengthClass}">${pwd.strength.rating}</div>
            </div>
            <div class="password-domain">${escapeHtml(domain)}</div>
            <div class="password-actions">
              <button class="btn copy-password" data-password="${escapeHtml(pwd.password)}">📋 Copy</button>
              <button class="btn btn-danger delete-password" data-domain="${escapeHtml(domain)}" data-username="${escapeHtml(pwd.username)}">🗑️ Delete</button>
            </div>
          </div>
        `;
				});
			});

			listElement.innerHTML = html;

			listElement.querySelectorAll(".copy-password").forEach((btn) => {
				btn.addEventListener("click", async (e) => {
					const password = e.target.dataset.password;
					await navigator.clipboard.writeText(password);
					e.target.textContent = "✓ Copied!";
					setTimeout(() => {
						e.target.textContent = "📋 Copy";
					}, 2000);
				});
			});

			listElement.querySelectorAll(".delete-password").forEach((btn) => {
				btn.addEventListener("click", async (e) => {
					if (confirm("Delete this password?")) {
						const domain = e.target.dataset.domain;
						const username = e.target.dataset.username;

						await chrome.runtime.sendMessage({
							type: "DELETE_PASSWORD",
							domain,
							username,
						});

						await loadPasswords();
						await loadStats();
					}
				});
			});
		} catch (error) {
			listElement.innerHTML = `<div class="empty-state" style="color: #ff0000;">Error: ${error.message}</div>`;
		}
	}

	function setupEventListeners() {
		const syncBtn = document.getElementById("sync-btn");
		if (syncBtn) {
			syncBtn.addEventListener("click", async () => {
				const originalText = syncBtn.textContent;
				syncBtn.textContent = "⏳ Opening Vault...";
				syncBtn.disabled = true;

				try {
					const response = await chrome.runtime.sendMessage({
						type: "TRIGGER_VAULT_UPDATE",
					});

					if (response && response.success) {
						syncBtn.textContent = "✓ Vault Opened!";
						setTimeout(() => {
							alert("\u26a0\ufe0f IMPORTANT: Connect your USB drive now!\n\nThe file picker will open automatically to save your passwords to the vault on USB.");
						}, 500);
					} else {
						syncBtn.textContent = "✗ Failed";
						alert(
							response.error || "Failed to open vault page.",
						);
					}
				} catch (error) {
					syncBtn.textContent = "✗ Error";
					alert("Error: " + error.message);
				}

				setTimeout(() => {
					syncBtn.textContent = originalText;
					syncBtn.disabled = false;
				}, 2000);
			});
		}

		const dashboardBtn = document.getElementById("open-dashboard");
		if (dashboardBtn) {
			dashboardBtn.addEventListener("click", () => {
				chrome.tabs.create({ url: "http://localhost:5173" });
			});
		}

		const bridgeSaveBtn = document.getElementById("deauth-bridge-save");
		if (bridgeSaveBtn) {
			bridgeSaveBtn.addEventListener("click", async () => {
				const inputEl = document.getElementById("deauth-bridge-input");
				const nextValue = inputEl ? inputEl.value : "";
				await saveDeauthBridgeSettings(nextValue);
				await loadDeauthStatus();
			});
		}

		const bridgeAutoBtn = document.getElementById("deauth-bridge-auto");
		if (bridgeAutoBtn) {
			bridgeAutoBtn.addEventListener("click", async () => {
				let autoBase = DEFAULT_DEAUTH_BRIDGE_BASE;
				try {
					const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
					if (tab && tab.url) {
						const parsed = new URL(tab.url);
						if (parsed.protocol === "http:" || parsed.protocol === "https:") {
							autoBase = `${parsed.protocol}//${parsed.hostname}:8787`;
						}
					}
				} catch (_error) {
					// Keep default localhost base when active tab URL is unavailable.
				}
				const inputEl = document.getElementById("deauth-bridge-input");
				if (inputEl) inputEl.value = autoBase;
				await saveDeauthBridgeSettings(autoBase);
				await loadDeauthStatus();
			});
		}

		const setBtn = document.getElementById("master-set");
		if (setBtn) {
			setBtn.addEventListener("click", async () => {
				const password = document.getElementById("master-set-input").value;
				const confirm = document.getElementById("master-confirm-input").value;
				await setMasterPassword(password, confirm);
			});
		}

		const disableBtn = document.getElementById("master-disable");
		if (disableBtn) {
			disableBtn.addEventListener("click", async () => {
				await disableMasterPassword();
			});
		}

		const unlockBtn = document.getElementById("master-unlock");
		if (unlockBtn) {
			unlockBtn.addEventListener("click", async () => {
				const password = document.getElementById("master-unlock-input").value;
				const ok = await unlockWithMasterPassword(password);
				if (ok) {
					await loadPasswords();
				}
			});
		}
	}

	function escapeHtml(text) {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}
})();
