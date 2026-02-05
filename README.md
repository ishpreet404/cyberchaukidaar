# 🛡️ CyberGuard

**Personal Cyber Hygiene & Risk Prevention Platform**

CyberGuard is a pure-software cybersecurity ecosystem designed to protect individuals from scams, phishing, data breaches, and risky digital behavior. It focuses on prevention, behavior analysis, and recovery, not just detection.

> *Cyber attacks don't hack machines — they hack people.*

## 🚀 Features

### 🌐 Browser Extension (Real-Time Protection)
- Website safety checker (malicious & look-alike domains)
- Scam & phishing link warnings
- Ad & tracker blocking (malvertising prevention)
- Lightweight password hygiene checks
- Real-time sync with web dashboard

### 📊 Web Platform (Command Center)
- **Cyber Hygiene Score** (0–100) with trends
- **Scam & Phishing Analyzer** (email, SMS, URLs)
- **AI Cyber Coach** (chat-based guidance)
- **Real-time browser activity** insights
- **Data Breach Exposure Checker** ✅ **LIVE with LeakOSINT API** - 15B+ records
- **Digital Safety Vault** (encrypted notes & recovery info)

### 🔑 Secure USB Recovery Key (Planned)
- Encrypted password & recovery storage (offline)
- High-risk action confirmation (anti-scam pause)
- Account recovery without email/SMS
- USB-based identity verification

## 🎨 Design System

This project uses a **Terminal CLI aesthetic** with:
- Monospace typography (JetBrains Mono)
- Terminal green (#33ff00) on black (#0a0a0a)
- Zero rounded corners (pure rectangles)
- CRT scanline effects
- ASCII art and animations
- Command-line inspired UI elements

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (custom theme)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **API**: LeakOSINT (15B+ breach records)
- **Browser Extension**: Chrome Extension Manifest V3

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
cyberguard/
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
--terminal-muted: #1f521f
--terminal-red: #ff3333
--terminal-border: #1f521f
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
