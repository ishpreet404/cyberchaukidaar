# 🚀 Quick Start - Cyber Chaukidaar Extension

## Install in 3 Steps

### Step 1: Load Extension (2 minutes)

```bash
# Open Chrome/Edge browser
chrome://extensions/

# Enable "Developer Mode" (top-right toggle)

# Click "Load unpacked"

# Navigate to and select:
D:\hacktivate\extension
```

### Step 2: Add Icon Placeholders (1 minute)

The extension needs icon files. Quick fix:

```bash
cd D:\hacktivate\extension\icons

# Find any small PNG/JPG image (logo, avatar, etc.)
# Copy it 4 times with these names:
copy your-image.png icon16.png
copy your-image.png icon32.png
copy your-image.png icon48.png
copy your-image.png icon128.png

# Browser will auto-scale them
```

**Or skip icons for testing** - extension will still work, just no icon in toolbar.

### Step 3: Test It! (1 minute)

1. **Click extension icon** in Chrome toolbar
   - Should see popup with Dashboard/Passwords/Settings tabs
   - Stats should show 0, 0, 0, 0

2. **Visit any website**
   - Extension auto-scans for safety
   - Stats increment (Sites Scanned +1)

3. **Start the website**:
   ```bash
   cd D:\hacktivate
   npm run dev
   ```
   - Open http://localhost:5173
   - Go to Dashboard
   - Should see "Browser Extension Protection" card with live stats!

## Usage Examples

### 🛡️ Test Site Safety

Visit these (safe test domains):
- https://example.com (should be SAFE)
- https://google.com (should be SAFE)

Extension scores every site 0-100 and shows overlay if suspicious.

### 🔐 Test Password Manager

1. Go to any login page (e.g., github.com, twitter.com)
2. Enter fake credentials (don't submit if you don't want to!)
3. Submit form
4. Extension prompts: "Save password?"
5. Click extension icon → Passwords tab → See saved password!

### 🚫 Test Ad/Tracker Blocking

1. Visit any website with ads (news sites, YouTube, etc.)
2. Click extension icon
3. See "Ads Blocked" and "Trackers Blocked" counts increase!

### 🔄 Test USB Sync

1. Open website: http://localhost:5173
2. Go to USB Vault page
3. Create new vault (or unlock existing)
4. Click extension icon → Dashboard tab
5. Click "Sync with USB Vault"
6. Should show "✓ Synced!"

## Troubleshooting

### Can't load extension?
- Make sure "Developer Mode" is ON
- Check for red errors on extension card
- Try: Remove extension → Reload page → Add again

### No icon in toolbar?
- Add placeholder icons (see Step 2 above)
- Or ignore - extension still works without icons

### Stats not showing on website?
- Make sure website is running (`npm run dev`)
- Wait 5 seconds (auto-broadcast interval)
- Refresh website page
- Check browser console for errors

### Password save not working?
- Form must have username + password fields
- Wait 1 second after clicking Submit
- Check popup → Passwords tab to verify

## Next Steps

1. ✅ **Extension working?** Great! Now customize it:
   - Add more blocking rules in `extension/rules/`
   - Adjust threat scoring in `background.js`
   - Customize overlay colors in `content.js`

2. 🎨 **Create proper icons:**
   - Use Figma/Photoshop to create shield logo
   - Terminal green (#33ff00) on black (#000000)
   - Export at 16x16, 32x32, 48x48, 128x128

3. 📚 **Read full docs:**
   - `extension/README.md` - Detailed extension guide
   - `EXTENSION_INTEGRATION.md` - Complete technical docs

## Quick Reference

### Keyboard Shortcuts
- `Ctrl+Shift+E` - Open Extensions page
- Click extension icon - Open popup
- Right-click icon - Extension options

### Key Files
- `extension/manifest.json` - Extension config
- `extension/background.js` - Main logic (600+ lines)
- `extension/content.js` - Page injection (450+ lines)
- `extension/popup.html` - Popup UI
- `extension/rules/*.json` - Blocking rules

### Stats Meaning
- **Ads Blocked** - Ad network requests blocked
- **Trackers Blocked** - Analytics/tracking scripts blocked
- **Sites Scanned** - Total websites analyzed
- **Passwords Saved** - Credentials stored

## Demo Workflow

**Full Feature Test (5 minutes):**

1. Load extension ✓
2. Visit 3-4 websites → See "Sites Scanned" increment
3. Open website Dashboard → See extension stats card
4. Login to any site (or fake login) → Save password
5. Return to login page → See "Auto-fill" button
6. Click Auto-fill → Credentials filled!
7. Go to USB Vault → Create/Unlock vault
8. Click extension "Sync" → Passwords in USB now!
9. Check popup → See last sync timestamp

**Result:** Fully working browser extension with website integration! 🎉

---

**Need Help?** Check `extension/README.md` for detailed troubleshooting.

**Hackathon Judges?** See `EXTENSION_INTEGRATION.md` for technical deep-dive.
