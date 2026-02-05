// Cyber Chaukidaar Content Script
// Runs on every page - handles site safety overlay, password detection, and form monitoring

(function () {
	"use strict";

	console.log("Cyber Chaukidaar: Content script loaded");

	let currentSafetyStatus = null;
	let safetyOverlay = null;
	let passwordFields = new Map();

	// Listen for site safety check results from background
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.type === "SITE_SAFETY_CHECK") {
			displaySafetyOverlay(request.result);
			currentSafetyStatus = request.result;
			sendResponse({ received: true });
		} else if (request.type === "STATS_UPDATE") {
			updateStatsIfOnDashboard(request.stats);
		} else if (request.type === "USB_SYNC_REQUEST") {
			handleUSBSyncRequest(request).then(sendResponse);
			return true; // Async
		} else if (request.type === "REQUEST_USB_SYNC") {
			handleUSBSyncFromExtension(request).then(sendResponse);
			return true;
		}
	});

	// Display site safety overlay
	function displaySafetyOverlay(safetyResult) {
		// Remove existing overlay
		if (safetyOverlay) {
			safetyOverlay.remove();
		}

		// Only show overlay for suspicious/dangerous sites
		if (safetyResult.threat === "SAFE") {
			return;
		}

		// Create overlay
		safetyOverlay = document.createElement("div");
		safetyOverlay.id = "cyber-chaukidaar-overlay";

		const isDangerous = safetyResult.threat === "DANGEROUS";
		const bgColor = isDangerous
			? "rgba(255, 0, 0, 0.95)"
			: "rgba(255, 170, 0, 0.95)";
		const icon = isDangerous ? "🚨" : "⚠️";

		safetyOverlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${bgColor};
        color: #000;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
      ">
        <div style="
          background: #000;
          border: 3px solid ${isDangerous ? "#ff0000" : "#ffaa00"};
          padding: 30px;
          max-width: 600px;
          box-shadow: 0 0 50px ${isDangerous ? "#ff0000" : "#ffaa00"};
        ">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 64px; margin-bottom: 10px;">${icon}</div>
            <div style="color: #33ff00; font-size: 24px; font-weight: bold; text-transform: uppercase;">
              Cyber Chaukidaar Protection
            </div>
          </div>
          
          <div style="color: #33ff00; font-size: 18px; margin-bottom: 15px; text-align: center;">
            <span style="color: ${isDangerous ? "#ff0000" : "#ffaa00"}; font-weight: bold;">
              ${safetyResult.threat}
            </span> SITE DETECTED
          </div>
          
          <div style="color: #33ff00; margin-bottom: 10px;">
            <div style="margin-bottom: 5px;">Domain: <span style="color: #fff;">${safetyResult.hostname}</span></div>
            <div style="margin-bottom: 15px;">Safety Score: <span style="color: ${safetyResult.score < 50 ? "#ff0000" : "#ffaa00"}; font-weight: bold;">${safetyResult.score}/100</span></div>
          </div>
          
          <div style="color: #33ff00; margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 8px;">Security Issues Detected:</div>
            <ul style="margin: 0; padding-left: 20px;">
              ${safetyResult.reasons.map((reason) => `<li style="color: #fff; margin: 5px 0;">${reason}</li>`).join("")}
            </ul>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="cyber-go-back" style="
              background: #33ff00;
              color: #000;
              border: none;
              padding: 12px 24px;
              font-family: 'JetBrains Mono', monospace;
              font-weight: bold;
              font-size: 14px;
              cursor: pointer;
              text-transform: uppercase;
            ">← Go Back (Recommended)</button>
            
            <button id="cyber-proceed" style="
              background: transparent;
              color: #33ff00;
              border: 2px solid #33ff00;
              padding: 12px 24px;
              font-family: 'JetBrains Mono', monospace;
              font-weight: bold;
              font-size: 14px;
              cursor: pointer;
              text-transform: uppercase;
            ">Proceed Anyway →</button>
          </div>
          
          <div style="color: #666; font-size: 11px; text-align: center; margin-top: 15px;">
            Powered by OrderOfPhoenix
          </div>
        </div>
      </div>
    `;

		document.documentElement.appendChild(safetyOverlay);

		// Add button handlers
		document.getElementById("cyber-go-back").addEventListener("click", () => {
			window.history.back();
		});

		document.getElementById("cyber-proceed").addEventListener("click", () => {
			safetyOverlay.remove();
			safetyOverlay = null;
		});
	}

	// Monitor password fields and login forms
	function monitorPasswordFields() {
		const passwordInputs = document.querySelectorAll('input[type="password"]');

		passwordInputs.forEach((input) => {
			if (!passwordFields.has(input)) {
				passwordFields.set(input, {
					detected: Date.now(),
					form: input.closest("form"),
				});

				// Add password strength indicator
				addPasswordStrengthIndicator(input);

				// Monitor for form submission
				const form = input.closest("form");
				if (form && !form.dataset.cyberMonitored) {
					form.dataset.cyberMonitored = "true";
					form.addEventListener("submit", (e) => handleFormSubmit(e, form));
				}
			}
		});
	}

	// Add password strength indicator
	function addPasswordStrengthIndicator(input) {
		const indicator = document.createElement("div");
		indicator.className = "cyber-password-strength";
		indicator.style.cssText = `
      margin-top: 5px;
      padding: 5px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      display: none;
    `;

		input.parentElement.appendChild(indicator);

		input.addEventListener("input", async () => {
			if (input.value.length === 0) {
				indicator.style.display = "none";
				return;
			}

			const response = await chrome.runtime.sendMessage({
				type: "CHECK_PASSWORD_STRENGTH",
				password: input.value,
			});

			if (response && response.strength) {
				const s = response.strength;
				indicator.style.display = "block";
				indicator.style.color = s.color;
				indicator.textContent = `🔐 Strength: ${s.rating} (${s.score}/100)`;

				if (s.feedback.length > 0) {
					indicator.title = s.feedback.join(", ");
				}
			}
		});
	}

	// Handle form submission (password save prompt)
	async function handleFormSubmit(e, form) {
		const usernameField = form.querySelector(
			'input[type="email"], input[type="text"], input[name*="user"], input[name*="email"]',
		);
		const passwordField = form.querySelector('input[type="password"]');

		if (!usernameField || !passwordField || !passwordField.value) {
			return;
		}

		// Wait a bit for form to submit, then prompt to save
		setTimeout(async () => {
			const shouldSave = confirm(
				`🔐 Cyber Chaukidaar Password Manager\n\n` +
					`Save password for ${window.location.hostname}?\n\n` +
					`Username: ${usernameField.value}`,
			);

			if (shouldSave) {
				const response = await chrome.runtime.sendMessage({
					type: "SAVE_PASSWORD",
					data: {
						domain: window.location.hostname,
						username: usernameField.value,
						password: passwordField.value,
					},
				});

				if (response && response.success) {
					showNotification("✓ Password saved securely", "#33ff00");
				}
			}
		}, 1000);
	}

	// Show notification
	function showNotification(message, color = "#33ff00") {
		const notification = document.createElement("div");
		notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #000;
      color: ${color};
      border: 2px solid ${color};
      padding: 15px 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      z-index: 2147483646;
      box-shadow: 0 0 20px ${color};
    `;
		notification.textContent = message;

		document.documentElement.appendChild(notification);

		setTimeout(() => {
			notification.remove();
		}, 3000);
	}

	// Auto-fill passwords
	async function checkForAutoFill() {
		const passwordFields = document.querySelectorAll('input[type="password"]');
		if (passwordFields.length === 0) return;

		const response = await chrome.runtime.sendMessage({
			type: "GET_PASSWORDS",
			domain: window.location.hostname,
		});

		if (response && response.passwords && response.passwords.length > 0) {
			// Show auto-fill option
			passwordFields.forEach((field) => {
				const button = document.createElement("button");
				button.textContent = "🔐 Auto-fill";
				button.type = "button";
				button.style.cssText = `
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          background: #33ff00;
          color: #000;
          border: none;
          padding: 5px 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          z-index: 1000;
        `;

				button.addEventListener("click", () => {
					showPasswordSelect(response.passwords, field);
				});

				field.parentElement.style.position = "relative";
				field.parentElement.appendChild(button);
			});
		}
	}

	function showPasswordSelect(passwords, passwordField) {
		const overlay = document.createElement("div");
		overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

		overlay.innerHTML = `
      <div style="
        background: #000;
        border: 3px solid #33ff00;
        padding: 20px;
        min-width: 400px;
        font-family: 'JetBrains Mono', monospace;
      ">
        <h3 style="color: #33ff00; margin-top: 0;">Select Account</h3>
        <div id="password-list"></div>
        <button id="cancel-autofill" style="
          background: transparent;
          color: #33ff00;
          border: 2px solid #33ff00;
          padding: 8px 16px;
          margin-top: 10px;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
        ">Cancel</button>
      </div>
    `;

		document.documentElement.appendChild(overlay);

		const list = overlay.querySelector("#password-list");
		passwords.forEach((pwd) => {
			const item = document.createElement("div");
			item.style.cssText = `
        color: #33ff00;
        padding: 10px;
        border: 1px solid #33ff00;
        margin-bottom: 5px;
        cursor: pointer;
      `;
			item.textContent = pwd.username;

			item.addEventListener("click", () => {
				const usernameField = passwordField
					.closest("form")
					.querySelector(
						'input[type="email"], input[type="text"], input[name*="user"]',
					);
				if (usernameField) usernameField.value = pwd.username;
				passwordField.value = pwd.password;
				overlay.remove();
			});

			list.appendChild(item);
		});

		overlay.querySelector("#cancel-autofill").addEventListener("click", () => {
			overlay.remove();
		});
	}

	// Update dashboard stats if on Cyber Chaukidaar website
	function updateStatsIfOnDashboard(stats) {
		const isDashboard =
			window.location.hostname.includes("localhost") ||
			window.location.hostname.includes("cyberguard") ||
			window.location.hostname.includes("cyberchaukidaar");

		if (isDashboard) {
			// Dispatch custom event for React app
			window.dispatchEvent(
				new CustomEvent("extensionStatsUpdate", {
					detail: stats,
				}),
			);
		}
	}

	// Handle USB sync request from extension
	async function handleUSBSyncFromExtension(request) {
		try {
			// Dispatch event to React app to trigger USB sync
			window.dispatchEvent(
				new CustomEvent("usbSyncFromExtension", {
					detail: {
						passwords: request.passwords,
						stats: request.stats,
					},
				}),
			);

			return { success: true };
		} catch (error) {
			return { success: false, error: error.message };
		}
	}

	// Handle USB sync request TO extension
	async function handleUSBSyncRequest(request) {
		try {
			// Request USB data from React app
			return new Promise((resolve) => {
				const handler = (e) => {
					window.removeEventListener("usbSyncResponse", handler);
					resolve({ success: true, data: e.detail });
				};

				window.addEventListener("usbSyncResponse", handler);
				window.dispatchEvent(new CustomEvent("usbSyncRequest"));

				// Timeout after 5 seconds
				setTimeout(() => {
					window.removeEventListener("usbSyncResponse", handler);
					resolve({ success: false, error: "Timeout" });
				}, 5000);
			});
		} catch (error) {
			return { success: false, error: error.message };
		}
	}

	// Initialize monitoring
	function initialize() {
		// Monitor password fields
		monitorPasswordFields();

		// Check for auto-fill opportunities
		checkForAutoFill();

		// Watch for dynamically added password fields
		const observer = new MutationObserver(() => {
			monitorPasswordFields();
			checkForAutoFill();
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		// Warn about insecure password submission
		if (window.location.protocol === "http:") {
			const passwordFields = document.querySelectorAll(
				'input[type="password"]',
			);
			if (passwordFields.length > 0) {
				showNotification(
					"⚠️ Insecure connection! Passwords may be exposed",
					"#ff0000",
				);
			}
		}
	}

	// Start when DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initialize);
	} else {
		initialize();
	}
})();
