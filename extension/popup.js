// Cyber Chaukidaar Popup Script
(function () {
	"use strict";

	let statsRefreshInterval = null;

	document.addEventListener("DOMContentLoaded", async () => {
		initializeTabs();
		await loadCurrentSite();
		await loadStats();
		await loadPasswords();
		setupEventListeners();

		statsRefreshInterval = setInterval(async () => {
			await loadStats();
		}, 2000);
	});

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
				return;
			}

			const url = new URL(tab.url);
			siteUrlEl.textContent = url.hostname;
			updateSiteStatus("SAFE");
		} catch (error) {
			const el = document.getElementById("site-url");
			if (el) el.textContent = "Error loading site";
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

	async function loadPasswords() {
		const listElement = document.getElementById("password-list");
		if (!listElement) return;

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
				syncBtn.textContent = "⏳ Syncing...";
				syncBtn.disabled = true;

				try {
					const response = await chrome.runtime.sendMessage({
						type: "SYNC_WITH_USB",
					});

					if (response && response.success) {
						syncBtn.textContent = "✓ Synced!";
						await loadStats();
					} else {
						syncBtn.textContent = "✗ Failed";
						alert(
							response.error ||
								"Sync failed. Make sure Cyber Chaukidaar website is open.",
						);
					}
				} catch (error) {
					syncBtn.textContent = "✗ Error";
					alert("Sync error: " + error.message);
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
	}

	function escapeHtml(text) {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}
})();
