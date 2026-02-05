// Cyber Chaukidaar Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize tabs
  initializeTabs();
  
  // Load current site info
  await loadCurrentSite();
  
  // Load stats
  await loadStats();
  
  // Load passwords
  await loadPasswords();
  
  // Setup event listeners
  setupEventListeners();
});

function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      // Add active to clicked
      tab.classList.add('active');
      const targetId = tab.dataset.tab;
      document.getElementById(targetId).classList.add('active');
      
      // Load passwords when tab is opened
      if (targetId === 'passwords') {
        loadPasswords();
      }
    });
  });
}

async function loadCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      document.getElementById('site-url').textContent = 'No active tab';
      return;
    }
    
    const url = new URL(tab.url);
    document.getElementById('site-url').textContent = url.hostname;
    
    // Get site status (would come from background script in real scenario)
    // For now, show as safe
    updateSiteStatus('SAFE');
    
  } catch (error) {
    document.getElementById('site-url').textContent = 'Error loading site';
  }
}

function updateSiteStatus(status) {
  const badge = document.getElementById('site-status');
  badge.textContent = status;
  badge.className = 'status-badge';
  
  if (status === 'SAFE') {
    badge.classList.add('status-safe');
  } else if (status === 'SUSPICIOUS') {
    badge.classList.add('status-suspicious');
  } else if (status === 'DANGEROUS') {
    badge.classList.add('status-dangerous');
  }
}

async function loadStats() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  
  if (response && response.stats) {
    const stats = response.stats;
    document.getElementById('ads-blocked').textContent = stats.adsBlocked.toLocaleString();
    document.getElementById('trackers-blocked').textContent = stats.trackersBlocked.toLocaleString();
    document.getElementById('sites-scanned').textContent = stats.sitesScanned.toLocaleString();
    document.getElementById('passwords-saved').textContent = stats.passwordsSaved.toLocaleString();
    
    // Update last sync
    if (stats.lastSync) {
      const date = new Date(stats.lastSync);
      document.getElementById('last-sync').textContent = date.toLocaleString();
    } else {
      document.getElementById('last-sync').textContent = 'Never';
    }
  }
}

async function loadPasswords() {
  const listElement = document.getElementById('password-list');
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_PASSWORDS' });
    
    if (!response || !response.passwords) {
      listElement.innerHTML = '<div class="empty-state">No passwords saved yet</div>';
      return;
    }
    
    const passwords = response.passwords;
    const domains = Object.keys(passwords);
    
    if (domains.length === 0) {
      listElement.innerHTML = '<div class="empty-state">No passwords saved yet<br/><br/>Log in to websites to save passwords</div>';
      return;
    }
    
    // Build password list
    let html = '';
    domains.forEach(domain => {
      passwords[domain].forEach(pwd => {
        const strengthClass = pwd.strength.rating === 'STRONG' ? 'strength-strong' : 
                             pwd.strength.rating === 'MEDIUM' ? 'strength-medium' : 
                             'strength-weak';
        
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
    
    // Add event listeners
    listElement.querySelectorAll('.copy-password').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const password = e.target.dataset.password;
        await navigator.clipboard.writeText(password);
        e.target.textContent = '✓ Copied!';
        setTimeout(() => {
          e.target.textContent = '📋 Copy';
        }, 2000);
      });
    });
    
    listElement.querySelectorAll('.delete-password').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (confirm('Delete this password?')) {
          const domain = e.target.dataset.domain;
          const username = e.target.dataset.username;
          
          await chrome.runtime.sendMessage({
            type: 'DELETE_PASSWORD',
            domain,
            username
          });
          
          await loadPasswords();
          await loadStats();
        }
      });
    });
    
  } catch (error) {
    listElement.innerHTML = `<div class="empty-state" style="color: #ff0000;">Error loading passwords: ${error.message}</div>`;
  }
}

function setupEventListeners() {
  // Sync button
  document.getElementById('sync-btn').addEventListener('click', async () => {
    const btn = document.getElementById('sync-btn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Syncing...';
    btn.disabled = true;
    
    const response = await chrome.runtime.sendMessage({ type: 'SYNC_WITH_USB' });
    
    if (response && response.success) {
      btn.textContent = '✓ Synced!';
      await loadStats();
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    } else {
      btn.textContent = '✗ Failed';
      alert(response.error || 'Sync failed. Make sure Cyber Chaukidaar website is open.');
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
  });
  
  // Open dashboard button
  document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173' });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-refresh stats every 5 seconds
setInterval(() => {
  loadStats();
}, 5000);

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
