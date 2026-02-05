# 🔧 Manual Testing Guide - Cyber Chaukidaar Extension

## Quick Diagnostic (2 minutes)

### Step 1: Reload Extension
```
1. Go to: chrome://extensions/
2. Find "Cyber Chaukidaar"
3. Click reload icon (⟳)
4. **Close ALL browser tabs**
5. Open new tab
```

### Step 2: Check Console Logs

**Open Browser Console (on ANY webpage):**
```
1. Press F12 (or Ctrl+Shift+I)
2. Click "Console" tab
3. Look for this message:
   "Cyber Chaukidaar: Content script loaded"
```

**✓ If you see it:** Content script is working
**✗ If you don't:** Content script failed to load - check Step 3

### Step 3: Check Background Worker

```
1. Go to: chrome://extensions/
2. Find "Cyber Chaukidaar"
3. Look for blue link: "service worker"
4. Click it (opens DevTools)
5. Check Console tab for errors
```

**Look for:**
- ✓ "Cyber Chaukidaar Extension Installed"
- ✗ Red error messages (screenshot these)

### Step 4: Test Safety Overlay

```
1. Go to any website (e.g., google.com)
2. Wait 1-2 seconds
3. Look for GREEN BANNER at top of page
```

**Expected:**
- Green banner appears: "✓ CYBER CHAUKIDAAR: [site] is SAFE"
- Auto-closes after 3 seconds
- Click CLOSE button to dismiss

**In Browser Console (F12), you should see:**
```
Cyber Chaukidaar: Scanning site: google.com
Cyber Chaukidaar: Safety check result: {threat: "SAFE", ...}
Cyber Chaukidaar: Safety result sent to tab
Cyber Chaukidaar: Received safety check, threat level: SAFE
```

**✗ If no banner appears:**
- Check console for messages
- Verify content script loaded (Step 2)
- Check for JavaScript errors

### Step 5: Test Password Save

```
1. Open: extension/test.html (drag into Chrome)
2. Scroll to "Password Manager Test" section
3. Fill in username and password (already filled)
4. Click "Submit Test Form"
5. Wait 0.5 seconds
```

**Expected:**
- Browser confirm() dialog appears
- Message: "Save password for [site]?"
- Click OK to save

**In Browser Console, you should see:**
```
Cyber Chaukidaar: Form submit handler called
Cyber Chaukidaar: Username field: true Password field: true
Cyber Chaukidaar: Username: testuser@example.com Password length: 15
Cyber Chaukidaar: Will prompt to save in 0.5 seconds...
```

**✗ If no prompt appears:**
- Check console messages above
- If no logs appear, content script isn't running
- If logs appear but no prompt, check background worker console for errors

### Step 6: Test Stats Update

```
1. Click extension icon in toolbar (puzzle piece)
2. Popup should open with 3 tabs
3. Watch the numbers
```

**Expected:**
- Numbers auto-update every 2 seconds
- "Sites Scanned" should increase as you browse
- Last Sync should show "Never" or timestamp

**In Background Worker Console:**
```
Total passwords saved: X
✓ Saved new password for user@domain
```

### Step 7: Check Password Storage

```
1. Click extension icon
2. Go to "Passwords" tab
3. Should see saved passwords
```

**Expected:**
- List of domains and usernames
- Password strength (WEAK/MEDIUM/STRONG)
- Copy and Delete buttons

## Common Issues & Fixes

### Issue: No "Content script loaded" message

**Cause:** Content script not injecting

**Fix:**
```
1. Check manifest.json has:
   "content_scripts": [
     {
       "matches": ["<all_urls>"],
       "js": ["content.js"],
       ...
     }
   ]

2. Go to chrome://extensions/
3. Make sure extension shows "Content scripts: 1"
4. Reload extension
5. **Close ALL tabs and reopen**
```

### Issue: Service worker not responding

**Cause:** Background worker crashed

**Fix:**
```
1. chrome://extensions/
2. Find "Cyber Chaukidaar"
3. Look for "service worker (inactive)"
4. Click it to restart
5. Reload extension if needed
```

### Issue: Stats not updating in popup

**Cause:** Timer not running or messages not being received

**Check:**
```
1. Open extension popup
2. Open browser DevTools (F12)
3. Right-click popup → Inspect
4. Check Console for errors
```

### Issue: Password save prompt appears twice

**Cause:** Form monitored multiple times

**Fix:**
- Already handled - form.dataset.cyberMonitored prevents this
- If still happens, reload extension

### Issue: Overlay doesn't appear

**Cause 1:** Content script not running → See Step 2
**Cause 2:** Message not reaching content script → Check background worker

**Debug:**
```
Background worker console should show:
  "Cyber Chaukidaar: Scanning site: X"
  "Cyber Chaukidaar: Safety result sent to tab X"

Page console should show:
  "Cyber Chaukidaar: Received safety check, threat level: X"
```

## Extension File Checklist

Verify these files exist:
```
extension/
├── manifest.json          ✓ Extension config
├── background.js          ✓ Service worker (655 lines)
├── content.js             ✓ Injected script (572 lines)
├── popup.html             ✓ Popup UI
├── popup.js               ✓ Popup logic (306 lines)
├── content.css            ✓ Content styles
├── rules/
│   ├── ads.json          ✓ Ad blocking rules (18 rules)
│   └── trackers.json     ✓ Tracker rules (13 rules)
└── icons/                 ⚠ Optional (extension works without)
```

## Quick Test Results Template

Copy this and fill in your results:

```
Extension Reload: [ ] Done
Content Script Loaded: [ ] Yes [ ] No
Background Worker Running: [ ] Yes [ ] No
Safety Overlay Appears: [ ] Yes [ ] No
Password Prompt Shows: [ ] Yes [ ] No
Stats Auto-Update: [ ] Yes [ ] No
Passwords Tab Shows List: [ ] Yes [ ] No

Console Errors (if any):
_______________________________________________
_______________________________________________
_______________________________________________

Browser: Chrome / Edge / Other: _____________
Version: _____________
```

## Still Not Working?

1. **Export browser console:**
   - Right-click in Console → Save as...
   - Share the log file

2. **Check extension errors:**
   - chrome://extensions/
   - Click "Errors" button
   - Screenshot the errors

3. **Test in Incognito:**
   - chrome://extensions/
   - Enable "Allow in incognito"
   - Open incognito window
   - Test again

4. **Reinstall extension:**
   - Remove extension
   - Delete extension folder
   - Re-extract/download
   - Load unpacked again

---

**After testing, report:**
- Which steps passed ✓
- Which steps failed ✗
- Console log messages
- Any error screenshots
