// Content script - runs on every page

(function () {
	"use strict";

	console.log("CyberGuard content script loaded");

	// Scan for suspicious elements on page load
	window.addEventListener("load", () => {
		scanPageForThreats();
		blockSuspiciousLinks();
		monitorFormSubmissions();
	});

	function scanPageForThreats() {
		// Check for common phishing indicators
		const indicators = {
			passwordFields: document.querySelectorAll('input[type="password"]')
				.length,
			externalForms: checkExternalForms(),
			suspiciousText: findSuspiciousText(),
			hiddenIframes: document.querySelectorAll('iframe[style*="display: none"]')
				.length,
		};

		// Send results to background script
		chrome.runtime.sendMessage({
			action: "scanResults",
			data: indicators,
		});
	}

	function checkExternalForms() {
		const forms = document.querySelectorAll("form");
		let externalCount = 0;

		forms.forEach((form) => {
			const action = form.getAttribute("action");
			if (action && !action.startsWith(window.location.origin)) {
				externalCount++;
				// Add warning overlay
				addWarningToElement(form);
			}
		});

		return externalCount;
	}

	function findSuspiciousText() {
		const suspiciousPatterns = [
			/verify.*account.*immediately/i,
			/account.*suspended/i,
			/urgent.*action.*required/i,
			/confirm.*identity/i,
			/update.*payment.*information/i,
		];

		const bodyText = document.body.innerText;
		return suspiciousPatterns.filter((pattern) => pattern.test(bodyText))
			.length;
	}

	function blockSuspiciousLinks() {
		const links = document.querySelectorAll("a[href]");

		links.forEach((link) => {
			const href = link.getAttribute("href");

			// Check for suspicious link patterns
			if (isSuspiciousLink(href)) {
				link.addEventListener("click", (e) => {
					e.preventDefault();
					showLinkWarning(href);
				});

				// Add visual indicator
				link.style.border = "2px solid #ff3333";
				link.style.position = "relative";
				link.title = "⚠️ CyberGuard: Potentially dangerous link";
			}
		});
	}

	function isSuspiciousLink(href) {
		if (!href) return false;

		// Check for common phishing patterns
		const patterns = [
			/bit\.ly|tinyurl/i, // URL shorteners
			/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
			/@/, // @ symbol in URL (deceptive)
		];

		return patterns.some((pattern) => pattern.test(href));
	}

	function monitorFormSubmissions() {
		const forms = document.querySelectorAll("form");

		forms.forEach((form) => {
			form.addEventListener("submit", (e) => {
				const hasPasswordField = form.querySelector('input[type="password"]');
				const isSecure = window.location.protocol === "https:";

				if (hasPasswordField && !isSecure) {
					e.preventDefault();
					alert(
						"⚠️ CyberGuard Warning\n\nThis form is trying to submit a password over an insecure connection.\n\nDO NOT PROCEED - Your password could be intercepted.",
					);
				}
			});
		});
	}

	function addWarningToElement(element) {
		const warning = document.createElement("div");
		warning.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: #ff3333;
      color: #000;
      padding: 8px;
      font-family: monospace;
      font-weight: bold;
      z-index: 10000;
      text-align: center;
    `;
		warning.textContent = "⚠️ CYBERGUARD: Suspicious form detected";

		element.style.position = "relative";
		element.insertBefore(warning, element.firstChild);
	}

	function showLinkWarning(href) {
		const proceed = confirm(
			`⚠️ CYBERGUARD SECURITY WARNING\n\n` +
				`This link appears suspicious:\n${href}\n\n` +
				`Common indicators:\n` +
				`- URL shortener or obfuscated link\n` +
				`- Unusual domain pattern\n` +
				`- Potential phishing attempt\n\n` +
				`Do you want to proceed anyway?`,
		);

		if (proceed) {
			window.location.href = href;
		}
	}

	// Listen for messages from popup
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.action === "scanPage") {
			const result = {
				threatsFound: findSuspiciousText(),
				trackersBlocked: 12, // Mock value
				result: "Scan complete",
			};
			sendResponse(result);
		}
	});
})();
