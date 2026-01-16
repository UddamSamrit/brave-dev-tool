# Brave Dev Tool

A powerful development tool extension for Brave and Chrome browsers. View page info, inspect elements, monitor network resources, and more.

## Features

- **Page Information**: View current page URL and title (click to copy)
- **Quick Actions**: Refresh page, console helper, clear storage
- **Developer Tools**: Inspect elements, network monitor
- **Clean UI**: Modern, white-themed interface

## Installation

### Step 1: Generate Icons (Optional)

Create icon files in the `icons/` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can use any image editor or online tool. The extension works without icons (uses default).

### Step 2: Load Extension

1. Open Brave browser
2. Go to `brave://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `brave-tool` folder
6. Done! ✅

## Usage

1. Click the extension icon in the toolbar
2. The popup shows:
   - Current page URL and title (click to copy)
   - Action buttons
   - Developer tools

### Features Guide

- **Click URL/Title**: Copies to clipboard
- **Refresh Page**: Reloads current page
- **Console Helper**: Shows keyboard shortcuts (F12)
- **Inspect Element**: Hover over elements, click to inspect (ESC to exit)
- **Network Monitor**: Analyzes page resources (check console F12)
- **Clear Storage**: Clears extension storage

## File Structure

```
brave-tool/
├── manifest.json       # Extension manifest (Manifest V3)
├── popup.html         # Popup UI
├── popup.js           # Popup functionality
├── popup.css          # Popup styling
├── background.js      # Background service worker
├── content.js         # Content script
├── icons/             # Extension icons (optional)
└── README.md          # This file
```

## Development

1. Make your changes
2. Go to `brave://extensions/`
3. Click refresh icon on extension card
4. Test your changes

## Publishing

### Chrome Web Store ($5 one-time)

1. Register at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) ($5 one-time)
2. Create zip file of extension folder (exclude README.md)
3. Upload to Chrome Web Store
4. Fill in listing details
5. Submit for review

**Note**: Publishing to Chrome Web Store makes it available for both Chrome AND Brave users!

### Free Distribution

**GitHub Releases**
1. Create GitHub repository
2. Create zip file of extension folder
3. Upload zip to GitHub Releases
4. Users download and "Load unpacked"

**Direct Distribution**
- Share zip folder
- Users enable Developer mode and load unpacked

## Browser Compatibility

- ✅ Brave browser
- ✅ Chrome browser
- ✅ Edge browser
- ✅ Other Chromium-based browsers

## Permissions

- `activeTab`: Access current tab
- `storage`: Store extension settings
- `scripting`: Inject scripts for features

## Troubleshooting

**Extension Not Loading**
- Check all files are in correct location
- Verify `manifest.json` is valid
- Check browser console for errors (F12)

**Icons Not Showing**
- Generate icons using `generate_icons.html`
- Save to `icons/` folder
- Extension works without icons (uses default)

**Features Not Working**
- Reload extension after changes
- Check browser console for errors
- Make sure you're on a regular website (not `chrome://` pages)

## License

MIT
