    # Cyber Chaukidaar Setup Guide

## 🚀 Quick Start

Follow these steps to get Cyber Chaukidaar up and running:

### 1. Install Dependencies

\`\`\`powershell
npm install
\`\`\`

This will install:
- React & React DOM
- React Router
- Vite (build tool)
- Tailwind CSS
- Lucide React (icons)
- All development dependencies

### 2. Start Development Server

\`\`\`powershell
npm run dev
\`\`\`

The app will be available at: **http://localhost:3000**

### 3. Build for Production

\`\`\`powershell
npm run build
\`\`\`

Production files will be in the `dist/` folder.

### 4. Preview Production Build

\`\`\`powershell
npm run preview
\`\`\`

---

## 🔌 Browser Extension Setup

### Chrome/Edge/Brave

1. Open your browser
2. Navigate to extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`

3. Enable **Developer Mode** (toggle in top-right)

4. Click **"Load unpacked"**

5. Select the `extension` folder from this project

6. The Cyber Chaukidaar extension should now appear in your toolbar! 🛡️

### Testing the Extension

1. Click the Cyber Chaukidaar icon in your toolbar
2. You should see the popup with your security stats
3. Try navigating to different websites
4. The extension will analyze pages in real-time

---

## 📁 Project Structure Overview

\`\`\`
d:\\hacktivate\\
│
├── src/                     # Main web application
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── App.jsx             # Main app
│   └── main.jsx            # Entry point
│
├── extension/              # Browser extension
│   ├── manifest.json       # Extension config
│   ├── popup.html          # Extension popup
│   ├── popup.js            # Popup logic
│   ├── background.js       # Background worker
│   ├── content.js          # Page scanner
│   └── content.css         # Injection styles
│
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind theme
└── package.json            # Dependencies
\`\`\`

---

## 🎨 Design System

### Terminal CLI Aesthetic

- **Font**: JetBrains Mono (monospace)
- **Primary Color**: Terminal Green (#33ff00)
- **Background**: Deep Black (#0a0a0a)
- **Border Style**: Sharp rectangles (no rounded corners)
- **Effects**: CRT scanlines, blinking cursor, text glow

### Key Components

All components follow the terminal aesthetic:

- **Button**: Bracketed text `[ ACTION ]`
- **Card**: Bordered windows with optional headers
- **Input**: Command-line style with prompt
- **ProgressBar**: ASCII-style `[||||||||....]`
- **StatusBadge**: Prefixed with `[OK]`, `[ERR]`, `[WARN]`

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file from `.env.example`:

\`\`\`env
VITE_APP_API_BASE_URL=http://localhost:8787
BREACH_API_TOKEN=your_breach_api_token
OPENROUTER_API_KEY=your_openrouter_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
\`\`\`

Important:
- Keep secrets only in `.env` (ignored by git).
- Do not place API tokens in frontend files.

### Tailwind Customization

Edit `tailwind.config.js` to customize colors:

\`\`\`javascript
colors: {
  terminal: {
    bg: '#0a0a0a',        // Background
    green: '#33ff00',     // Primary
    amber: '#ffb000',     // Warning
    muted: '#3A9B3A',     // Muted
    red: '#ff3333',       // Error
    border: '#3A9B3A',    // Borders
  }
}
\`\`\`

---

## 🧪 Testing Features

### Dashboard
- View your Cyber Hygiene Score
- See real-time threat log
- Check system statistics

### Scam Analyzer
- Test with phishing email text
- Try suspicious URLs
- See threat indicators

### Breach Checker
- Enter an email address
- View breach history (uses mock data)
- Get security recommendations

### AI Coach
- Ask security questions
- Get instant guidance
- Try quick question templates

---

## 🐛 Troubleshooting

### Port 3000 Already in Use

\`\`\`powershell
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Or change port in vite.config.js
\`\`\`

### Extension Not Loading

- Make sure you're loading the `extension` folder, not the root
- Check that Developer Mode is enabled
- Try reloading the extension

### Styles Not Applying

\`\`\`powershell
# Rebuild Tailwind
npm run dev
\`\`\`

### Dependencies Issues

\`\`\`powershell
# Clear and reinstall
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
\`\`\`

---

## 📚 Next Steps

1. **Integrate Real APIs**: Replace mock data with actual breach databases
2. **Add Authentication**: Implement user accounts
3. **USB Key Feature**: Build the secure USB recovery system
4. **Mobile App**: Create companion mobile app
5. **Advanced AI**: Enhance AI coach with GPT-4

---

## 🎯 Development Workflow

### Adding a New Page

1. Create component in `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Navigation.jsx`

### Creating a Component

1. Create file in `src/components/MyComponent.jsx`
2. Export from `src/components/index.js`
3. Use terminal design system classes

### Styling Guidelines

- Use Tailwind utility classes
- Stick to terminal color palette
- No rounded corners (`rounded-none`)
- Use monospace font (`font-mono`)
- Add text glow for emphasis (`text-shadow-terminal`)

---

## 💡 Tips

- Keep the terminal aesthetic consistent
- Use ASCII art for visual interest
- Add typing animations for dynamic text
- Implement blinking cursor for inputs
- Use status badges for state indicators

---

**Ready to launch! 🚀**

Run `npm run dev` and start building!
