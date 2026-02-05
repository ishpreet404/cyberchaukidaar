// Background service worker for CyberGuard

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
	console.log("CyberGuard installed");

	// Set default values
	chrome.storage.local.set({
		threatsBlocked: 0,
		hygieneScore: 87,
		extensionEnabled: true,
	});
});

// Monitor web requests
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
	if (details.frameId !== 0) return; // Only main frame

	const url = details.url;
	const isThreat = await checkURL(url);

	if (isThreat) {
		// Block navigation and show warning
		chrome.tabs.update(details.tabId, {
			url:
				chrome.runtime.getURL("warning.html") +
				"?blocked=" +
				encodeURIComponent(url),
		});

		// Increment blocked counter
		chrome.storage.local.get(["threatsBlocked"], (result) => {
			const count = (result.threatsBlocked || 0) + 1;
			chrome.storage.local.set({ threatsBlocked: count });
		});
	}
});

// Check URL against threat database
async function checkURL(url) {
	// Simplified threat detection (in production, use real API)
	const threatPatterns = [
		/fake-bank-login/i,
		/verify-account-urgent/i,
		/prize-winner-claim/i,
		/suspended-account/i,
	];

	return threatPatterns.some((pattern) => pattern.test(url));
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "reportThreat") {
		handleThreatReport(request.data);
		sendResponse({ success: true });
	}

	if (request.action === "getSettings") {
		chrome.storage.local.get(null, (settings) => {
			sendResponse(settings);
		});
		return true; // Keep channel open for async response
	}
});

function handleThreatReport(data) {
	console.log("Threat reported:", data);
	// In production, send to backend API
}

// Sync with web dashboard
setInterval(() => {
	// In production, sync data with web platform
	chrome.storage.local.get(null, (data) => {
		console.log("Syncing data:", data);
	});
}, 60000); // Every minute
