// Popup functionality for CyberGuard extension

document.addEventListener("DOMContentLoaded", async () => {
	// Get current tab
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

	// Display current URL
	const urlElement = document.getElementById("current-url");
	if (tab?.url) {
		try {
			const url = new URL(tab.url);
			urlElement.textContent = url.hostname;
		} catch (e) {
			urlElement.textContent = "N/A";
		}
	}

	// Check site safety
	checkSiteSafety(tab?.url);

	// Load stats from storage
	chrome.storage.local.get(["threatsBlocked", "hygieneScore"], (result) => {
		document.getElementById("threats-blocked").textContent =
			result.threatsBlocked || "0";
		document.getElementById("hygiene-score").textContent =
			result.hygieneScore || "87";
	});

	// Button handlers
	document.getElementById("scan-page").addEventListener("click", () => {
		scanCurrentPage(tab);
	});

	document.getElementById("open-dashboard").addEventListener("click", () => {
		chrome.tabs.create({ url: "http://localhost:3000" });
	});

	document.getElementById("report-site").addEventListener("click", () => {
		reportSuspiciousSite(tab?.url);
	});
});

async function checkSiteSafety(url) {
	if (!url) return;

	const statusElement = document.getElementById("site-status");

	// Simple heuristic checks (in production, this would call an API)
	const suspiciousPatterns = [
		/verify.*account/i,
		/urgent.*action/i,
		/suspended.*account/i,
		/confirm.*identity/i,
		/update.*payment/i,
	];

	const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(url));

	// Check against known malicious domains (simplified)
	const knownBadDomains = ["malicious.fake", "phishing.test", "scam.bad"];
	const isDangerous = knownBadDomains.some((domain) => url.includes(domain));

	if (isDangerous) {
		statusElement.className = "status danger";
		statusElement.innerHTML = `
      <div>
        <div style="font-size: 14px; font-weight: bold;">[THREAT DETECTED]</div>
        <div style="font-size: 10px;">This site is known to be malicious</div>
      </div>
      <div>⚠️</div>
    `;
	} else if (isSuspicious) {
		statusElement.className = "status warning";
		statusElement.innerHTML = `
      <div>
        <div style="font-size: 14px; font-weight: bold;">[SUSPICIOUS]</div>
        <div style="font-size: 10px;">Exercise caution on this site</div>
      </div>
      <div>⚠️</div>
    `;
	}
}

function scanCurrentPage(tab) {
	// Send message to content script to perform deep scan
	chrome.tabs.sendMessage(tab.id, { action: "scanPage" }, (response) => {
		if (response?.result) {
			alert(
				`Scan complete!\n\nThreats found: ${response.threatsFound}\nTrackers blocked: ${response.trackersBlocked}`,
			);
		}
	});
}

function reportSuspiciousSite(url) {
	// In production, this would send a report to the backend
	alert(
		`Thank you for reporting: ${url}\n\nOur security team will investigate this site.`,
	);
}
