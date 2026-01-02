# TokenGate Chrome Extension

Block distracting websites until you've hit your daily AI coding token goals.

## Installation

### Load Unpacked (Development)

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `packages/extension` folder
5. The TokenGate icon should appear in your toolbar

### Prerequisites

The extension requires the TokenGate server to be running:

```bash
# In a separate terminal
bunx tokengate-server
```

## Usage

### Quick Status (Popup)

Click the TokenGate icon in your toolbar to see:

- Current token count vs your threshold
- Progress bar visualization
- Connection status
- Quick enable/disable toggle

### Settings (Options Page)

Right-click the extension icon → "Options" (or click "Settings" in popup) to:

- Add/remove blocked domains
- Set your token threshold
- Configure server URL
- Test server connection

## Default Blocked Domains

The extension comes pre-configured to block:

- x.com / twitter.com
- reddit.com
- youtube.com
- netflix.com
- instagram.com
- facebook.com

## How It Works

1. When you navigate to a blocked domain, the extension checks your token usage
2. If you haven't hit your threshold, a full-page overlay appears
3. The overlay shows your progress and encourages you to get back to work
4. Once you hit your token goal, sites automatically unblock

## Wildcard Domains

You can use wildcards to block all subdomains:

- `*.reddit.com` blocks `old.reddit.com`, `new.reddit.com`, etc.
- `reddit.com` only blocks `reddit.com` and `www.reddit.com`

## Offline Behavior

If the TokenGate server isn't running:

- Sites are NOT blocked
- A warning overlay appears with instructions to start the server
- This prevents you from being locked out if something goes wrong

## Troubleshooting

### "Cannot connect to server"

1. Make sure the server is running: `bunx tokengate-server`
2. Check the server URL in extension settings (default: `http://localhost:3847`)
3. Try visiting `http://localhost:3847/health` in your browser

### Extension not blocking sites

1. Check that the extension is enabled (toggle in popup)
2. Verify the domain is in your blocked list (settings)
3. Check your token threshold isn't set too low

### Progress not updating

- The extension fetches fresh data when you navigate
- The popup auto-refreshes every 5 seconds when open
- Server data is cached for 30 seconds by default

## Files

```
extension/
├── manifest.json      # Extension configuration
├── background.js      # Service worker (checks navigation)
├── content.js         # Injects blocking overlay
├── blocked.css        # Overlay styles
├── popup.html/js/css  # Toolbar popup
├── options.html/js/css # Settings page
├── utils.js           # Shared utilities
└── icons/             # Extension icons
```

## Development

The extension uses vanilla JavaScript (no build step required). Just edit files and reload the extension in `chrome://extensions`.
