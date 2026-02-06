# 🛡️ Cyber Chaukidaar

**Complete Cybersecurity Ecosystem - Powered by OrderOfPhoenix**

Cyber Chaukidaar is a comprehensive cybersecurity platform with **website**, **USB Vault**, and **browser extension** - all working together to protect you from scams, breaches, phishing, and digital threats.

> *Cyber attacks don't hack machines — they hack people.*

## 🚀 Features

### 🔌 Browser Extension (**NEW!** - Fully Integrated)
- ✅ **Site Safety Checker** - Real-time threat analysis with full-screen overlays
- ✅ **Ad Blocker** - 12 major ad networks blocked (uBlock Origin style)
- ✅ **Tracker Blocker** - 13 tracking scripts blocked (Google Analytics, Facebook, etc.)
- ✅ **Password Manager** - Auto-save, auto-fill, strength checker (100-point scale)
- ✅ **USB Vault Sync** - Hardware-backed password encryption
- ✅ **Live Stats** - Dashboard integration with real-time updates

**📦 Extension Location:** `extension/` directory
**📖 Quick Start:** See `EXTENSION_QUICKSTART.md`
**📚 Full Docs:** See `extension/README.md` and `EXTENSION_INTEGRATION.md`

### 📊 Web Platform (Command Center)
- **Dashboard** - Extension stats, cyber hygiene score, threat log
- **Breach Checker** ✅ **LIVE** - 15B+ records via LeakOSINT API (uncensored data)
- **Scam Analyzer** ✅ **LIVE** - 200+ keyword pattern detection (no API needed)
- **AI Coach** ✅ **LIVE** - OpenRouter API (nvidia/nemotron-3-nano-30b-a3b:free)
- **USB Vault** ✅ **LIVE** - Hardware-backed AES-256-GCM encryption
- **Browser Extension Integration** ✅ **LIVE** - Real-time sync

### 💾 USB Vault (Hardware Security)
- ✅ **AES-256-GCM Encryption** - Military-grade security
- ✅ **Device-Bound Keys** - PBKDF2 with 100k iterations
- ✅ **12-Word Recovery Phrases** - BIP39 standard
- ✅ **Domain Whitelisting** - Only trusted domains can decrypt
- ✅ **Tamper Detection** - Magic bytes, checksums, access counting
- ✅ **Extension Sync** - Store browser passwords on USB
- ✅ **Auto-Lock** - 5-minute inactivity timeout

## 🎨 Design System

This project uses a **Terminal CLI aesthetic** with:
- Monospace typography (JetBrains Mono)
- Terminal green (#33ff00) on black (#000)
- Zero rounded corners (pure rectangles)
- CRT scanline effects
- ASCII art and animations
- Command-line inspired UI elements

**Brand:** Cyber Chaukidaar (chowkidar = guardian in Hindi)
**Powered by:** OrderOfPhoenix

## 🛠️ Tech Stack

### Website
- **Frontend**: React 18.2.0 + Vite 5.0.8
- **Styling**: Tailwind CSS (custom Terminal theme)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **APIs**: 
  - LeakOSINT (breach data - 15B+ records)
  - OpenRouter (AI chat - nvidia/nemotron model)

### Browser Extension
- **Manifest**: V3 (latest Chrome standard)
- **Background**: Service Worker (600+ lines)
- **Content Scripts**: Page injection (450+ lines)
- **Popup**: 3-tab UI (Dashboard/Passwords/Settings)
- **Blocking**: declarativeNetRequest API
- **Storage**: chrome.storage.local (encrypted)

### USB Vault
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Key Derivation**: PBKDF2 (SHA-256, 100k iterations)
- **File Access**: File System Access API
- **Recovery**: BIP39 word list (12 words)

## 📦 Installation

1. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

2. **Start development server:**
\`\`\`bash
npm run dev
\`\`\`

3. **Build for production:**
\`\`\`bash
npm run build
\`\`\`

## 🔌 Browser Extension Setup

1. Build the extension (if needed)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` directory

## 📁 Project Structure

\`\`\`
cyber-chaukidaar/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── TypingText.jsx
│   │   ├── Separator.jsx
│   │   ├── ASCIIArt.jsx
│   │   ├── CRTOverlay.jsx
│   │   ├── Navigation.jsx
│   │   └── Layout.jsx
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx
│   │   ├── ScamAnalyzer.jsx
│   │   ├── BreachChecker.jsx
│   │   └── AICoach.jsx
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── extension/               # Browser extension
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   ├── content.js
│   └── content.css
├── public/                  # Static assets
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
\`\`\`

## 🎯 Key Components

### Dashboard
- Cyber Hygiene Score with visual progress bars
- Real-time threat log
- System statistics
- Quick action buttons

### Scam Analyzer
- Text/URL input for analysis
- Threat detection with confidence scores
- Visual indicators for scam patterns
- Actionable recommendations

### Breach Checker
- Email address lookup
- Database of 15B+ breach records
- Detailed breach information
- Security recommendations

### AI Coach
- Interactive chat interface
- Security guidance and tips
- Quick question templates
- Context-aware responses

## 🎨 Design Tokens

\`\`\`css
--terminal-bg: #0a0a0a
--terminal-green: #33ff00
--terminal-amber: #ffb000
--terminal-muted: #3A9B3A
--terminal-red: #ff3333
--terminal-border: #3A9B3A
\`\`\`

## 🔧 Customization

### Colors
Edit `tailwind.config.js` to modify the color scheme:

\`\`\`javascript
colors: {
  terminal: {
    bg: '#0a0a0a',
    green: '#33ff00',
    // ...
  }
}
\`\`\`

### Typography
Change the font in `tailwind.config.js`:

\`\`\`javascript
fontFamily: {
  mono: ['"JetBrains Mono"', 'monospace'],
}
\`\`\`

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ⚡ by developers who believe security should be accessible to everyone.**
\`\`\`

$ SYSTEM_STATUS: [OPERATIONAL]
$ THREATS_BLOCKED: 1,337
$ UPTIME: 99.9%
\`\`\`
