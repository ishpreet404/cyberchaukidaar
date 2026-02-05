# Cyber Chaukidaar Browser Extension

Complete cybersecurity suite for your browser - powered by OrderOfPhoenix.

## Features

### 🛡️ Site Safety Checker
- Real-time security analysis of every website you visit
- Detects phishing, typosquatting, and malicious domains
- Full-screen overlay warnings for dangerous sites
- Multi-factor scoring system (domain TLD, keywords, homograph attacks, etc.)

### 🚫 Ad & Tracker Blocker
- Blocks 12+ major ad networks (uBlock Origin style)
- Blocks 13+ tracking scripts (Google Analytics, Facebook Pixel, etc.)
- Uses Chrome's declarativeNetRequest API for high performance
- Tracks and displays blocked count in real-time

### 🔐 Password Manager
- Auto-save passwords when logging in
- Real-time password strength checker (100-point scale)
- Auto-fill credentials on login forms
- Secure storage with browser's built-in encryption
- **USB Vault Sync**: Sync passwords with hardware-backed USB encryption

### 📊 Dashboard Integration
- Extension stats displayed on Cyber Chaukidaar website
- Real-time sync every 5 seconds
- Tracks: ads blocked, trackers blocked, sites scanned, passwords saved

## Installation

### Manual Installation (Chrome/Edge)

1. **Build the extension files** (if needed):
   ```bash
   cd extension
   # All files are already in place
   ```

2. **Load in Chrome/Edge**:
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `extension` folder from this project

3. **Verify Installation**:
   - Extension icon should appear in toolbar
   - Click icon to see popup with stats
   - Visit any website to test site safety checker

### Using the Extension

#### Site Safety
- Extension automatically scans every site you visit
- Suspicious/dangerous sites show full-screen warning overlay
- Options: Go Back (recommended) or Proceed Anyway

#### Ad/Tracker Blocking
- Works automatically on all websites
- See blocked count in extension popup (Dashboard tab)
- Uses filter lists in `/rules/ads.json` and `/rules/trackers.json`

#### Password Manager
- Visit any login page (username + password fields)
- Fill in credentials and submit form
- Extension prompts to save after 1 second
- Click extension icon → Passwords tab to manage

#### USB Vault Sync
1. Open Cyber Chaukidaar website (http://localhost:5173)
2. Go to USB Vault page and unlock your vault
3. Click extension icon → Dashboard tab → "Sync with USB Vault"
4. Passwords are encrypted and synced to USB drive

## Architecture

### Background Service Worker (`background.js`)
- Site safety analysis engine
- Password strength calculator (8 criteria)
- Ad/tracker blocking coordinator
- USB sync orchestrator
- Stats aggregation and broadcast

### Content Script (`content.js`)
- Injects safety overlay on dangerous sites
- Monitors password fields for strength indicator
- Detects form submissions for password save prompts
- Auto-fill password functionality
- Communicates with website for sync

### Popup UI (`popup.html` + `popup.js`)
- 3 tabs: Dashboard, Passwords, Settings
- Real-time stats display
- Password management interface
- USB sync trigger button

### Filter Lists (`rules/*.json`)
- `ads.json`: 12 ad network blocking rules
- `trackers.json`: 13 tracker blocking rules
- Uses declarativeNetRequest API (Chrome MV3)

## Permissions Explained

- **storage**: Save passwords and stats locally
- **tabs**: Check current tab URL for safety
- **webRequest/webNavigation**: Monitor navigation for safety checks
- **declarativeNetRequest**: Block ads/trackers efficiently
- **activeTab**: Inject content scripts for overlays
- **unlimitedStorage**: Store unlimited passwords
- **host_permissions (<all_urls>)**: Work on all websites

## Syncing with Website

The extension communicates with Cyber Chaukidaar website via `CustomEvent` API:

```javascript
// Extension → Website
window.dispatchEvent(new CustomEvent('extensionStatsUpdate', {
  detail: { adsBlocked, trackersBlocked, sitesScanned, passwordsSaved }
}));

// Website → Extension (USB Sync)
window.dispatchEvent(new CustomEvent('usbSyncResponse', {
  detail: { passwords, timestamp }
}));
```

## Development

### Adding More Blocking Rules

Edit `rules/ads.json` or `rules/trackers.json`:

```json
{
  "id": 200,
  "priority": 1,
  "action": { "type": "block" },
  "condition": {
    "urlFilter": "*example-ad-domain.com/*",
    "resourceTypes": ["script", "xmlhttprequest", "image"]
  }
}
```

### Customizing Site Safety Checks

Edit `checkSiteSafety()` in `background.js` to add new indicators:

```javascript
// Add custom check
if (hostname.includes('custom-check')) {
  indicators.suspicious = true;
  indicators.reasons.push('Custom security check failed');
  indicators.score -= 30;
}
```

## Security Notes

⚠️ **Important**: This extension stores passwords locally in browser storage. While Chrome's storage is encrypted, consider these best practices:

1. **Use USB Vault**: Sync passwords to hardware-backed encryption
2. **Strong Master Password**: Browser profiles should have strong passwords
3. **Device Security**: Keep your device secure and updated
4. **Regular Backups**: Export passwords regularly via USB Vault

## Tech Stack

- **Manifest V3**: Latest Chrome extension standard
- **JavaScript ES6+**: Modern async/await patterns
- **declarativeNetRequest**: High-performance blocking
- **Web Crypto API**: Password strength analysis
- **Custom Events**: Website-extension communication

## Troubleshooting

### Extension not loading?
- Check Chrome version (need 88+)
- Ensure Developer Mode is enabled
- Check console for errors: `chrome://extensions/`

### Stats not syncing with website?
- Open Cyber Chaukidaar website in a tab
- Extension must be active (check icon)
- Check browser console for CustomEvent messages

### Password auto-fill not working?
- Ensure form has both username AND password fields
- Check field types: `type="email"` or `type="text"` for username
- Some sites use JavaScript logins (not supported)

### USB Sync failing?
- Website must be open and vault unlocked
- Click extension icon → Dashboard → "Sync with USB Vault"
- Check for error message (e.g., "website not open")

## License

Part of Cyber Chaukidaar project - OrderOfPhoenix © 2024

## Version

1.0.0 - Initial release
